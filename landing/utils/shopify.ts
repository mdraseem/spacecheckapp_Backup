import crypto from 'crypto'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY!
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET!
const SHOPIFY_ENCRYPTION_KEY = process.env.SHOPIFY_ENCRYPTION_KEY!
const SHOPIFY_API_VERSION = '2025-01'

const SHOPIFY_SCOPES = 'read_products,write_products,write_files'

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/** Validate that a shop domain matches *.myshopify.com */
export function isValidShopDomain(shop: string): boolean {
  return /^[a-z0-9][a-z0-9\-]*\.myshopify\.com$/i.test(shop)
}

/** Normalize user input into a clean shop domain */
export function normalizeShopDomain(input: string): string {
  let domain = input.trim().toLowerCase()
  // Strip protocol
  domain = domain.replace(/^https?:\/\//, '')
  // Strip trailing slashes/paths
  domain = domain.split('/')[0]
  // If they pasted the full domain, return as-is
  if (domain.endsWith('.myshopify.com')) return domain
  // Otherwise append .myshopify.com
  return `${domain}.myshopify.com`
}

/** Verify Shopify HMAC signature on OAuth callbacks */
export function verifyHmac(query: Record<string, string>): boolean {
  const hmac = query.hmac
  if (!hmac) return false

  // Build the message from all query params except hmac
  const params = Object.keys(query)
    .filter((key) => key !== 'hmac')
    .sort()
    .map((key) => `${key}=${query[key]}`)
    .join('&')

  const computed = crypto
    .createHmac('sha256', SHOPIFY_API_SECRET)
    .update(params)
    .digest('hex')

  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hmac))
}

/** Verify Shopify webhook HMAC */
export function verifyWebhookHmac(body: string, hmacHeader: string): boolean {
  const computed = crypto
    .createHmac('sha256', SHOPIFY_API_SECRET)
    .update(body, 'utf8')
    .digest('base64')

  return crypto.timingSafeEqual(
    Buffer.from(computed),
    Buffer.from(hmacHeader)
  )
}

// ---------------------------------------------------------------------------
// Token encryption (AES-256-GCM)
// ---------------------------------------------------------------------------

export function encryptToken(token: string): string {
  const key = Buffer.from(SHOPIFY_ENCRYPTION_KEY, 'hex')
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  // Format: iv:authTag:encrypted  (all hex)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
}

export function decryptToken(encrypted: string): string {
  const [ivHex, authTagHex, dataHex] = encrypted.split(':')
  const key = Buffer.from(SHOPIFY_ENCRYPTION_KEY, 'hex')
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const data = Buffer.from(dataHex, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)
  return decipher.update(data) + decipher.final('utf8')
}

// ---------------------------------------------------------------------------
// OAuth helpers
// ---------------------------------------------------------------------------

export function buildInstallUrl(shop: string, nonce: string): string {
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/shopify/callback`
  return (
    `https://${shop}/admin/oauth/authorize?` +
    `client_id=${SHOPIFY_API_KEY}&` +
    `scope=${SHOPIFY_SCOPES}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `state=${nonce}`
  )
}

export async function exchangeCodeForToken(
  shop: string,
  code: string
): Promise<{ access_token: string; scope: string }> {
  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: SHOPIFY_API_KEY,
      client_secret: SHOPIFY_API_SECRET,
      code,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Shopify token exchange failed: ${text}`)
  }

  return res.json()
}

// ---------------------------------------------------------------------------
// GraphQL client
// ---------------------------------------------------------------------------

export async function shopifyGraphQL<T = any>(
  shop: string,
  accessToken: string,
  query: string,
  variables?: Record<string, any>
): Promise<{ data: T; errors?: any[] }> {
  const res = await fetch(
    `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({ query, variables }),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Shopify GraphQL error (${res.status}): ${text}`)
  }

  return res.json()
}

// ---------------------------------------------------------------------------
// Product queries
// ---------------------------------------------------------------------------

const GET_PRODUCTS_QUERY = `
  query GetProducts($first: Int!, $after: String, $query: String) {
    products(first: $first, after: $after, query: $query) {
      edges {
        cursor
        node {
          id
          title
          handle
          status
          featuredImage {
            url
            altText
          }
          images(first: 5) {
            nodes {
              id
              url
              altText
            }
          }
          media(first: 10) {
            nodes {
              mediaContentType
              ... on Model3d {
                id
                sources {
                  url
                  format
                }
              }
            }
          }
          variants(first: 1) {
            nodes {
              id
              price
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`

export interface ShopifyProduct {
  id: string
  title: string
  handle: string
  status: string
  featuredImage: { url: string; altText: string | null } | null
  images: { nodes: { id: string; url: string; altText: string | null }[] }
  media: {
    nodes: {
      mediaContentType: string
      id?: string
      sources?: { url: string; format: string }[]
    }[]
  }
  variants: { nodes: { id: string; price: string }[] }
}

export interface ShopifyProductsResponse {
  products: {
    edges: { cursor: string; node: ShopifyProduct }[]
    pageInfo: { hasNextPage: boolean; endCursor: string | null }
  }
}

export async function fetchProducts(
  shop: string,
  accessToken: string,
  options: { first?: number; after?: string; query?: string } = {}
) {
  const { first = 24, after, query } = options
  const result = await shopifyGraphQL<ShopifyProductsResponse>(
    shop,
    accessToken,
    GET_PRODUCTS_QUERY,
    { first, after, query: query || null }
  )

  if (result.errors?.length) {
    throw new Error(`Shopify products query failed: ${JSON.stringify(result.errors)}`)
  }

  return result.data.products
}

// ---------------------------------------------------------------------------
// 3D Model Upload (staged upload → attach to product)
// ---------------------------------------------------------------------------

const STAGED_UPLOAD_MUTATION = `
  mutation CreateStagedUpload($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
      stagedTargets {
        url
        resourceUrl
        parameters {
          name
          value
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`

const PRODUCT_CREATE_MEDIA_MUTATION = `
  mutation ProductCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
    productCreateMedia(productId: $productId, media: $media) {
      media {
        ... on Model3d {
          id
          status
        }
      }
      mediaUserErrors {
        field
        message
      }
    }
  }
`

export interface StagedTarget {
  url: string
  resourceUrl: string
  parameters: { name: string; value: string }[]
}

/**
 * Upload a GLB file to a Shopify product as a 3D model.
 * 1. Create staged upload target
 * 2. Download GLB from Supabase URL
 * 3. Upload to staged target
 * 4. Attach as product media
 */
export async function uploadModelToShopify(
  shop: string,
  accessToken: string,
  productId: string,
  glbUrl: string,
  modelName: string
): Promise<{ mediaId: string; status: string }> {
  // Step 1: Download the GLB file to get its size
  const glbResponse = await fetch(glbUrl)
  if (!glbResponse.ok) {
    throw new Error(`Failed to download GLB file: ${glbResponse.status}`)
  }
  const glbBuffer = await glbResponse.arrayBuffer()
  const fileSize = glbBuffer.byteLength

  // Step 2: Create staged upload
  const stageResult = await shopifyGraphQL<{
    stagedUploadsCreate: {
      stagedTargets: StagedTarget[]
      userErrors: { field: string; message: string }[]
    }
  }>(shop, accessToken, STAGED_UPLOAD_MUTATION, {
    input: [
      {
        resource: 'MODEL_3D',
        filename: `${modelName.replace(/[^a-zA-Z0-9-_]/g, '_')}.glb`,
        mimeType: 'model/gltf-binary',
        fileSize: fileSize.toString(),
        httpMethod: 'POST',
      },
    ],
  })

  const stageData = stageResult.data.stagedUploadsCreate
  if (stageData.userErrors?.length) {
    throw new Error(
      `Staged upload error: ${stageData.userErrors.map((e) => e.message).join(', ')}`
    )
  }

  const target = stageData.stagedTargets[0]
  if (!target) {
    throw new Error('No staged upload target returned from Shopify')
  }

  // Step 3: Upload file to staged URL via multipart form
  const formData = new FormData()
  for (const param of target.parameters) {
    formData.append(param.name, param.value)
  }
  formData.append(
    'file',
    new Blob([glbBuffer], { type: 'model/gltf-binary' }),
    `${modelName}.glb`
  )

  const uploadRes = await fetch(target.url, {
    method: 'POST',
    body: formData,
  })

  if (!uploadRes.ok) {
    const text = await uploadRes.text()
    throw new Error(`Staged upload failed (${uploadRes.status}): ${text}`)
  }

  // Step 4: Attach to product
  const mediaResult = await shopifyGraphQL<{
    productCreateMedia: {
      media: { id: string; status: string }[]
      mediaUserErrors: { field: string; message: string }[]
    }
  }>(shop, accessToken, PRODUCT_CREATE_MEDIA_MUTATION, {
    productId,
    media: [
      {
        originalSource: target.resourceUrl,
        mediaContentType: 'MODEL_3D',
      },
    ],
  })

  const mediaData = mediaResult.data.productCreateMedia
  if (mediaData.mediaUserErrors?.length) {
    throw new Error(
      `Media attach error: ${mediaData.mediaUserErrors.map((e) => e.message).join(', ')}`
    )
  }

  const model3d = mediaData.media?.[0]
  if (!model3d) {
    throw new Error('No media returned after attaching to product')
  }

  return { mediaId: model3d.id, status: model3d.status }
}
