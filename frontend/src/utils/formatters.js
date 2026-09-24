export function formatNumber(value) {
  return Number(value).toLocaleString();
}

export function formatVnd(value) {
  return `${formatNumber(value)}đ`;
}

export function formatDateTime(value) {
  return new Date(value).toLocaleString();
}
