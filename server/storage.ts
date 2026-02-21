// AWS S3 Storage Integration
// Direct S3 upload/download without Manus proxy

import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from './_core/env';

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error(
        "AWS credentials missing: set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY"
      );
    }

    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
}

function getBucketName(): string {
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) {
    throw new Error("AWS_S3_BUCKET environment variable is not set");
  }
  return bucket;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

/**
 * Upload file to S3
 * @param relKey Relative path in S3 bucket (e.g., "uploads/user-123/image.jpg")
 * @param data File content as Buffer, Uint8Array, or string
 * @param contentType MIME type (e.g., "image/jpeg")
 * @returns Object with key and public URL
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const client = getS3Client();
  const bucket = getBucketName();
  const key = normalizeKey(relKey);

  // Convert string to Buffer if needed
  const body = typeof data === 'string' ? Buffer.from(data) : data;

  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      // Make object publicly readable
      ACL: 'public-read',
    });

    await client.send(command);

    // Construct public URL
    const region = process.env.AWS_REGION || 'us-east-1';
    const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    console.log(`[Storage] ✓ Uploaded to S3: ${key}`);
    return { key, url };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[Storage] ✗ Failed to upload ${key}:`, errorMsg);
    throw new Error(`S3 upload failed: ${errorMsg}`);
  }
}

/**
 * Get signed download URL for S3 object
 * @param relKey Relative path in S3 bucket
 * @param expiresIn Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Object with key and signed URL
 */
export async function storageGet(
  relKey: string,
  expiresIn = 3600
): Promise<{ key: string; url: string }> {
  const client = getS3Client();
  const bucket = getBucketName();
  const key = normalizeKey(relKey);

  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const url = await getSignedUrl(client, command, { expiresIn });

    console.log(`[Storage] ✓ Generated signed URL for: ${key}`);
    return { key, url };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[Storage] ✗ Failed to generate URL for ${key}:`, errorMsg);
    throw new Error(`S3 signed URL generation failed: ${errorMsg}`);
  }
}

/**
 * Get public URL for S3 object (works for public-read objects)
 * @param relKey Relative path in S3 bucket
 * @returns Public URL
 */
export function getPublicUrl(relKey: string): string {
  const bucket = getBucketName();
  const key = normalizeKey(relKey);
  const region = process.env.AWS_REGION || 'us-east-1';
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

/**
 * Delete object from S3
 * @param relKey Relative path in S3 bucket
 */
export async function storageDelete(relKey: string): Promise<void> {
  const client = getS3Client();
  const bucket = getBucketName();
  const key = normalizeKey(relKey);

  try {
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await client.send(command);
    console.log(`[Storage] ✓ Deleted from S3: ${key}`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[Storage] ✗ Failed to delete ${key}:`, errorMsg);
    throw new Error(`S3 delete failed: ${errorMsg}`);
  }
}
