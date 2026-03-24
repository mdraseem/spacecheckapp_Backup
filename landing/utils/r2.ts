import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'spacecheck-uploads'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL! // e.g. https://pub-xxx.r2.dev or custom domain

let _client: S3Client | null = null

function getR2Client(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    })
  }
  return _client
}

/**
 * Upload a file (Buffer or Uint8Array) to R2.
 * Returns the public URL of the uploaded object.
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array | ReadableStream,
  contentType: string
): Promise<string> {
  const client = getR2Client()

  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  )

  return getR2PublicUrl(key)
}

/**
 * Generate a presigned PUT URL for client-side uploads.
 * The client can PUT directly to this URL without needing R2 credentials.
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  const client = getR2Client()

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  })

  return getSignedUrl(client, command, { expiresIn })
}

/**
 * Construct the public URL for an object in R2.
 */
export function getR2PublicUrl(key: string): string {
  // Remove leading slash if present
  const cleanKey = key.startsWith('/') ? key.slice(1) : key
  // Ensure public URL doesn't have trailing slash before key
  const baseUrl = R2_PUBLIC_URL.endsWith('/') ? R2_PUBLIC_URL.slice(0, -1) : R2_PUBLIC_URL
  return `${baseUrl}/${cleanKey}`
}
