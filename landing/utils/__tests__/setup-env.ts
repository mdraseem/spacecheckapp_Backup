// This file sets up environment variables for Shopify tests.
// It must be loaded via vitest setupFiles to run BEFORE module imports.

process.env.SHOPIFY_API_KEY = 'test-shopify-api-key'
process.env.SHOPIFY_API_SECRET = 'test-shopify-api-secret'
process.env.SHOPIFY_ENCRYPTION_KEY = 'a'.repeat(64) // 32 bytes = 64 hex chars
process.env.NEXT_PUBLIC_SITE_URL = 'https://spacecheck.app'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
