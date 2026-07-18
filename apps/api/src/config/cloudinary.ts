import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';

export const isCloudinaryConfigured = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET,
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

export { cloudinary };

export async function uploadImage(
  buffer: Buffer,
  folder = 'abou-al-nas/products',
): Promise<{ url: string; publicId: string }> {
  if (!isCloudinaryConfigured) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_* env vars or use imageUrls.');
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Upload failed'));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    stream.end(buffer);
  });
}
