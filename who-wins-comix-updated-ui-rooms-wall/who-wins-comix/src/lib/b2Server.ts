import "server-only";

import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Backblaze B2 (S3-compatible) presigned URLs.
 *
 * Env required:
 *  - B2_KEY_ID
 *  - B2_APPLICATION_KEY
 *  - B2_BUCKET
 *  - B2_ENDPOINT (e.g. https://s3.us-east-005.backblazeb2.com)
 */
function getS3() {
  const accessKeyId = process.env.B2_KEY_ID;
  const secretAccessKey = process.env.B2_APPLICATION_KEY;
  const bucket = process.env.B2_BUCKET;
  const endpoint = process.env.B2_ENDPOINT;
  if (!accessKeyId || !secretAccessKey || !bucket || !endpoint) {
    throw new Error(
      "Missing one or more Backblaze env vars: B2_KEY_ID, B2_APPLICATION_KEY, B2_BUCKET, B2_ENDPOINT"
    );
  }

  // B2 S3-compatible requires path-style addressing.
  const client = new S3Client({
    region: "us-east-1",
    endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });

  return { client, bucket };
}

export function sanitizeFilename(name: string) {
  return name
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 140);
}

export async function presignComicUpload(params: {
  uid: string;
  filename: string;
  contentType: string;
  expiresInSeconds?: number;
}) {
  const { client, bucket } = getS3();
  const safe = sanitizeFilename(params.filename);
  const objectKey = `comics/${params.uid}/${Date.now()}_${safe}`;
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    ContentType: params.contentType || "application/octet-stream",
  });
  const uploadUrl = await getSignedUrl(client, cmd, {
    expiresIn: params.expiresInSeconds ?? 300,
  });
  return { objectKey, uploadUrl };
}

export async function presignDownload(params: {
  objectKey: string;
  expiresInSeconds?: number;
}) {
  const { client, bucket } = getS3();
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: params.objectKey });
  const url = await getSignedUrl(client, cmd, {
    expiresIn: params.expiresInSeconds ?? 300,
  });
  return { url };
}
