# Subscription Cancellation Policy - Implementation Options

## Current Situation

When a user cancels their subscription:
- ✅ User reverts to Starter plan (3 generations/month)
- ✅ Cannot create new models beyond limit
- ❌ **All existing models remain accessible**
- ❌ **AR viewer links continue working**
- ❌ **Storage files remain public**

## Option 1: Keep Models Active (Current - Recommended for B2B)

### Behavior
- User keeps all previously generated models forever
- Can view, download, and share existing models
- AR links and QR codes continue working
- Cannot generate NEW models beyond starter limit

### Pros
- ✅ Excellent customer trust
- ✅ No broken links for end customers
- ✅ QR codes in physical stores keep working
- ✅ Simple implementation (no changes needed)
- ✅ Furniture retailers need models to stay live

### Cons
- ❌ Storage costs for inactive users
- ❌ Less incentive to resubscribe

### Best For
- **B2B SaaS** (furniture retailers, wholesalers)
- Long-term customer relationships
- Physical integrations (QR posters)

---

## Option 2: Grace Period + Archive

### Behavior
- 30-day grace period after cancellation
- Models remain accessible during grace period
- After 30 days:
  - Models hidden in dashboard
  - AR links show "Reactivate" message
  - Files moved to cold storage (or deleted)

### Implementation

#### 1. Add cancellation tracking to profiles table:

```sql
ALTER TABLE profiles
ADD COLUMN canceled_at timestamp with time zone;

-- Update webhook to track cancellation date
```

#### 2. Update webhook handler:

```typescript
case 'customer.subscription.deleted': {
  const subscription = event.data.object as Stripe.Subscription;

  await supabase
    .from('profiles')
    .update({
      subscription_status: 'canceled',
      canceled_at: new Date().toISOString(), // Track when canceled
      stripe_subscription_id: null,
      plan_type: 'starter',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  console.log('Subscription canceled:', subscription.id);
  break;
}
```

#### 3. Create scheduled job (cron):

```typescript
// app/api/cron/archive-canceled-models/route.ts
export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Find users canceled > 30 days ago
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: canceledUsers } = await supabase
    .from('profiles')
    .select('id')
    .eq('subscription_status', 'canceled')
    .lt('canceled_at', thirtyDaysAgo.toISOString());

  for (const user of canceledUsers || []) {
    // Archive models (set status to 'archived')
    await supabase
      .from('generations')
      .update({ status: 'archived' })
      .eq('user_id', user.id);

    // Optional: Delete storage files
    // const { data: generations } = await supabase
    //   .from('generations')
    //   .select('glb_url, usdz_url')
    //   .eq('user_id', user.id);
    //
    // for (const gen of generations || []) {
    //   // Delete from storage
    // }
  }

  return Response.json({ success: true });
}
```

#### 4. Update RLS policies:

```sql
-- Hide archived models in dashboard
DROP POLICY IF EXISTS "Users can view their own generations" ON public.generations;

CREATE POLICY "Users can view their own generations"
  ON public.generations FOR SELECT
  USING (
    auth.uid() = user_id
    AND status != 'archived'
  );
```

#### 5. Update AR viewer to show reactivation:

```html
<!-- In viewer.html or create new auth-viewer route -->
<script>
  // Check if model is accessible
  fetch('/api/check-model-access?id=' + modelId)
    .then(r => r.json())
    .then(data => {
      if (data.archived) {
        showReactivateMessage();
      } else {
        loadModel();
      }
    });
</script>
```

### Pros
- ✅ Reduces storage costs
- ✅ Incentive to resubscribe
- ✅ Grace period prevents immediate breakage

### Cons
- ❌ More complex implementation
- ❌ Potential customer dissatisfaction
- ❌ Broken QR codes after 30 days

### Best For
- High storage costs
- Consumer-focused products
- Digital-only use cases

---

## Option 3: Immediate Restriction (Not Recommended)

### Behavior
- Models hidden immediately upon cancellation
- AR links stop working
- "Reactivate subscription" paywall

### Pros
- ✅ Maximum resubscription incentive
- ✅ Lowest storage costs

### Cons
- ❌ Poor user experience
- ❌ Breaks customer trust
- ❌ Immediate broken links
- ❌ Damages brand reputation

### Best For
- Not recommended for most use cases

---

## Option 4: Hybrid - View Only

### Behavior
- User can VIEW existing models in dashboard
- Cannot download GLB/USDZ files
- AR links continue working (read-only)
- Cannot create new models
- Cannot edit or delete

### Implementation
Simple - just restrict download buttons in UI:

```typescript
// In dashboard
const { data: profile } = await supabase
  .from('profiles')
  .select('plan_type, subscription_status')
  .single();

const canDownload = profile.subscription_status === 'active' ||
                   profile.subscription_status === 'trialing';

// In UI
{canDownload ? (
  <DownloadButton />
) : (
  <button onClick={upgradePrompt}>
    Upgrade to Download
  </button>
)}
```

### Pros
- ✅ Good user experience
- ✅ AR links keep working
- ✅ Upsell opportunity for downloads

### Cons
- ❌ Storage costs remain
- ❌ Users can still share links

### Best For
- Balance between UX and monetization

---

## Recommendation: Option 1 (Current) 🎯

**For your furniture AR SaaS, I recommend keeping Option 1:**

### Why?
1. **B2B Focus**: Furniture retailers need models to stay live
2. **Physical Integration**: QR codes in stores can't easily be updated
3. **Customer Trust**: Retailers need reliability
4. **Competitive Advantage**: "Your models never expire"
5. **Storage Costs**: Relatively low for 3D models

### Marketing Angle
Turn this into a feature:
- "Your 3D models are yours forever"
- "No broken links when you cancel"
- "We respect the work you've done"

### Cost Management
- Monthly storage cost per model: ~$0.01-0.05
- For 1000 canceled users with 10 models each: ~$100-500/month
- Acceptable cost for better retention

---

## Implementation Checklist

If you want to change from Option 1:

### For Option 2 (Grace Period):
- [ ] Add `canceled_at` column to profiles
- [ ] Update webhook to track cancellation date
- [ ] Create cron job for archiving
- [ ] Update RLS policies
- [ ] Add archive status to generations
- [ ] Update AR viewer for archived models
- [ ] Set up Vercel Cron or external scheduler
- [ ] Send email notification before archival

### For Option 4 (View Only):
- [ ] Add download restrictions in UI
- [ ] Update ModelCard component
- [ ] Add upgrade prompts
- [ ] Test with canceled account

---

## Current Status: ✅ Option 1 Active

No changes needed. This is the most customer-friendly approach for your use case.

Want to implement a different option? Let me know!
