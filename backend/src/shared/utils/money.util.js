const MAX_MONEY = Number.MAX_SAFE_INTEGER;

export function parseMoney(value) {
  if (typeof value === "string") {
    if (!/^\d+$/.test(value.trim())) return null;
  } else if (typeof value !== "number") {
    return null;
  }
  const amount = Number(value);
  return Number.isSafeInteger(amount) && amount >= 0 && amount <= MAX_MONEY ? amount : null;
}

export function requirePositiveMoney(value) {
  const amount = parseMoney(value);
  return amount && amount > 0 ? amount : null;
}
