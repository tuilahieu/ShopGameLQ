import { Setting } from "../models/index.js";
import { successResponse, errorResponse } from "../utils/response.util.js";

export async function getPublicSetting(req, res) {
  try {
    let setting = await Setting.findByPk(1);

    if (!setting) {
      return successResponse(res, "OK", {});
    }

    return successResponse(res, "Lấy cấu hình website thành công", {
      ten_web: setting.ten_web,
      logo: setting.logo,
      favicon: setting.favicon,
      banner: setting.banner,
      background: setting.background,
      fb_admin: setting.fb_admin,
      sdt_admin: setting.sdt_admin,
      email: setting.email,
      ck_ctv: setting.ck_ctv,
      thongbao: setting.thongbao,
    });
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Có lỗi xảy ra", 500);
  }
}
