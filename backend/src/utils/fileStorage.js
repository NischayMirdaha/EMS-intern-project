import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const UPLOAD_ROOT = path.resolve(__dirname, "../../uploads");

export const ensureUploadDirs = (subdirs) => {
  for (const subdir of subdirs) {
    fs.mkdirSync(path.join(UPLOAD_ROOT, subdir), { recursive: true });
  }
};

export const toStoredPath = (subdir, filename) => `${subdir}/${filename}`;

export const resolveStoredPath = (storedPath) => {
  const resolved = path.resolve(UPLOAD_ROOT, storedPath);

  if (!resolved.startsWith(UPLOAD_ROOT)) {
    throw new Error("Resolved path escapes the upload root.");
  }
  return resolved;
};

export const deleteStoredFile = (storedPath) => {
  if (!storedPath) return;
  try {
    fs.unlinkSync(resolveStoredPath(storedPath));
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.error("Failed to delete stored file:", storedPath, err);
    }
  }
};

export const deleteFileAtPath = (absolutePath) => {
  if (!absolutePath) return;
  try {
    fs.unlinkSync(absolutePath);
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.error("Failed to delete orphaned upload:", absolutePath, err);
    }
  }
};
