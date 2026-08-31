import fs from "node:fs/promises";

import { successResponse, errorResponse } from "../utils/response.util.js";

function matchesImageSignature(buffer, mimeType) {
  if (mimeType === "image/jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimeType === "image/png") return buffer.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"));
  if (mimeType === "image/gif") return buffer.subarray(0, 6).toString("ascii").match(/^GIF8[79]a$/) !== null;
  if (mimeType === "image/webp") return buffer.subarray(0, 4).toString("ascii") === "RIFF"
    && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  return false;
}

export async function uploadImage(req, res) {
  try {
    if (!req.file) {
      return errorResponse(res, "Vui lòng chọn ảnh", 400);
    }

    // MIME headers are client-controlled. Verify the file signature before
    // making it publicly reachable from /uploads.
    const contents = await fs.readFile(req.file.path);
    if (!matchesImageSignature(contents, req.file.mimetype)) {
      await fs.unlink(req.file.path).catch(() => {});
      return errorResponse(res, "Nội dung tệp không phải ảnh hợp lệ", 400, "INVALID_UPLOAD", req);
    }

    // Store a deploy-safe path instead of binding media to localhost, a LAN IP
    // or the proxy host that happened to receive this upload request.
    const url = `/uploads/${req.file.filename}`;

    return successResponse(res, "Upload ảnh thành công", {
      filename: req.file.filename,
      url,
    });
  } catch (error) {
    console.error(error);

    return errorResponse(res, "Có lỗi xảy ra", 500);
  }
}
