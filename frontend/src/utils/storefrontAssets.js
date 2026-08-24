const STOREFRONT_ASSETS = Object.freeze({
  hero: "/storefront/hero-marketplace.webp",
  accountTypes: Object.freeze({
    3: "/storefront/category-budget.webp",
    4: "/storefront/category-entry.webp",
    5: "/storefront/category-mystery.webp",
  }),
});

const LEGACY_HERO_FILES = new Set([
  "1781699932889-999fit51t9.webp",
  "1781698912502-33jr6r6lebh.webp",
]);

const LEGACY_ACCOUNT_TYPE_FILES = new Set([
  "1781698006020-snuhxxuvepr.webp",
  "1781698080958-2k0q0ulkhfr.webp",
  "1781699830380-qhljsbjnbyp.webp",
  "1781700976202-hzdm0a9pfv6.webp",
]);

function getFileName(source) {
  if (typeof source !== "string" || !source.trim()) return "";

  try {
    const parsed = new URL(source, window.location.origin);
    return parsed.pathname.split("/").filter(Boolean).pop() || "";
  } catch {
    return source.split(/[?#]/, 1)[0].split("/").filter(Boolean).pop() || "";
  }
}

export function resolveStorefrontHero(source) {
  const fileName = getFileName(source);
  return !fileName || LEGACY_HERO_FILES.has(fileName)
    ? STOREFRONT_ASSETS.hero
    : source;
}

export function resolveAccountTypeImage(accountType) {
  const source = accountType?.img;
  const fileName = getFileName(source);
  const ownedFallback = STOREFRONT_ASSETS.accountTypes[Number(accountType?.id)];

  if (ownedFallback && (!fileName || LEGACY_ACCOUNT_TYPE_FILES.has(fileName))) {
    return ownedFallback;
  }

  return source;
}

