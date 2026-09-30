const FALLBACK_BUYERS = [
  "minhquan", "ngocanh", "hoangnam", "thanhdat", "quocbao",
  "duyphong", "tuananh", "huyhoang", "phuonglinh", "ducmanh",
];

export function maskPublicUsername(username) {
  const clean = typeof username === "string" ? username.trim() : "";
  if (!clean) return "kh*****ch";
  if (clean.length === 1) return `${clean}*****${clean}`;
  if (clean.length === 2) return `${clean[0]}*****${clean[1]}`;
  if (clean.length === 3) return `${clean.slice(0, 2)}*****${clean.at(-1)}`;
  return `${clean.slice(0, 2)}*****${clean.slice(-2)}`;
}

function plain(record) {
  return typeof record?.toJSON === "function" ? record.toJSON() : record;
}

function randomIndex(length, random) {
  return Math.min(length - 1, Math.floor(random() * length));
}

export function buildRecentPurchases({
  orders = [],
  accountTypes = [],
  categories = [],
  accounts = [],
  now = new Date(),
  random = Math.random,
  fallbackCount = 6,
} = {}) {
  const realPurchases = orders
    .map(plain)
    .filter((order) => order?.user?.username && order?.account?.accountType?.name)
    .map((order) => ({
      id: `order-${order.id}`,
      masked_user: maskPublicUsername(order.user.username),
      account_type_name: order.account.accountType.name,
      category_name: order.account.accountType.category?.name || null,
      price: Number(order.final_price || 0),
      created_at: order.created_at,
      simulated: false,
    }));

  if (realPurchases.length > 0) {
    return { simulated: false, items: realPurchases };
  }

  const activeCategoryIds = new Set(
    categories.map(plain).filter((category) => Number(category?.status) === 1).map((category) => Number(category.id)),
  );
  const activeTypes = accountTypes
    .map(plain)
    .filter((type) => Number(type?.status) === 1 && activeCategoryIds.has(Number(type.danhmuc_id)));

  if (activeTypes.length === 0) return { simulated: true, items: [] };

  const accountRows = accounts.map(plain);
  const nowMs = now.getTime();
  const items = Array.from({ length: fallbackCount }, (_, index) => {
    const type = activeTypes[randomIndex(activeTypes.length, random)];
    const category = categories.map(plain).find((item) => Number(item.id) === Number(type.danhmuc_id));
    const matchingAccounts = accountRows.filter((account) => Number(account.loai_id) === Number(type.id));
    const pricedAccount = matchingAccounts.length > 0
      ? matchingAccounts[randomIndex(matchingAccounts.length, random)]
      : null;
    const buyer = FALLBACK_BUYERS[randomIndex(FALLBACK_BUYERS.length, random)];
    const minutesAgo = 2 + index * 7 + Math.floor(random() * 6);

    return {
      id: `simulated-${type.id}-${index}`,
      masked_user: maskPublicUsername(buyer),
      account_type_name: type.name,
      category_name: category?.name || null,
      price: Number(pricedAccount?.final_price ?? pricedAccount?.gia ?? 0),
      created_at: new Date(nowMs - minutesAgo * 60_000).toISOString(),
      simulated: true,
    };
  });

  return { simulated: true, items };
}
