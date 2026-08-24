import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,

  fileFilter: (req, file, cb) => {
    const ext = (file.originalname || "").toLowerCase();
    const isPdf = file.mimetype === "application/pdf" || ext.endsWith(".pdf");
    const isDocx =
      file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      ext.endsWith(".docx");
    const isDoc = file.mimetype === "application/msword" || ext.endsWith(".doc");

    if (isPdf || isDocx || isDoc) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and Word documents (.pdf, .docx, .doc) are allowed."), false);
    }
  },

  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

export default upload;