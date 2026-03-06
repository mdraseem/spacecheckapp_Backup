import { describe, it, expect, vi } from 'vitest'
import crypto from 'crypto'
// Env vars are set via setup-env.ts (vitest setupFiles)

const TEST_API_SECRET = 'test-shopify-api-secret'

import { verifyHmac, verifyWebhookHmac } from '../shopify'

// ---------------------------------------------------------------------------
// verifyHmac (OAuth callback HMAC verification)
// ---------------------------------------------------------------------------
describe('verifyHmac', () => {
  function computeHmac(params: Record<string, string>): string {
    const message = Object.keys(params)
      .filter((k) => k !== 'hmac')
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join('&')

    return crypto
      .createHmac('sha256', TEST_API_SECRET)
      .update(message)
      .digest('hex')
  }

  it('returns true for valid HMAC', () => {
    const params: Record<string, string> = {
      code: 'auth_code_123',
      shop: 'test-store.myshopify.com',
      state: 'nonce123',
      timestamp: '1234567890',
    }
    params.hmac = computeHmac(params)

    expect(verifyHmac(params)).toBe(true)
  })

  it('returns false for invalid HMAC', () => {
    const params: Record<string, string> = {
      code: 'auth_code_123',
      shop: 'test-store.myshopify.com',
      state: 'nonce123',
      timestamp: '1234567890',
      hmac: 'invalid_hmac_value_that_is_64_chars_long'.padEnd(64, '0'),
    }

    expect(verifyHmac(params)).toBe(false)
  })

  it('returns false when hmac param is missing', () => {
    const params = {
      code: 'auth_code_123',
      shop: 'test-store.myshopify.com',
    }

    expect(verifyHmac(params)).toBe(false)
  })

  it('ignores hmac param when computing signature', () => {
    const params: Record<string, string> = {
      shop: 'store.myshopify.com',
      code: 'code123',
    }
    params.hmac = computeHmac(params)

    // The HMAC should be valid because it was computed excluding the hmac key
    expect(verifyHmac(params)).toBe(true)
  })

  it('sorts parameters alphabetically before computing', () => {
    const params: Record<string, string> = {
      z_param: 'last',
      a_param: 'first',
      m_param: 'middle',
    }
    params.hmac = computeHmac(params)
    expect(verifyHmac(params)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// verifyWebhookHmac (Webhook HMAC verification)
// ---------------------------------------------------------------------------
describe('verifyWebhookHmac', () => {
  it('returns true for valid webhook HMAC', () => {
    const body = JSON.stringify({ topic: 'app/uninstalled', shop: 'test.myshopify.com' })
    const hmac = crypto
      .createHmac('sha256', TEST_API_SECRET)
      .update(body, 'utf8')
      .digest('base64')

    expect(verifyWebhookHmac(body, hmac)).toBe(true)
  })

  it('returns false for invalid webhook HMAC of same length', () => {
    const body = '{"shop":"test.myshopify.com"}'
    // Compute the real HMAC, then flip a character to make it invalid but same length
    const validHmac = crypto
      .createHmac('sha256', TEST_API_SECRET)
      .update(body, 'utf8')
      .digest('base64')
    const invalidHmac = validHmac.slice(0, -1) + (validHmac.endsWith('A') ? 'B' : 'A')
    expect(verifyWebhookHmac(body, invalidHmac)).toBe(false)
  })

  it('throws when HMAC has different byte length', () => {
    const body = '{"shop":"test.myshopify.com"}'
    expect(() => verifyWebhookHmac(body, 'short')).toThrow()
  })

  it('handles empty body', () => {
    const body = ''
    const hmac = crypto
      .createHmac('sha256', TEST_API_SECRET)
      .update(body, 'utf8')
      .digest('base64')

    expect(verifyWebhookHmac(body, hmac)).toBe(true)
  })
})
