import { HistoryLog } from "../models/index.js";

export async function writeLog(userId, content, ip = null) {
  try {
    await HistoryLog.create({
      user_id: userId || null,
      noidung: content,
      ip,
    });
  } catch (error) {
    console.error("WRITE LOG ERROR:", error);
  }
}
