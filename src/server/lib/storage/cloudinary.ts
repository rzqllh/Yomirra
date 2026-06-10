import { v2 as cloudinary } from "cloudinary";
import { env } from "@/env";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export const uploadImage = async (
  file: File | Blob | string,
  folder = "manga-reader/profiles"
): Promise<{ url: string; publicId: string }> => {
  let dataToUpload: string;

  if (typeof file === "string") {
    // If it's a base64 string or URL
    dataToUpload = file;
  } else {
    // Convert Blob/File to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mime = file.type;
    dataToUpload = `data:${mime};base64,${buffer.toString("base64")}`;
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      dataToUpload,
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Failed to upload image to Cloudinary"));
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      }
    );
  });
};

export const deleteImage = async (publicId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error || result.result !== "ok") {
        reject(error || new Error("Failed to delete image"));
      } else {
        resolve();
      }
    });
  });
};
