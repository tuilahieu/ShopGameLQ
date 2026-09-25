/**
 * Express resolves req.ip from the socket unless `trust proxy` is configured.
 * We deliberately do not read X-Forwarded-For here: accepting it directly
 * would let a caller forge their source address when the API is reachable.
 */
export function normalizeIp(value) {
  if (typeof value !== "string") return null;

  const ip = value.trim().replace(/^\[(.*)\]$/, "$1");
  if (!ip) return null;

  // Node commonly exposes an IPv4 peer through its IPv6 representation.
  if (ip.toLowerCase().startsWith("::ffff:")) return ip.slice(7);
  return ip;
}

export function getClientIp(req) {
  return normalizeIp(req.ip) || normalizeIp(req.socket?.remoteAddress) || null;
}
