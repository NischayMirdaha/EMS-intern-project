import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";

export const uploadPDFToCloudinary = (buffer, originalName) => {
  return new Promise((resolve, reject) => {
    // Preserve extension (.pdf, .docx, .doc) so Cloudinary serves the file with proper extension and headers
    const ext = originalName.includes(".")
      ? originalName.slice(originalName.lastIndexOf(".")).toLowerCase()
      : ".pdf";
    const cleanBaseName = originalName
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_");
    const uniquePublicId = `${cleanBaseName}_${Date.now()}${ext}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "ems/question-papers",
        resource_type: "raw",
        public_id: uniquePublicId,
        use_filename: true,
        unique_filename: false,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
};