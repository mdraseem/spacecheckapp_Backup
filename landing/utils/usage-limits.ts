import { SupabaseClient } from '@supabase/supabase-js'

export const PLAN_LIMITS = {
  starter: 3,
  growth: 50,
} as const

export type PlanType = keyof typeof PLAN_LIMITS

export interface UsageInfo {
  currentUsage: number
  limit: number
  planType: PlanType
  remaining: number
  hasExceeded: boolean
}

/**
 * Get the user's current monthly usage and limit
 */
export async function getUserUsage(
  supabase: SupabaseClient,
  userId: string
): Promise<UsageInfo> {
  // Get user's plan
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan_type, subscription_status')
    .eq('id', userId)
    .single()

  const planType = (profile?.plan_type || 'starter') as PlanType
  const limit = PLAN_LIMITS[planType]

  // Count generations this month
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const { count } = await supabase
    .from('generations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString())

  const currentUsage = count || 0
  const remaining = Math.max(0, limit - currentUsage)
  const hasExceeded = currentUsage >= limit

  return {
    currentUsage,
    limit,
    planType,
    remaining,
    hasExceeded,
  }
}

/**
 * Check if user can create a new generation
 */
export async function canCreateGeneration(
  supabase: SupabaseClient,
  userId: string
): Promise<{ allowed: boolean; usage: UsageInfo; error?: string }> {
  const usage = await getUserUsage(supabase, userId)

  if (usage.hasExceeded) {
    return {
      allowed: false,
      usage,
      error: `You've reached your monthly limit of ${usage.limit} model generations. Upgrade to continue.`,
    }
  }

  return {
    allowed: true,
    usage,
  }
}
