const STOREFRONT_ASSETS = Object.freeze({
  accountTypes: Object.freeze({
    3: "/storefront/category-budget.webp",
    4: "/storefront/category-entry.webp",
    5: "/storefront/category-mystery.webp",
  }),
});

export function resolveStorefrontHero(source) {
  if (source && typeof source === "string" && source.trim() && source.trim() !== "0" && source.trim().toLowerCase() !== "null") {
    return source.trim();
  }
  return "";
}

export function resolveAccountTypeImage(accountType) {
  if (accountType?.img && typeof accountType.img === "string" && accountType.img.trim() && accountType.img.trim() !== "0" && accountType.img.trim().toLowerCase() !== "null") {
    return accountType.img.trim();
  }
  return STOREFRONT_ASSETS.accountTypes[Number(accountType?.id)] || "";
}
