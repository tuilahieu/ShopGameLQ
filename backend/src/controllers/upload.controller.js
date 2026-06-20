import { successResponse, errorResponse } from "../utils/response.util.js";

export async function uploadImage(req, res) {
  try {
    if (!req.file) {
      return errorResponse(res, "Vui lòng chọn ảnh", 400);
    }

    const url = `${req.protocol}://${req.get(
      "host",
    )}/uploads/${req.file.filename}`;

    return successResponse(res, "Upload ảnh thành công", {
      filename: req.file.filename,
      url,
    });
  } catch (error) {
    console.error(error);

    return errorResponse(res, "Có lỗi xảy ra", 500);
  }
}
