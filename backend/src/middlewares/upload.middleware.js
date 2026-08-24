import multer from "multer";
import path from "path";
import fs from "fs";
import { env } from "../config/env.js";

const uploadDir = path.resolve(env.uploadDir);
const extensionByMime = Object.freeze({
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
});

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
    // Never preserve the untrusted original extension. A client may claim an
    // image MIME type for an .html file; serving it as .html would allow stored
    // XSS on the shop's own origin.
    cb(null, `${Date.now()}-${Math.random().toString(36).substring(2)}${extensionByMime[file.mimetype]}`);
  },
});

function fileFilter(req, file, cb) {
  if (!extensionByMime[file.mimetype]) {
    return cb(new Error("Chỉ hỗ trợ file ảnh"), false);
  }

  cb(null, true);
}

export const upload = multer({
  storage,
  fileFilter,

  limits: {
    fileSize: 8 * 1024 * 1024,
  },
});
