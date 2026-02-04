# Usage Limits Feature

## Overview

Usage limits are now enforced based on subscription plans to prevent abuse and ensure fair usage.

## Plan Limits

| Plan    | Monthly Generations |
|---------|-------------------|
| Starter | 3 models          |
| Growth  | 50 models         |

Limits reset on the 1st of each month.

## Features Implemented

### 1. Backend Enforcement
- **File:** `utils/usage-limits.ts`
- Checks user's current plan from `profiles` table
- Counts generations created in current month
- Prevents new generations if limit exceeded

### 2. Dashboard Actions Protection
- **File:** `app/dashboard/actions.ts`
- `createGeneration()` now checks limits before creating
- Throws clear error message if limit exceeded
- Error: "You've reached your monthly limit of X model generations. Upgrade to continue."

### 3. Usage Display Component
- **File:** `components/dashboard/UsageBadge.tsx`
- Shows current usage vs limit
- Visual progress bar
- Color coding:
  - Blue: Normal usage (< 80%)
  - Yellow: Near limit (≥ 80%)
  - Red: At limit (100%)
- Call-to-action button when limit reached (Starter plan)

### 4. API Endpoint
- **File:** `app/api/usage/route.ts`
- Returns current usage statistics
- Format:
  ```json
  {
    "currentUsage": 2,
    "limit": 3,
    "planType": "starter",
    "remaining": 1,
    "hasExceeded": false
  }
  ```

### 5. UI Integration
- Usage badge displayed on:
  - Dashboard main page (`app/dashboard/page.tsx`)
  - Create new model page (`app/dashboard/create/page.tsx`)
- Provides clear visibility before users attempt to generate

## User Experience Flow

### Normal Usage (Under Limit)
1. User sees usage: "2 / 3 generations"
2. User can create new models
3. Counter updates in real-time

### At Limit (Starter Plan)
1. Badge turns red
2. Shows "You've reached your monthly limit"
3. "Upgrade to Growth" button appears
4. Attempt to generate shows error alert
5. User redirected to upgrade

### At Limit (Growth Plan)
1. Badge turns red
2. Shows "You've reached your monthly limit. Resets on the 1st."
3. No upgrade button (already on highest plan)
4. User must wait for monthly reset

### Near Limit (≥ 80%)
1. Badge turns yellow
2. Shows "X generations remaining this month"
3. User can still generate but is warned

## Technical Details

### Monthly Reset Logic
- Counts generations where `created_at >= start of current month`
- Automatic reset on 1st of each month (no cron job needed)
- Uses PostgreSQL timestamp comparison

### Subscription Status
- Requires valid subscription status in `profiles` table:
  - `active` - Full access to plan limits
  - `trialing` - Full access during trial
  - `past_due` - Still enforces original plan limits
  - `canceled` or `inactive` - Defaults to Starter plan

### Performance
- Usage query is simple COUNT with date filter
- Index on `(user_id, created_at)` recommended for performance
- Frontend caches usage data for 30 seconds

## Database Schema Requirements

Requires these tables (already implemented):

```sql
-- profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY,
  plan_type text DEFAULT 'starter',
  subscription_status text DEFAULT 'inactive',
  ...
);

-- generations table
CREATE TABLE generations (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  ...
);
```

## Testing

### Test Scenarios

1. **Starter Plan - Under Limit**
   - Create 2 models → Success
   - Usage shows "2 / 3"

2. **Starter Plan - At Limit**
   - Create 3 models → Success
   - Usage shows "3 / 3" (red badge)
   - Try to create 4th → Error: "You've reached your monthly limit..."

3. **Growth Plan - Under Limit**
   - Create 49 models → Success
   - Usage shows "49 / 50"

4. **Growth Plan - At Limit**
   - Create 50 models → Success
   - Try to create 51st → Error

5. **Monthly Reset**
   - At limit on Jan 31
   - Feb 1 arrives → Counter resets to 0

### Test with Stripe Subscriptions

1. Start with Starter plan (free)
2. Try to generate 4th model → Blocked
3. Upgrade to Growth plan
4. Counter still shows previous usage
5. Can now generate up to 50 total

## Monitoring

Track these metrics in your analytics:
- Users hitting limits (by plan)
- Upgrade conversions after hitting limit
- Average monthly usage per plan
- Limit hit rate (% of users hitting limit)

## Future Enhancements

Potential improvements:
1. Email notification when user reaches 80% of limit
2. Email notification when limit is reached
3. Admin dashboard to view usage across all users
4. Ability to grant bonus credits
5. Usage history chart
6. Per-feature limits (e.g., analytics access, storage)
