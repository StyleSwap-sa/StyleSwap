// AWS S3 Storage Integration
// Direct S3 upload/download without Manus proxy
import https from 'https';
import http from 'http';
import { PassThrough } from 'stream';
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from './_core/env';


let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    console.log("[S3] Checking AWS credentials from ENV:");
    console.log("  - ENV.awsAccessKeyId exists:", !!ENV.awsAccessKeyId);
    console.log("  - ENV.awsSecretAccessKey exists:", !!ENV.awsSecretAccessKey);
    console.log("  - ENV.awsRegion:", ENV.awsRegion);
    console.log("  - ENV.awsS3Bucket:", ENV.awsS3Bucket);
    
    // 🔥 Use ENV instead of process.env
    if (!ENV.awsAccessKeyId || !ENV.awsSecretAccessKey) {
      throw new Error(
        "AWS credentials missing: set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY"
      );
    }

    s3Client = new S3Client({
      region: ENV.awsRegion || 'us-east-1',
      credentials: {
        accessKeyId: ENV.awsAccessKeyId,
        secretAccessKey: ENV.awsSecretAccessKey,
      },
    });
  }
  return s3Client;
}

function getBucketName(): string {
  // 🔥 Use ENV instead of process.env
  const bucket = ENV.awsS3Bucket;
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
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const client = getS3Client();
  const bucket = getBucketName();
  const key = normalizeKey(relKey);

  const body = typeof data === 'string' ? Buffer.from(data) : data;

  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    await client.send(command);

    // 🔥 Use ENV for region
    const url = `https://${bucket}.s3.${ENV.awsRegion || 'us-east-1'}.amazonaws.com/${key}`;

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
 * Get public URL for S3 object
 */
export function getPublicUrl(relKey: string): string {
  const bucket = getBucketName();
  const key = normalizeKey(relKey);
  // 🔥 Use ENV for region
  return `https://${bucket}.s3.${ENV.awsRegion || 'us-east-1'}.amazonaws.com/${key}`;
}
export async function downloadImageFromUrl(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }
      
      const chunks: Buffer[] = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}
export async function copyImageToS3(
  imageUrl: string,
  destinationKey: string
): Promise<string> {
  // Download the image
  const imageBuffer = await downloadImageFromUrl(imageUrl);
  
  // Upload to S3
  const result = await storagePut(destinationKey, imageBuffer, 'image/jpeg');
  
  return result.url;
}
/**
 * Delete object from S3
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

export async function getPresignedUrlForImage(urlOrKey: string, expiresIn: number = 86400): Promise<string> {
  console.log("[Storage] getPresignedUrlForImage input:", urlOrKey);
  
  if (!urlOrKey) return "";
  
  // If it's an external URL (Unsplash, etc.), return as-is
  if (urlOrKey.startsWith('http') && !urlOrKey.includes('styleswap-production.s3')) {
    console.log("[Storage] External URL, returning as-is");
    return urlOrKey;
  }
  
  // Extract the S3 key from the full URL if needed
  let s3Key = urlOrKey;
  if (urlOrKey.includes('styleswap-production.s3.eu-north-1.amazonaws.com')) {
    const match = urlOrKey.match(/\.amazonaws\.com\/(.+)$/);
    if (match && match[1]) {
      s3Key = match[1];
      console.log("[Storage] Extracted S3 key:", s3Key);
    }
  }
  
  try {
    const client = getS3Client();
    const bucket = ENV.awsS3Bucket;
    
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: s3Key,
    });
    
    const url = await getSignedUrl(client, command, { expiresIn });
    console.log("[Storage] Generated presigned URL successfully");
    return url;
  } catch (error) {
    console.error('[Storage] Failed to generate presigned URL:', error);
    return urlOrKey;
  }
}