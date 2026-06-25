import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = "uploads";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },

  filename(req, file, cb) {
    const ext = path.extname(file.originalname);

    cb(null, `${Date.now()}-${Math.random().toString(36).substring(2)}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Chỉ hỗ trợ file ảnh"), false);
  }

  cb(null, true);
}

export const upload = multer({
  storage,
  fileFilter,

  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});
