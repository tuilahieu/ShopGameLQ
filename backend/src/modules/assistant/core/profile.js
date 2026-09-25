export const DEFAULT_ASSISTANT_NAME = "Gia Linh";
export const DEFAULT_ASSISTANT_AVATAR = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS-jXgFWFj2PRcDPCDeQSstvlzW_-DXWC7xVZQYgNsv5-8qgRb8wArhzynL&s=10";

export function normalizeAssistantName(value) {
  if (typeof value !== "string") return null;
  const name = value.trim().replace(/\s+/gu, " ");
  if (name.length < 2 || name.length > 40 || !/^[\p{L}\p{M}\p{N} ]+$/u.test(name)) return null;
  return name;
}

export function normalizeAssistantAvatar(value) {
  if (typeof value !== "string") return null;
  const avatar = value.trim();
  if (avatar.length > 1024) return null;
  if (!avatar) return "";
  if (/^\/uploads\/[a-zA-Z0-9._/-]+$/u.test(avatar) && !avatar.includes("..")) return avatar;
  try {
    const url = new URL(avatar);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export function publicAssistantProfile(setting) {
  return {
    name: normalizeAssistantName(setting?.assistant_name) || DEFAULT_ASSISTANT_NAME,
    avatar: normalizeAssistantAvatar(setting?.assistant_avatar) || DEFAULT_ASSISTANT_AVATAR,
  };
}
