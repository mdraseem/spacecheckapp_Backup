import { SupabaseClient } from '@supabase/supabase-js'

// ==========================================
// Business model:
//   - Generation is FREE (no credits needed)
//   - Credits are used to UNLOCK models (download, share, QR)
//   - Credit packs: 1 for $7, 5 for $29, 20 for $99
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
  unlockedModels: number
  lockedModels: number
}

export interface UsageInfo {
  // Legacy compatibility fields
  currentUsage: number
  limit: number
  planType: string
  billingSource: BillingSource
  remaining: number
  hasExceeded: boolean
  // Credit fields
  creditBalance: number
  hostingStatus: HostingStatus
  hostingExpiresAt: string | null
  activeModels: number
  archivedModels: number
  unlockedModels: number
  lockedModels: number
}

/**
 * Get the user's credit balance, model counts, and unlock status.
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
  // Keep hosting status for legacy subscribers, but default to 'active' for new model
  const hostingStatus = (profile?.hosting_status || 'active') as HostingStatus
  const hostingExpiresAt = profile?.hosting_expires_at || null
  const billingSource = (profile?.billing_source || 'stripe') as BillingSource

  // Count total non-deleted models
  const { count: totalCount } = await supabase
    .from('generations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('deleted_at', null)

  // Count unlocked models
  const { count: unlockedCount } = await supabase
    .from('generations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_unlocked', true)
    .is('deleted_at', null)

  const totalModels = totalCount || 0
  const unlockedModels = unlockedCount || 0
  const lockedModels = totalModels - unlockedModels

  // Legacy: count active/archived for backward compat
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
    totalModels,
    unlockedModels,
    lockedModels,
  }
}

/**
 * Get legacy-compatible usage info.
 */
export async function getUserUsage(
  supabase: SupabaseClient,
  userId: string
): Promise<UsageInfo> {
  const info = await getUserCreditsAndHosting(supabase, userId)

  return {
    // Legacy fields
    currentUsage: 0,
    limit: info.creditBalance,
    planType: info.hostingStatus === 'active' ? 'pro' : 'free',
    billingSource: info.billingSource,
    remaining: info.creditBalance,
    hasExceeded: info.creditBalance <= 0,
    // Credit fields
    creditBalance: info.creditBalance,
    hostingStatus: info.hostingStatus,
    hostingExpiresAt: info.hostingExpiresAt,
    activeModels: info.activeModels,
    archivedModels: info.archivedModels,
    unlockedModels: info.unlockedModels,
    lockedModels: info.lockedModels,
  }
}

/**
 * Check if user can create a new generation.
 * Generation is always FREE — no credits needed.
 */
export async function canCreateGeneration(
  supabase: SupabaseClient,
  userId: string
): Promise<{ allowed: boolean; creditBalance: number; usage: UsageInfo; error?: string }> {
  const usage = await getUserUsage(supabase, userId)

  // Generation is free — always allowed
  return {
    allowed: true,
    creditBalance: usage.creditBalance,
    usage,
  }
}

/**
 * Check if user can unlock a model.
 *
 * Shopify-billed users with an active subscription get unlimited unlocks
 * (their plan, not credits, gates usage). Direct (Stripe) users need credits.
 */
export async function canUnlockModel(
  supabase: SupabaseClient,
  userId: string
): Promise<{ allowed: boolean; creditBalance: number; error?: string; bypassCredit?: boolean }> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('credit_balance, billing_source, shopify_subscription_status, plan_type')
    .eq('id', userId)
    .single()

  const creditBalance = profile?.credit_balance ?? 0

  // Shopify-billed users with an active subscription bypass the credit system.
  // Their plan (configured in Shopify Managed Pricing) governs usage instead.
  const isShopifyActive =
    profile?.billing_source === 'shopify' &&
    (profile?.shopify_subscription_status === 'active' ||
      profile?.plan_type === 'growth')

  if (isShopifyActive) {
    return {
      allowed: true,
      creditBalance,
      bypassCredit: true,
    }
  }

  if (creditBalance <= 0) {
    return {
      allowed: false,
      creditBalance,
      error: 'No credits remaining. Purchase credits to unlock this model.',
    }
  }

  return {
    allowed: true,
    creditBalance,
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
 * Check if a model is unlocked (for the AR viewer / share / download).
 */
export async function isModelUnlocked(
  supabase: SupabaseClient,
  generationId: string
): Promise<boolean> {
  const { data: generation } = await supabase
    .from('generations')
    .select('is_unlocked')
    .eq('id', generationId)
    .single()

  return generation?.is_unlocked === true
}

/**
 * Unlock a model (after payment).
 */
export async function unlockModel(
  supabase: SupabaseClient,
  generationId: string
): Promise<void> {
  const { error } = await supabase
    .from('generations')
    .update({ is_unlocked: true, is_public: true })
    .eq('id', generationId)

  if (error) {
    throw new Error('Failed to unlock model')
  }
}

/**
 * Legacy: Check if a user's hosting is active.
 * Kept for backward compatibility with existing subscribers.
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
 * Legacy: Activate the 7-day free hosting trial.
 * No longer called for new users, kept for backward compat.
 */
export async function activateHostingTrial(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  // No-op in new model — hosting trial is no longer used
  return
}
