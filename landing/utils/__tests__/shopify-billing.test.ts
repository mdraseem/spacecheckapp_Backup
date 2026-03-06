import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock @supabase/supabase-js
// ---------------------------------------------------------------------------
const mockSingle = vi.fn()
const mockEq = vi.fn(() => ({ single: mockSingle }))
const mockSelect = vi.fn(() => ({ eq: mockEq }))
const mockFrom = vi.fn(() => ({ select: mockSelect }))
const mockUpsert = vi.fn(() => ({ error: null }))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: (table: string) => {
      const result = mockFrom(table)
      // Also attach upsert for the profiles table
      return {
        ...result,
        upsert: mockUpsert,
      }
    },
  })),
}))

// ---------------------------------------------------------------------------
// Mock ../shopify (shopifyGraphQL and decryptToken)
// ---------------------------------------------------------------------------
const mockShopifyGraphQL = vi.fn()
const mockDecryptToken = vi.fn()

vi.mock('../shopify', () => ({
  shopifyGraphQL: (...args: any[]) => mockShopifyGraphQL(...args),
  decryptToken: (val: string) => mockDecryptToken(val),
}))

// ---------------------------------------------------------------------------
// Import the module under test (after mocks are set up)
// ---------------------------------------------------------------------------
import {
  getShopCredentials,
  createShopifySubscription,
  getActiveShopifySubscription,
  syncShopifySubscriptionToProfile,
  isShopifyBilledUser,
} from '../shopify-billing'

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks()
  mockDecryptToken.mockImplementation((v: string) => `decrypted_${v}`)
})

// ---------------------------------------------------------------------------
// getShopCredentials
// ---------------------------------------------------------------------------
describe('getShopCredentials', () => {
  it('returns shop domain and decrypted access token', async () => {
    mockSingle.mockResolvedValue({
      data: {
        shop_domain: 'test-shop.myshopify.com',
        access_token_encrypted: 'encrypted_token_data',
      },
      error: null,
    })

    const result = await getShopCredentials('user-123')

    expect(mockFrom).toHaveBeenCalledWith('shopify_stores')
    expect(mockSelect).toHaveBeenCalledWith('shop_domain, access_token_encrypted')
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123')
    expect(mockDecryptToken).toHaveBeenCalledWith('encrypted_token_data')
    expect(result).toEqual({
      shop: 'test-shop.myshopify.com',
      accessToken: 'decrypted_encrypted_token_data',
    })
  })

  it('returns null when no store is found', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } })

    const result = await getShopCredentials('user-no-store')

    expect(result).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// createShopifySubscription
// ---------------------------------------------------------------------------
describe('createShopifySubscription', () => {
  it('creates a subscription and returns confirmation URL', async () => {
    mockSingle.mockResolvedValue({
      data: {
        shop_domain: 'billing-shop.myshopify.com',
        access_token_encrypted: 'enc_token',
      },
      error: null,
    })

    mockShopifyGraphQL.mockResolvedValue({
      data: {
        appSubscriptionCreate: {
          userErrors: [],
          appSubscription: {
            id: 'gid://shopify/AppSubscription/12345',
            status: 'PENDING',
          },
          confirmationUrl: 'https://billing-shop.myshopify.com/admin/charges/confirm',
        },
      },
    })

    const result = await createShopifySubscription(
      'user-billing',
      'https://spacecheck.app/api/shopify/billing/callback?user_id=user-billing'
    )

    expect(result).toEqual({
      confirmationUrl: 'https://billing-shop.myshopify.com/admin/charges/confirm',
      subscriptionId: 'gid://shopify/AppSubscription/12345',
    })

    // Verify GraphQL was called with correct shop + token
    expect(mockShopifyGraphQL).toHaveBeenCalledWith(
      'billing-shop.myshopify.com',
      'decrypted_enc_token',
      expect.stringContaining('AppSubscriptionCreate'),
      expect.objectContaining({
        name: 'SpaceCheck Growth',
        trialDays: 14,
        lineItems: expect.arrayContaining([
          expect.objectContaining({
            plan: expect.objectContaining({
              appRecurringPricingDetails: expect.objectContaining({
                price: { amount: 49.0, currencyCode: 'USD' },
                interval: 'EVERY_30_DAYS',
              }),
            }),
          }),
        ]),
      })
    )
  })

  it('throws when no Shopify store is connected', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } })

    await expect(
      createShopifySubscription('user-no-store', 'https://example.com/callback')
    ).rejects.toThrow('No Shopify store connected for this user')
  })

  it('throws on Shopify userErrors', async () => {
    mockSingle.mockResolvedValue({
      data: {
        shop_domain: 'error-shop.myshopify.com',
        access_token_encrypted: 'enc_token',
      },
      error: null,
    })

    mockShopifyGraphQL.mockResolvedValue({
      data: {
        appSubscriptionCreate: {
          userErrors: [
            { field: 'lineItems', message: 'Invalid price' },
            { field: 'name', message: 'Name too long' },
          ],
          appSubscription: null,
          confirmationUrl: null,
        },
      },
    })

    await expect(
      createShopifySubscription('user-err', 'https://example.com/callback')
    ).rejects.toThrow('Shopify billing error: Invalid price, Name too long')
  })

  it('throws when no confirmation URL is returned', async () => {
    mockSingle.mockResolvedValue({
      data: {
        shop_domain: 'no-url-shop.myshopify.com',
        access_token_encrypted: 'enc_token',
      },
      error: null,
    })

    mockShopifyGraphQL.mockResolvedValue({
      data: {
        appSubscriptionCreate: {
          userErrors: [],
          appSubscription: null,
          confirmationUrl: null,
        },
      },
    })

    await expect(
      createShopifySubscription('user-no-url', 'https://example.com/callback')
    ).rejects.toThrow('No confirmation URL returned from Shopify')
  })
})

// ---------------------------------------------------------------------------
// getActiveShopifySubscription
// ---------------------------------------------------------------------------
describe('getActiveShopifySubscription', () => {
  it('returns the first active subscription', async () => {
    mockSingle.mockResolvedValue({
      data: {
        shop_domain: 'active-shop.myshopify.com',
        access_token_encrypted: 'enc_token',
      },
      error: null,
    })

    const mockSubscription = {
      id: 'gid://shopify/AppSubscription/99',
      name: 'SpaceCheck Growth',
      status: 'ACTIVE',
      trialDays: 14,
      currentPeriodEnd: '2025-12-31T00:00:00Z',
      lineItems: [
        {
          plan: {
            pricingDetails: {
              price: { amount: '49.0', currencyCode: 'USD' },
              interval: 'EVERY_30_DAYS',
            },
          },
        },
      ],
    }

    mockShopifyGraphQL.mockResolvedValue({
      data: {
        currentAppInstallation: {
          activeSubscriptions: [mockSubscription],
        },
      },
    })

    const result = await getActiveShopifySubscription('user-active')

    expect(result).toEqual(mockSubscription)
  })

  it('returns null when no store is connected', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } })

    const result = await getActiveShopifySubscription('user-no-store')

    expect(result).toBeNull()
    expect(mockShopifyGraphQL).not.toHaveBeenCalled()
  })

  it('returns null when no active subscriptions exist', async () => {
    mockSingle.mockResolvedValue({
      data: {
        shop_domain: 'free-shop.myshopify.com',
        access_token_encrypted: 'enc_token',
      },
      error: null,
    })

    mockShopifyGraphQL.mockResolvedValue({
      data: {
        currentAppInstallation: {
          activeSubscriptions: [],
        },
      },
    })

    const result = await getActiveShopifySubscription('user-free')

    expect(result).toBeNull()
  })

  it('returns null when activeSubscriptions is undefined', async () => {
    mockSingle.mockResolvedValue({
      data: {
        shop_domain: 'edge-shop.myshopify.com',
        access_token_encrypted: 'enc_token',
      },
      error: null,
    })

    mockShopifyGraphQL.mockResolvedValue({
      data: {
        currentAppInstallation: {
          activeSubscriptions: undefined,
        },
      },
    })

    const result = await getActiveShopifySubscription('user-edge')

    expect(result).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// syncShopifySubscriptionToProfile
// ---------------------------------------------------------------------------
describe('syncShopifySubscriptionToProfile', () => {
  it('upserts growth plan for ACTIVE subscription', async () => {
    await syncShopifySubscriptionToProfile('user-sync', {
      id: 'gid://shopify/AppSubscription/100',
      status: 'ACTIVE',
    })

    expect(mockFrom).toHaveBeenCalledWith('profiles')
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user-sync',
        billing_source: 'shopify',
        shopify_subscription_id: 'gid://shopify/AppSubscription/100',
        shopify_subscription_status: 'active',
        plan_type: 'growth',
        subscription_status: 'active',
      })
    )
  })

  it('upserts growth plan for lowercase active subscription', async () => {
    await syncShopifySubscriptionToProfile('user-lower', {
      id: 'gid://shopify/AppSubscription/101',
      status: 'active',
    })

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        plan_type: 'growth',
        subscription_status: 'active',
        shopify_subscription_status: 'active',
      })
    )
  })

  it('upserts starter plan for non-active subscription (CANCELLED)', async () => {
    await syncShopifySubscriptionToProfile('user-cancel', {
      id: 'gid://shopify/AppSubscription/102',
      status: 'CANCELLED',
    })

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        plan_type: 'starter',
        subscription_status: 'cancelled',
        shopify_subscription_status: 'cancelled',
      })
    )
  })

  it('upserts starter plan for PENDING subscription', async () => {
    await syncShopifySubscriptionToProfile('user-pending', {
      id: 'gid://shopify/AppSubscription/103',
      status: 'PENDING',
    })

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        plan_type: 'starter',
        subscription_status: 'pending',
      })
    )
  })

  it('includes updated_at timestamp', async () => {
    const beforeTime = new Date().toISOString()

    await syncShopifySubscriptionToProfile('user-time', {
      id: 'gid://shopify/AppSubscription/104',
      status: 'ACTIVE',
    })

    const calledWith = mockUpsert.mock.calls[0][0]
    expect(calledWith.updated_at).toBeDefined()
    // updated_at should be a recent ISO timestamp
    const ts = new Date(calledWith.updated_at)
    expect(ts.getTime()).toBeGreaterThanOrEqual(new Date(beforeTime).getTime())
  })

  it('always sets billing_source to shopify', async () => {
    await syncShopifySubscriptionToProfile('user-src', {
      id: 'gid://shopify/AppSubscription/105',
      status: 'FROZEN',
    })

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        billing_source: 'shopify',
      })
    )
  })
})

// ---------------------------------------------------------------------------
// isShopifyBilledUser
// ---------------------------------------------------------------------------
describe('isShopifyBilledUser', () => {
  it('returns true when billing_source is shopify', async () => {
    mockSingle.mockResolvedValue({
      data: { billing_source: 'shopify' },
      error: null,
    })

    const result = await isShopifyBilledUser('user-shopify')

    expect(mockFrom).toHaveBeenCalledWith('profiles')
    expect(mockSelect).toHaveBeenCalledWith('billing_source')
    expect(result).toBe(true)
  })

  it('returns false when billing_source is stripe', async () => {
    mockSingle.mockResolvedValue({
      data: { billing_source: 'stripe' },
      error: null,
    })

    const result = await isShopifyBilledUser('user-stripe')

    expect(result).toBe(false)
  })

  it('returns false when profile is not found', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: 'not found' },
    })

    const result = await isShopifyBilledUser('user-missing')

    expect(result).toBe(false)
  })

  it('returns false when billing_source is null/undefined', async () => {
    mockSingle.mockResolvedValue({
      data: { billing_source: null },
      error: null,
    })

    const result = await isShopifyBilledUser('user-null-src')

    expect(result).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Constants & Configuration
// ---------------------------------------------------------------------------
describe('Shopify billing configuration', () => {
  it('uses $49 price for the Growth plan', async () => {
    mockSingle.mockResolvedValue({
      data: {
        shop_domain: 'price-shop.myshopify.com',
        access_token_encrypted: 'enc_token',
      },
      error: null,
    })

    mockShopifyGraphQL.mockResolvedValue({
      data: {
        appSubscriptionCreate: {
          userErrors: [],
          appSubscription: { id: 'gid://shopify/AppSubscription/1', status: 'PENDING' },
          confirmationUrl: 'https://example.com/confirm',
        },
      },
    })

    await createShopifySubscription('user-price', 'https://example.com/callback')

    const callArgs = mockShopifyGraphQL.mock.calls[0]
    const variables = callArgs[3]
    expect(variables.lineItems[0].plan.appRecurringPricingDetails.price.amount).toBe(49.0)
    expect(variables.lineItems[0].plan.appRecurringPricingDetails.price.currencyCode).toBe('USD')
  })

  it('uses 14-day trial period', async () => {
    mockSingle.mockResolvedValue({
      data: {
        shop_domain: 'trial-shop.myshopify.com',
        access_token_encrypted: 'enc_token',
      },
      error: null,
    })

    mockShopifyGraphQL.mockResolvedValue({
      data: {
        appSubscriptionCreate: {
          userErrors: [],
          appSubscription: { id: 'gid://shopify/AppSubscription/2', status: 'PENDING' },
          confirmationUrl: 'https://example.com/confirm',
        },
      },
    })

    await createShopifySubscription('user-trial', 'https://example.com/callback')

    const variables = mockShopifyGraphQL.mock.calls[0][3]
    expect(variables.trialDays).toBe(14)
  })

  it('uses EVERY_30_DAYS billing interval', async () => {
    mockSingle.mockResolvedValue({
      data: {
        shop_domain: 'interval-shop.myshopify.com',
        access_token_encrypted: 'enc_token',
      },
      error: null,
    })

    mockShopifyGraphQL.mockResolvedValue({
      data: {
        appSubscriptionCreate: {
          userErrors: [],
          appSubscription: { id: 'gid://shopify/AppSubscription/3', status: 'PENDING' },
          confirmationUrl: 'https://example.com/confirm',
        },
      },
    })

    await createShopifySubscription('user-interval', 'https://example.com/callback')

    const variables = mockShopifyGraphQL.mock.calls[0][3]
    expect(variables.lineItems[0].plan.appRecurringPricingDetails.interval).toBe('EVERY_30_DAYS')
  })

  it('names the subscription SpaceCheck Growth', async () => {
    mockSingle.mockResolvedValue({
      data: {
        shop_domain: 'name-shop.myshopify.com',
        access_token_encrypted: 'enc_token',
      },
      error: null,
    })

    mockShopifyGraphQL.mockResolvedValue({
      data: {
        appSubscriptionCreate: {
          userErrors: [],
          appSubscription: { id: 'gid://shopify/AppSubscription/4', status: 'PENDING' },
          confirmationUrl: 'https://example.com/confirm',
        },
      },
    })

    await createShopifySubscription('user-name', 'https://example.com/callback')

    const variables = mockShopifyGraphQL.mock.calls[0][3]
    expect(variables.name).toBe('SpaceCheck Growth')
  })
})
