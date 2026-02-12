import { Storage, GetSignedUrlConfig } from '@google-cloud/storage';
import path from 'path';
import fs from 'fs';

const USE_GCS = process.env.GCS_BUCKET_NAME && process.env.GCS_PROJECT_ID;

let storage: Storage | null = null;
let bucket: any = null;

if (USE_GCS) {
  const keyFilename = process.env.GCS_KEY_FILE || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  storage = new Storage({
    projectId: process.env.GCS_PROJECT_ID,
    ...(keyFilename && { keyFilename }),
  });
  bucket = storage.bucket(process.env.GCS_BUCKET_NAME!);
  console.log(`Using Google Cloud Storage: ${process.env.GCS_BUCKET_NAME}`);
} else {
  console.log('Using local file storage (GCS not configured)');
}

interface UploadResult {
  url: string;
  filename: string;
}

export async function uploadFile(
  file: Express.Multer.File,
  folder: string = 'uploads'
): Promise<UploadResult> {
  const timestamp = Date.now();
  const randomId = Math.round(Math.random() * 1e9);
  const ext = path.extname(file.originalname);
  const filename = `${folder}/${timestamp}-${randomId}${ext}`;

  if (USE_GCS && bucket) {
    const blob = bucket.file(filename);
    await new Promise<void>((resolve, reject) => {
      const blobStream = blob.createWriteStream({
        resumable: false,
        contentType: file.mimetype,
        metadata: { cacheControl: 'public, max-age=31536000' },
      });
      blobStream.on('error', (err: Error) => reject(err));
      blobStream.on('finish', () => resolve());
      blobStream.end(file.buffer);
    });
    return { url: filename, filename };
  } else {
    const uploadDir = path.join(process.cwd(), 'uploads', folder);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const localFilename = `${timestamp}-${randomId}${ext}`;
    fs.writeFileSync(path.join(uploadDir, localFilename), file.buffer);
    return { url: `/uploads/${folder}/${localFilename}`, filename: localFilename };
  }
}

export async function generateSignedUrl(objectPath: string): Promise<string> {
  if (!objectPath) return objectPath;
  if (objectPath.startsWith('http://') || objectPath.startsWith('https://')) return objectPath;
  if (objectPath.startsWith('/uploads/')) return objectPath;
  if (!USE_GCS || !bucket) return objectPath;

  try {
    const config: GetSignedUrlConfig = {
      version: 'v4',
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000,
    };
    const [signedUrl] = await bucket.file(objectPath).getSignedUrl(config);
    return signedUrl;
  } catch (err) {
    console.error('Failed to generate signed URL:', err);
    return `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${objectPath}`;
  }
}

export async function deleteFile(filePathOrUrl: string): Promise<void> {
  if (!filePathOrUrl) return;

  if (USE_GCS && bucket) {
    let objectPath = filePathOrUrl;
    if (filePathOrUrl.includes('storage.googleapis.com')) {
      const parts = filePathOrUrl.split(`${process.env.GCS_BUCKET_NAME}/`);
      if (parts.length > 1) objectPath = parts[1].split('?')[0];
    }
    if (objectPath.includes('?')) objectPath = objectPath.split('?')[0];
    if (objectPath.startsWith('/uploads/')) {
      const localPath = path.join(process.cwd(), objectPath);
      if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
      return;
    }
    try {
      await bucket.file(objectPath).delete();
    } catch (err) {
      console.error('Failed to delete GCS file:', err);
    }
  } else if (filePathOrUrl.startsWith('/uploads/')) {
    const localPath = path.join(process.cwd(), filePathOrUrl);
    if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
  }
}
