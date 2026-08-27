import multer from "multer";
import crypto from "crypto";
import path from "path";
import { FILE_UPLOAD, UPLOAD_SUBDIR } from "../constants/fileUpload.js";
import { UPLOAD_ROOT, ensureUploadDirs, deleteFileAtPath } from "../utils/fileStorage.js";

ensureUploadDirs(Object.values(UPLOAD_SUBDIR));


const buildUploader = (subdir) =>
  multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, path.join(UPLOAD_ROOT, subdir)),
      filename: (req, file, cb) => {

        const ext = path.extname(file.originalname).toLowerCase();
        const uniqueName = `${Date.now()}-${crypto.randomUUID()}${ext}`;
        cb(null, uniqueName);
      },
    }),
    limits: { fileSize: FILE_UPLOAD.MAX_SIZE_BYTES },
    fileFilter: (req, file, cb) => {
      if (!FILE_UPLOAD.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(
          new Error(
            `Unsupported file type: ${file.mimetype}. Allowed: PDF, Word, PowerPoint, Excel, JPG, PNG, ZIP.`
          )
        );
      }
      cb(null, true);
    },
  });

export const uploadAssignmentAttachment = buildUploader("assignments").single(
  "attachment"
);
export const uploadSubmissionAttachment = buildUploader("submissions").single(
  "attachment"
);

export const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: `File too large. Max size is ${FILE_UPLOAD.MAX_SIZE_BYTES / (1024 * 1024)}MB.`,
      });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err) {

    return res.status(400).json({ success: false, message: err.message });
  }
  next();
};


export const cleanupOrphanedUploadOnFailure = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode >= 400) {
      deleteFileAtPath(req.file.path);
    }
    return originalJson(body);
  };

  next();
};
