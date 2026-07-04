export type HostingStatus = 'active' | 'trial' | 'paused';
export type BillingSource = 'stripe' | 'shopify';

export interface CreditAndHostingInfo {
  creditBalance: number;
  hostingStatus: HostingStatus;
  hostingExpiresAt: string | null;
  billingSource: BillingSource;
  activeModels: number;
  archivedModels: number;
  totalModels: number;
  unlockedModels: number;
  lockedModels: number;
}

export interface UsageInfo {
  currentUsage: number;
  limit: number;
  planType: string;
  billingSource: BillingSource;
  remaining: number;
  hasExceeded: boolean;
  creditBalance: number;
  hostingStatus: HostingStatus;
  hostingExpiresAt: string | null;
  activeModels: number;
  archivedModels: number;
  unlockedModels: number;
  lockedModels: number;
}

// Mock implementations returning static data
export async function getUserCreditsAndHosting(_supabase: any, _userId: string): Promise<CreditAndHostingInfo> {
  return {
    creditBalance: 999,
    hostingStatus: 'active',
    hostingExpiresAt: null,
    billingSource: 'stripe',
    activeModels: 5,
    archivedModels: 0,
    totalModels: 5,
    unlockedModels: 5,
    lockedModels: 0,
  };
}

export async function getUserUsage(supabase: any, userId: string): Promise<UsageInfo> {
  const info = await getUserCreditsAndHosting(supabase, userId);
  return {
    currentUsage: 0,
    limit: info.creditBalance,
    planType: info.hostingStatus === 'active' ? 'pro' : 'free',
    billingSource: info.billingSource,
    remaining: info.creditBalance,
    hasExceeded: info.creditBalance <= 0,
    creditBalance: info.creditBalance,
    hostingStatus: info.hostingStatus,
    hostingExpiresAt: info.hostingExpiresAt,
    activeModels: info.activeModels,
    archivedModels: info.archivedModels,
    unlockedModels: info.unlockedModels,
    lockedModels: info.lockedModels,
  };
}

export async function canCreateGeneration(_supabase: any, _userId: string) {
  const usage = await getUserUsage(_supabase, _userId);
  return { allowed: true, creditBalance: usage.creditBalance, usage };
}

export async function canUnlockModel(_supabase: any, _userId: string) {
  // Mock: always allowed, bypass credit checks
  return { allowed: true, creditBalance: 999, bypassCredit: true };
}

export async function deductCredit(_supabase: any, _userId: string) {
  // Mock deduct returns a decremented balance
  return 998;
}

export async function addCredits(_supabase: any, _userId: string, amount: number) {
  // Mock add returns increased balance
  return 999 + amount;
}

export async function isModelUnlocked(_supabase: any, _generationId: string) {
  return true;
}

export async function unlockModel(_supabase: any, _generationId: string) {
  // No‑op in mock
}

export async function isHostingActive(_supabase: any, _userId: string) {
  return true;
}

export async function activateHostingTrial(_supabase: any, _userId: string) {
  // No‑op in mock
}
