function toPositiveMoney(value) {
  const amount = Number(value);
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
}

function hasSaleFlag(value) {
  return value === true || value === 1 || value === "1";
}

/**
 * Keeps sale presentation consistent across cards, detail, sticky checkout and
 * confirmation. Invalid/equal-price promotions fall back to the list price.
 */
export function getAccountPricing(account) {
  const listPrice = toPositiveMoney(account?.gia)
    ?? toPositiveMoney(account?.original_price)
    ?? 0;
  const originalPrice = toPositiveMoney(account?.original_price) ?? listPrice;
  const candidateSalePrice = toPositiveMoney(account?.sale_price)
    ?? toPositiveMoney(account?.final_price);
  const hasSale = hasSaleFlag(account?.is_sale)
    && originalPrice > 0
    && candidateSalePrice !== null
    && candidateSalePrice < originalPrice;
  const currentPrice = hasSale ? candidateSalePrice : listPrice;
  const savingAmount = hasSale ? originalPrice - currentPrice : 0;
  const discountPercent = hasSale
    ? Math.floor((savingAmount * 100) / originalPrice)
    : 0;

  return {
    hasSale,
    originalPrice,
    currentPrice,
    savingAmount,
    discountPercent,
    discountLabel: hasSale && discountPercent < 1 ? "<1%" : `${discountPercent}%`,
  };
}

