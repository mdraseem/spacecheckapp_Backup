import { describe, it, expect, vi } from 'vitest'
// Env vars are set via setup-env.ts (vitest setupFiles)

import {
  isValidShopDomain,
  normalizeShopDomain,
  encryptToken,
  decryptToken,
  buildInstallUrl,
} from '../shopify'

// ---------------------------------------------------------------------------
// isValidShopDomain
// ---------------------------------------------------------------------------
describe('isValidShopDomain', () => {
  it('accepts valid shop domains', () => {
    expect(isValidShopDomain('my-store.myshopify.com')).toBe(true)
    expect(isValidShopDomain('store123.myshopify.com')).toBe(true)
    expect(isValidShopDomain('test-shop-99.myshopify.com')).toBe(true)
  })

  it('rejects domains without myshopify.com suffix', () => {
    expect(isValidShopDomain('mystore.example.com')).toBe(false)
    expect(isValidShopDomain('mystore.com')).toBe(false)
    expect(isValidShopDomain('myshopify.com')).toBe(false) // no subdomain
  })

  it('rejects domains with invalid characters', () => {
    expect(isValidShopDomain('my store.myshopify.com')).toBe(false)
    expect(isValidShopDomain('my_store.myshopify.com')).toBe(false)
    expect(isValidShopDomain('.myshopify.com')).toBe(false)
  })

  it('rejects empty and malformed input', () => {
    expect(isValidShopDomain('')).toBe(false)
    expect(isValidShopDomain('..myshopify.com')).toBe(false)
    expect(isValidShopDomain('https://store.myshopify.com')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// normalizeShopDomain
// ---------------------------------------------------------------------------
describe('normalizeShopDomain', () => {
  it('returns valid domain as-is (lowercased)', () => {
    expect(normalizeShopDomain('my-store.myshopify.com')).toBe(
      'my-store.myshopify.com'
    )
  })

  it('strips https:// prefix', () => {
    expect(normalizeShopDomain('https://my-store.myshopify.com')).toBe(
      'my-store.myshopify.com'
    )
  })

  it('strips http:// prefix', () => {
    expect(normalizeShopDomain('http://my-store.myshopify.com')).toBe(
      'my-store.myshopify.com'
    )
  })

  it('strips trailing slash and paths', () => {
    expect(normalizeShopDomain('my-store.myshopify.com/admin')).toBe(
      'my-store.myshopify.com'
    )
    expect(
      normalizeShopDomain('https://my-store.myshopify.com/admin/products')
    ).toBe('my-store.myshopify.com')
  })

  it('appends .myshopify.com when missing', () => {
    expect(normalizeShopDomain('my-store')).toBe('my-store.myshopify.com')
  })

  it('lowercases the input', () => {
    expect(normalizeShopDomain('MY-STORE.MYSHOPIFY.COM')).toBe(
      'my-store.myshopify.com'
    )
  })

  it('trims whitespace', () => {
    expect(normalizeShopDomain('  my-store.myshopify.com  ')).toBe(
      'my-store.myshopify.com'
    )
  })
})

// ---------------------------------------------------------------------------
// encryptToken / decryptToken (AES-256-GCM round-trip)
// ---------------------------------------------------------------------------
describe('Token encryption', () => {
  it('encrypts and decrypts a token correctly', () => {
    const token = 'shpat_abc123def456'
    const encrypted = encryptToken(token)
    const decrypted = decryptToken(encrypted)
    expect(decrypted).toBe(token)
  })

  it('produces different ciphertexts for the same token (random IV)', () => {
    const token = 'shpat_same_token'
    const e1 = encryptToken(token)
    const e2 = encryptToken(token)
    expect(e1).not.toBe(e2) // different IVs → different output
  })

  it('encrypted format is iv:authTag:data (hex)', () => {
    const encrypted = encryptToken('test')
    const parts = encrypted.split(':')
    expect(parts).toHaveLength(3)
    // IV should be 12 bytes = 24 hex chars
    expect(parts[0]).toHaveLength(24)
    // Auth tag is 16 bytes = 32 hex chars
    expect(parts[1]).toHaveLength(32)
    // Data should be non-empty hex
    expect(parts[2].length).toBeGreaterThan(0)
    expect(/^[0-9a-f]+$/.test(parts[2])).toBe(true)
  })

  it('decryption fails with tampered data', () => {
    const encrypted = encryptToken('secret')
    const parts = encrypted.split(':')
    // Tamper with the data portion
    const tampered = `${parts[0]}:${parts[1]}:ff${parts[2].slice(2)}`
    expect(() => decryptToken(tampered)).toThrow()
  })

  it('handles empty string', () => {
    const encrypted = encryptToken('')
    expect(decryptToken(encrypted)).toBe('')
  })

  it('handles long tokens', () => {
    const longToken = 'x'.repeat(1000)
    const encrypted = encryptToken(longToken)
    expect(decryptToken(encrypted)).toBe(longToken)
  })

  it('handles special characters in token', () => {
    const token = 'shpat_!@#$%^&*()_+-=[]{}|;:\'",.<>?/`~'
    const encrypted = encryptToken(token)
    expect(decryptToken(encrypted)).toBe(token)
  })
})

// ---------------------------------------------------------------------------
// buildInstallUrl
// ---------------------------------------------------------------------------
describe('buildInstallUrl', () => {
  it('builds correct OAuth URL', () => {
    const url = buildInstallUrl('my-store.myshopify.com', 'test-nonce-123')

    expect(url).toContain('https://my-store.myshopify.com/admin/oauth/authorize')
    expect(url).toContain('client_id=test-shopify-api-key')
    expect(url).toContain('scope=read_products,write_products,write_files')
    expect(url).toContain('state=test-nonce-123')
    expect(url).toContain(
      `redirect_uri=${encodeURIComponent('https://spacecheck.app/api/shopify/callback')}`
    )
  })

  it('includes the shop domain in the URL', () => {
    const url = buildInstallUrl('another-store.myshopify.com', 'nonce')
    expect(url).toContain('another-store.myshopify.com')
  })
})
