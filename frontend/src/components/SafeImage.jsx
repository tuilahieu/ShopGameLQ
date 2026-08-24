import { ImageOff } from "lucide-react";
import { useEffect, useState } from "react";
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
  ...props
}) {
  const resolvedSrc = resolveMediaUrl(src);
  const [failed, setFailed] = useState(!resolvedSrc);

  useEffect(() => {
    setFailed(!resolvedSrc);
  }, [resolvedSrc]);

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
      className={className}
      style={style}
      onError={(event) => {
        setFailed(true);
        onError?.(event);
      }}
    />
  );
}
