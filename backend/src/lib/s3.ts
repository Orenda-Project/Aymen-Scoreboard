import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

// Supports both Cloudflare R2 (recommended) and AWS S3
const isR2 = !!process.env.R2_ACCOUNT_ID;

const s3 = new S3Client(
  isR2
    ? {
        region: 'auto',
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
      }
    : {
        region: process.env.AWS_REGION ?? 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      }
);

const BUCKET = (isR2 ? process.env.R2_BUCKET_NAME : process.env.S3_BUCKET_NAME) ?? 'scoreboard-files';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export function validateFile(mimeType: string, sizeBytes: number): string | null {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return 'File type not allowed. Accepted: PDF, DOC, DOCX, JPG, PNG';
  }
  if (sizeBytes > MAX_FILE_SIZE) {
    return 'File too large. Maximum size is 10 MB';
  }
  return null;
}

export async function uploadFile(
  buffer: Buffer,
  mimeType: string,
  originalName: string
): Promise<string> {
  const ext = originalName.split('.').pop() ?? 'bin';
  const key = `uploads/${uuidv4()}.${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  return key;
}

export async function getSignedDownloadUrl(storageKey: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: storageKey });
  return getSignedUrl(s3, command, { expiresIn: 900 }); // 15 minutes
}

export async function deleteFile(storageKey: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: storageKey }));
}
