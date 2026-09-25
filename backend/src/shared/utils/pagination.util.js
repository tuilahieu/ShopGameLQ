export function parsePagination(query, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const page = Number.parseInt(query.page, 10);
  const limit = Number.parseInt(query.limit, 10);
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const safeLimit = Number.isInteger(limit) && limit > 0
    ? Math.min(limit, maxLimit)
    : defaultLimit;

  return { page: safePage, limit: safeLimit, offset: (safePage - 1) * safeLimit };
}
