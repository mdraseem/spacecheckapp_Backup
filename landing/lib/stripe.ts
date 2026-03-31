import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-01-28.clover',
  typescript: true,
});

// ==========================================
// Credit + Active Hosting pricing model
// ==========================================

// One-time credit packs (Stripe "payment" mode)
export const CREDIT_PRICE_IDS = {
  credit_1: process.env.NEXT_PUBLIC_STRIPE_PRICE_CREDIT_1 || '',   // 1 credit  - $15
  credit_5: process.env.NEXT_PUBLIC_STRIPE_PRICE_CREDIT_5 || '',   // 5 credits - $59 ($11.80/ea)
  credit_20: process.env.NEXT_PUBLIC_STRIPE_PRICE_CREDIT_20 || '', // 20 credits - $199 ($9.95/ea)
} as const;

// Credit amounts per price ID (for webhook fulfillment)
export const CREDIT_AMOUNTS: Record<string, number> = {
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_CREDIT_1 || '']: 1,
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_CREDIT_5 || '']: 5,
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_CREDIT_20 || '']: 20,
};

// Monthly hosting subscription (Stripe "subscription" mode)
export const HOSTING_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_HOSTING || '';

// Legacy price IDs (kept for backward compatibility with existing subscribers)
export const PRICE_IDS = {
  starter: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER || '',
  growth: process.env.NEXT_PUBLIC_STRIPE_PRICE_GROWTH || '',
} as const;
