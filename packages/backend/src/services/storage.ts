import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl as s3GetSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuid } from 'uuid';
import path from 'path';
import fs from 'fs/promises';

const s3Client = process.env.AWS_ACCESS_KEY_ID
  ? new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })
  : null;

const BUCKET = process.env.AWS_S3_BUCKET || 'career-assistant-uploads';
const LOCAL_UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

export class StorageService {
  static async uploadFile(buffer: Buffer, originalName: string, mimeType: string): Promise<{ url: string; key: string }> {
    const ext = path.extname(originalName);
    const key = `uploads/${uuid()}${ext}`;

    if (s3Client) {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
        })
      );
      return { url: `https://${BUCKET}.s3.amazonaws.com/${key}`, key };
    }

    // Local fallback
    await fs.mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
    const localPath = path.join(LOCAL_UPLOAD_DIR, `${uuid()}${ext}`);
    await fs.writeFile(localPath, buffer);
    return { url: `/uploads/${path.basename(localPath)}`, key: localPath };
  }

  static async deleteFile(key: string): Promise<void> {
    if (s3Client) {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: BUCKET,
          Key: key,
        })
      );
      return;
    }

    // Local fallback
    try {
      await fs.unlink(key);
    } catch (error) {
      console.warn('File deletion failed (may not exist):', key);
    }
  }

  static async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (s3Client) {
      const command = new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
      });
      return s3GetSignedUrl(s3Client, command, { expiresIn });
    }

    // Local fallback - return relative path
    return `/uploads/${path.basename(key)}`;
  }
}
