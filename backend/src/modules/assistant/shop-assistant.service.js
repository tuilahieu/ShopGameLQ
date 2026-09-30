import { Op } from "sequelize";
import { AccountType, Category, GameAccount, Sale } from "../../database/models.js";
import { resolveAccountPricing } from "../commerce/pricing.service.js";
import { buildActiveSaleWhere } from "../promotions/sale.service.js";

const MAX_MESSAGE_LENGTH = 500;

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLocaleLowerCase("vi-VN")
    .replace(/đ/gu, "d")
    .replace(/[^a-z0-9]+/gu, " ")
    .trim();
}

export function extractAccountTypeQuery(input) {
  const message = typeof input === "string" ? input.trim().slice(0, MAX_MESSAGE_LENGTH) : "";
  if (!message) return null;
  const normalized = normalizeSearchText(message);
  const match = normalized.match(/\b(?:acc|nick)\s+(.+)$/u);
  if (!match) return null;
  const candidate = match[1]
    .replace(/\b(?:nao|khong|ko|k|khum|con|hang|ban|co|gia|tam|khoang|duoi|tren|sale|giam gia|cho|minh|em|e|a|vay|the|nha|nhe)\b.*$/u, "")
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:trieu|tr|m|nghin|ngan|k|d|vnd)?\b/gu, "")
    .trim();
  if (!candidate || /^(?:gi|loai|tai khoan|lien quan)$/u.test(candidate)) return null;
  return candidate.slice(0, 80);
}

export function parseShoppingRequest(input) {
  const message = typeof input === "string" ? input.trim().slice(0, MAX_MESSAGE_LENGTH) : "";
  const normalized = message.toLocaleLowerCase("vi-VN");
  const match = normalized.match(/(\d{1,3}(?:[.,\s]\d{3})+|\d+(?:[.,]\d+)?)\s*(triệu|tr|m|nghìn|ngàn|k|đ|vnd)?(?=$|\s|[?!.,])/u);
  let budget = null;
  if (match) {
    const unit = match[2] || "";
    const raw = match[1];
    let numeric = unit === "triệu" || unit === "tr" || unit === "m"
      ? Number(raw.replace(",", ".")) * 1_000_000
      : unit === "nghìn" || unit === "ngàn" || unit === "k"
        ? Number(raw.replace(",", ".")) * 1_000
        : Number(raw.replace(/[.,\s]/g, ""));
    const implicitThousands = !unit
      && /^\d{2,4}$/u.test(raw)
      && /\b(?:acc|nick)\b|tài khoản|tai khoan|giá|gia|tầm|tam|khoảng|khoang/u.test(normalized);
    if (implicitThousands) numeric *= 1_000;
    if (Number.isSafeInteger(numeric) && numeric >= 10_000 && numeric <= 100_000_000) budget = numeric;
  }
  return {
    message,
    budget,
    limit: parseRequestedLimit(normalized),
    underBudget: /(dưới|duoi|không quá|khong qua|tối đa|toi da|<=)/u.test(normalized),
    saleOnly: /(sale|giảm giá|giam gia|khuyến mãi|khuyen mai)/u.test(normalized),
    accountTypeQuery: extractAccountTypeQuery(message),
  };
}

function parseRequestedLimit(normalizedMessage) {
  const numberWords = { "một": 1, "mot": 1, "hai": 2, "ba": 3, "bốn": 4, "bon": 4 };
  const match = normalizedMessage.match(/\b([1-4]|một|mot|hai|ba|bốn|bon)\s+(?:acc|nick)\b/u)
    || normalizedMessage.match(/\b(?:acc|nick)\s+(?:này\s+)?([1-4]|một|mot|hai|ba|bốn|bon)(?:\s+(?:cái|con))?\s+thôi\b/u);
  if (!match) return null;
  return Number(match[1]) || numberWords[match[1]] || null;
}

function serializeAccount(account, pricing) {
  return {
    id: account.id,
    title: `Acc Liên Quân #${account.id}`,
    category: account.accountType?.name || "Tài khoản Liên Quân",
    price: pricing.finalPrice,
    original_price: pricing.originalPrice,
    is_sale: pricing.isSale,
    image: account.img || null,
    href: `/account/${account.id}`,
  };
}

async function findMatchingAccountTypeIds(query) {
  if (!query) return null;
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return null;
  const queryTokens = normalizedQuery.split(" ").filter(Boolean);
  const types = await AccountType.findAll({
    where: { status: 1 },
    attributes: ["id", "name"],
    include: [{
      model: Category,
      as: "category",
      attributes: ["name"],
      where: { status: 1 },
      required: true,
    }],
    order: [["id", "ASC"]],
  });
  return types.filter((type) => {
    const normalizedName = normalizeSearchText(type.name);
    const normalizedCategory = normalizeSearchText(type.category?.name);
    return [normalizedName, normalizedCategory].some((candidate) => {
      if (!candidate) return false;
      const candidateTokens = new Set(candidate.split(" ").filter(Boolean));
      return candidate.includes(normalizedQuery)
        || normalizedQuery.includes(candidate)
        || queryTokens.every((token) => candidateTokens.has(token));
    });
  }).map((type) => Number(type.id)).filter(Number.isSafeInteger);
}

export async function recommendAccounts({ budget, underBudget, saleOnly, accountTypeQuery = null, limit = 4 }) {
  const resultLimit = Number.isSafeInteger(limit) && limit >= 1 && limit <= 4 ? limit : 4;
  const now = new Date();
  const ceiling = budget ? Math.round(budget * (underBudget ? 1 : 1.3)) : null;
  const accountTypeIds = await findMatchingAccountTypeIds(accountTypeQuery);
  if (accountTypeIds?.length === 0) return [];
  const activeSales = await Sale.findAll({
    where: {
      ...buildActiveSaleWhere({ now }),
      ...(ceiling && { sale_price: { [Op.lte]: ceiling } }),
    },
    attributes: ["id", "acc_id", "sale_price"],
    order: [["id", "DESC"]],
    limit: 500,
  });
  const saleByAccount = new Map();
  for (const sale of activeSales) {
    if (!saleByAccount.has(Number(sale.acc_id))) saleByAccount.set(Number(sale.acc_id), sale);
  }

  const where = {
    status: 0,
    ...(accountTypeIds && { loai_id: { [Op.in]: accountTypeIds } }),
  };
  if (ceiling) {
    where[Op.or] = [
      { gia: { [Op.lte]: ceiling } },
      { sale_price: { [Op.lte]: ceiling } },
      ...(saleByAccount.size ? [{ id: { [Op.in]: [...saleByAccount.keys()] } }] : []),
    ];
  }
  const accounts = await GameAccount.findAll({
    where,
    attributes: ["id", "loai_id", "gia", "sale_price", "img"],
    include: [{ model: AccountType, as: "accountType", attributes: ["name"], required: false }],
    order: [["id", "DESC"]],
    limit: 300,
  });

  return accounts.flatMap((account) => {
    const pricing = resolveAccountPricing(account, saleByAccount.get(Number(account.id)));
    if (budget && (underBudget ? pricing.finalPrice > budget : pricing.finalPrice > ceiling)) return [];
    if (saleOnly && !pricing.isSale) return [];
    return [serializeAccount(account, pricing)];
  }).sort((a, b) => {
    if (budget) return Math.abs(a.price - budget) - Math.abs(b.price - budget) || b.id - a.id;
    return b.id - a.id;
  }).slice(0, resultLimit);
}

export function answerShoppingRequest(request, accounts) {
  const { message, budget, underBudget, saleOnly, accountTypeQuery } = request;
  if (!message) return { text: "Bạn đang tìm acc khoảng bao nhiêu tiền ạ? Mình sẽ xem các acc đang bán cho bạn.", accounts: [] };
  if (accounts.length) {
    const price = budget?.toLocaleString("vi-VN");
    const description = accountTypeQuery
      ? `Mình tìm thấy ${accounts.length} acc ${accounts[0].category} đang bán nè, bạn xem thử nhá:`
      : budget
      ? underBudget ? `Có ${accounts.length} acc trong tầm ${price}đ trở xuống. Bạn xem thử nhé:` : `Mình tìm thấy ${accounts.length} acc gần mức ${price}đ. Bạn xem chiếc nào hợp ý nhé:`
      : saleOnly ? "Mình thấy vài acc đang giảm giá, bạn xem thử nhé:" : "Mình chọn vài acc đang bán để bạn xem nhanh nhé:";
    return { text: description, accounts };
  }
  if (budget || saleOnly || accountTypeQuery) {
    return {
      text: "Tiếc quá, hiện mình chưa thấy acc phù hợp. Bạn thử mức giá khác nhé, hoặc xem thêm trong kho acc.",
      accounts: [],
      link: { label: "Xem kho acc", href: "/accounts" },
    };
  }
  return {
    text: "Mình giúp bạn tìm acc theo giá nhé. Bạn muốn tầm bao nhiêu, hoặc muốn xem acc đang sale ạ?",
    accounts: [],
    link: { label: "Xem kho acc", href: "/accounts" },
  };
}
