export const FILE_UPLOAD = Object.freeze({
  MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10 MB
  ALLOWED_MIME_TYPES: Object.freeze([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "image/jpeg",
    "image/png",
    "application/zip",
  ]),
});

export const UPLOAD_SUBDIR = Object.freeze({
  ASSIGNMENTS: "assignments",
  SUBMISSIONS: "submissions",
});
