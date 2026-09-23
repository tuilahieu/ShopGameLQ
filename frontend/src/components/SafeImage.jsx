import { ImageOff } from "lucide-react";
import { useState } from "react";
import { resolveMediaUrl } from "../utils/mediaUrl";

/**
 * Keeps media slots stable and gives customers/admins a useful state when an
 * image URL is absent or cannot be loaded. Width/height are deliberately
 * forwarded to the native img element to avoid layout shift.
 */
export default function SafeImage({
  src,
  alt,
  width,
  height,
  className = "",
  style,
  fallbackLabel = "Chưa có ảnh",
  fallbackClassName = "",
  onError,
  loading = "lazy",
  decoding = "async",
  fetchPriority,
  onLoad,
  ...props
}) {
  const resolvedSrc = resolveMediaUrl(src);
  const [failedSrc, setFailedSrc] = useState(null);
  const [loadedSrc, setLoadedSrc] = useState(null);
  const failed = !resolvedSrc || failedSrc === resolvedSrc;
  const loaded = loadedSrc === resolvedSrc;

  if (failed) {
    const fallbackStyle = {
      ...(width && height ? { aspectRatio: `${width} / ${height}` } : {}),
      ...style,
    };

    return (
      <div
        className={`image-fallback ${fallbackClassName}`.trim()}
        style={fallbackStyle}
        role="img"
        aria-label={alt || fallbackLabel}
      >
        <ImageOff size={18} aria-hidden="true" />
        <span>{fallbackLabel}</span>
        {width && height && <small>{width} × {height}</small>}
      </div>
    );
  }

  return (
    <img
      {...props}
      src={resolvedSrc}
      alt={alt || "Hình ảnh"}
      width={width}
      height={height}
      loading={loading}
      decoding={decoding}
      fetchPriority={fetchPriority}
      className={`safe-image ${loaded ? "is-loaded" : "is-loading"} ${className}`.trim()}
      style={style}
      onLoad={(event) => {
        setLoadedSrc(resolvedSrc);
        onLoad?.(event);
      }}
      onError={(event) => {
        setFailedSrc(resolvedSrc);
        onError?.(event);
      }}
    />
  );
}
