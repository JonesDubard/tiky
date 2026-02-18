// // lib/cloudinary.ts
// import { v2 as cloudinary } from 'cloudinary';

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// export async function uploadToCloudinary(file: File): Promise<{ secure_url: string }> {
//   const bytes = await file.arrayBuffer();
//   const buffer = Buffer.from(bytes);
  
//   return new Promise((resolve, reject) => {
//     cloudinary.uploader.upload_stream(
//       {
//         folder: 'events',
//         transformation: [
//           { width: 1200, height: 630, crop: 'fill' }, // Social media size
//           { quality: 'auto' }
//         ]
//       },
//       (error, result) => {
//         if (error) reject(error);
//         else resolve(result as { secure_url: string });
//       }
//     ).end(buffer);
//   });
// }

// lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

// Define the type for Cloudinary upload result
interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  created_at: string;
  resource_type: string;
  tags: string[];
  // Add other fields as needed
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file buffer to Cloudinary
 * @param buffer - The file buffer to upload
 * @param options - Upload options (folder, public_id, etc.)
 * @returns Promise with the upload result
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  options: {
    folder?: string;
    public_id?: string;
    resource_type?: 'image' | 'video' | 'raw' | 'auto';
  } = {}
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: options.folder || 'events',
      resource_type: options.resource_type || 'image',
      ...options,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve(result as CloudinaryUploadResult);
        } else {
          reject(new Error('Upload failed - no result returned'));
        }
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Upload a file from a local path to Cloudinary
 * @param filePath - Path to the file
 * @param options - Upload options
 * @returns Promise with the upload result
 */
export async function uploadFileFromPath(
  filePath: string,
  options: {
    folder?: string;
    public_id?: string;
    resource_type?: 'image' | 'video' | 'raw' | 'auto';
  } = {}
): Promise<CloudinaryUploadResult> {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: options.folder || 'events',
      resource_type: options.resource_type || 'image',
      ...options,
    });
    return result as CloudinaryUploadResult;
  } catch (error) {
    console.error('Error uploading file to Cloudinary:', error);
    throw error;
  }
}

/**
 * Delete a file from Cloudinary
 * @param publicId - The public ID of the file to delete
 * @param options - Delete options
 * @returns Promise with the delete result
 */
export async function deleteFromCloudinary(
  publicId: string,
  options: {
    resource_type?: 'image' | 'video' | 'raw';
    invalidate?: boolean;
  } = {}
) {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: options.resource_type || 'image',
      invalidate: options.invalidate || true,
    });
    return result;
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    throw error;
  }
}

/**
 * Extract public ID from a Cloudinary URL
 * @param url - Cloudinary URL
 * @returns The public ID
 */
export function getPublicIdFromUrl(url: string): string | null {
  try {
    const matches = url.match(/\/v\d+\/(.+?)\./);
    return matches ? matches[1] : null;
  } catch {
    return null;
  }
}