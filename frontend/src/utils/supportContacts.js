function getHttpUrl(value) {
  if (typeof value !== "string" || !value.trim()) return "";

  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
  } catch {
    return "";
  }
}

export function getSupportContacts(setting = {}) {
  const rawPhone = typeof setting.sdt_admin === "string" ? setting.sdt_admin.trim() : "";
  const phoneDigits = rawPhone.replace(/\D/g, "");
  const hasValidPhone = phoneDigits.length >= 8 && phoneDigits.length <= 15;
  const facebookLink = getHttpUrl(setting.fb_admin);

  return {
    phoneDisplay: hasValidPhone ? rawPhone : "",
    zaloLink: hasValidPhone ? `https://zalo.me/${phoneDigits}` : "",
    facebookLink,
    hasAnyContact: hasValidPhone || Boolean(facebookLink),
  };
}
