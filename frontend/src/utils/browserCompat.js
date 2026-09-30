export function utf8ByteLength(value) {
  const text = String(value ?? "");
  if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(text).length;
  if (typeof Blob !== "undefined") return new Blob([text]).size;

  // Last-resort fallback for very old WebKit builds without TextEncoder/Blob.
  try {
    return unescape(encodeURIComponent(text)).length;
  } catch {
    return text.length;
  }
}
