import { SupabaseClient } from '@supabase/supabase-js'

// ==========================================
// Credit + Active Hosting business logic
// ==========================================

export type HostingStatus = 'active' | 'trial' | 'paused'
export type BillingSource = 'stripe' | 'shopify'

export interface CreditAndHostingInfo {
  creditBalance: number
  hostingStatus: HostingStatus
  hostingExpiresAt: string | null
  billingSource: BillingSource
  activeModels: number
  archivedModels: number
  totalModels: number
}

export interface UsageInfo {
  // Legacy compatibility fields
  currentUsage: number
  limit: number
  planType: string
  billingSource: BillingSource
  remaining: number
  hasExceeded: boolean
  // New credit + hosting fields
  creditBalance: number
  hostingStatus: HostingStatus
  hostingExpiresAt: string | null
  activeModels: number
  archivedModels: number
}

/**
 * Get the user's credit balance, hosting status, and model counts.
 */
export async function getUserCreditsAndHosting(
  supabase: SupabaseClient,
  userId: string
): Promise<CreditAndHostingInfo> {
  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('credit_balance, hosting_status, hosting_expires_at, billing_source, plan_type, subscription_status')
    .eq('id', userId)
    .single()

  const creditBalance = profile?.credit_balance ?? 1
  let hostingStatus = (profile?.hosting_status || 'trial') as HostingStatus
  const hostingExpiresAt = profile?.hosting_expires_at || null
  const billingSource = (profile?.billing_source || 'stripe') as BillingSource

  // Check if trial has expired
  if (hostingStatus === 'trial' && hostingExpiresAt) {
    const expiresAt = new Date(hostingExpiresAt)
    if (expiresAt < new Date()) {
      hostingStatus = 'paused'
      // Update in DB (fire-and-forget)
      supabase
        .from('profiles')
        .update({ hosting_status: 'paused' })
        .eq('id', userId)
        .then(() => {})
    }
  }

  // Count models
  const { count: activeCount } = await supabase
    .from('generations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_public', true)
    .is('deleted_at', null)

  const { count: archivedCount } = await supabase
    .from('generations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_public', false)
    .is('deleted_at', null)
    .not('archived_at', 'is', null)

  const activeModels = activeCount || 0
  const archivedModels = archivedCount || 0

  return {
    creditBalance,
    hostingStatus,
    hostingExpiresAt,
    billingSource,
    activeModels,
    archivedModels,
    totalModels: activeModels + archivedModels,
  }
}

/**
 * Get legacy-compatible usage info (for backward compatibility with existing UI).
 * Maps the new credit system into the old interface shape.
 */
export async function getUserUsage(
  supabase: SupabaseClient,
  userId: string
): Promise<UsageInfo> {
  const info = await getUserCreditsAndHosting(supabase, userId)

  return {
    // Legacy fields — creditBalance acts as "remaining"
    currentUsage: 0,
    limit: info.creditBalance,
    planType: info.hostingStatus === 'active' ? 'pro' : 'free',
    billingSource: info.billingSource,
    remaining: info.creditBalance,
    hasExceeded: info.creditBalance <= 0,
    // New fields
    creditBalance: info.creditBalance,
    hostingStatus: info.hostingStatus,
    hostingExpiresAt: info.hostingExpiresAt,
    activeModels: info.activeModels,
    archivedModels: info.archivedModels,
  }
}

/**
 * Check if user can create a new generation (has credits available).
 */
export async function canCreateGeneration(
  supabase: SupabaseClient,
  userId: string
): Promise<{ allowed: boolean; creditBalance: number; usage: UsageInfo; error?: string }> {
  const usage = await getUserUsage(supabase, userId)

  if (usage.creditBalance <= 0) {
    return {
      allowed: false,
      creditBalance: usage.creditBalance,
      usage,
      error: 'You have no credits remaining. Purchase more credits to generate a new model.',
    }
  }

  return {
    allowed: true,
    creditBalance: usage.creditBalance,
    usage,
  }
}

/**
 * Deduct one credit from the user's balance.
 * Returns the new balance, or throws if insufficient credits.
 */
export async function deductCredit(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  // Use RPC or a direct update with check
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('credit_balance')
    .eq('id', userId)
    .single()

  if (fetchError || !profile) {
    throw new Error('Failed to fetch user profile')
  }

  if (profile.credit_balance <= 0) {
    throw new Error('Insufficient credits')
  }

  const newBalance = profile.credit_balance - 1

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ credit_balance: newBalance })
    .eq('id', userId)

  if (updateError) {
    throw new Error('Failed to deduct credit')
  }

  return newBalance
}

/**
 * Add credits to a user's balance (after purchase).
 */
export async function addCredits(
  supabase: SupabaseClient,
  userId: string,
  amount: number
): Promise<number> {
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('credit_balance')
    .eq('id', userId)
    .single()

  if (fetchError || !profile) {
    throw new Error('Failed to fetch user profile')
  }

  const newBalance = profile.credit_balance + amount

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ credit_balance: newBalance })
    .eq('id', userId)

  if (updateError) {
    throw new Error('Failed to add credits')
  }

  return newBalance
}

/**
 * Check if a user's hosting is active (for the AR viewer).
 * Returns true if the user has an active or valid trial hosting status.
 */
export async function isHostingActive(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('hosting_status, hosting_expires_at')
    .eq('id', userId)
    .single()

  if (!profile) return false

  const status = profile.hosting_status as HostingStatus

  if (status === 'active') return true

  if (status === 'trial' && profile.hosting_expires_at) {
    return new Date(profile.hosting_expires_at) > new Date()
  }

  return false
}

/**
 * Activate the 7-day free hosting trial for a user (on first generation).
 */
export async function activateHostingTrial(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('hosting_status, hosting_expires_at')
    .eq('id', userId)
    .single()

  // Only activate trial if user hasn't had one yet and isn't already a subscriber
  if (profile?.hosting_status === 'active') return
  if (profile?.hosting_expires_at) return // Already had a trial

  const trialExpiry = new Date()
  trialExpiry.setDate(trialExpiry.getDate() + 7)

  await supabase
    .from('profiles')
    .update({
      hosting_status: 'trial',
      hosting_expires_at: trialExpiry.toISOString(),
    })
    .eq('id', userId)
}
