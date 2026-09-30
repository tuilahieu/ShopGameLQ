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
      maxWidth: "100%",
      maxHeight: "100%",
      boxSizing: "border-box",
      overflow: "hidden",
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
        <ImageOff size={16} aria-hidden="true" className="image-fallback-icon" />
        {fallbackLabel && <span className="image-fallback-label">{fallbackLabel}</span>}
      </div>
    );
  }

  return (
    <>
      <img
        {...props}
        src={resolvedSrc}
        alt={alt || "Hình ảnh"}
        width={width}
        height={height}
        loading={loading}
        decoding={decoding}
        fetchPriority={fetchPriority}
        aria-busy={!loaded}
        className={`safe-image ${loaded ? "is-loaded" : "is-loading"} ${className}`.trim()}
        style={style}
        onLoad={async (event) => {
          const image = event.currentTarget;
          // Consumers that read natural dimensions must run while React still
          // exposes currentTarget. After the async decode boundary it may be
          // cleared, especially when a modal or theme change triggers a render.
          onLoad?.(event);
          try {
            await image.decode?.();
          } catch {
            // The load event already confirms usable image data in browsers where
            // decode() is unavailable or rejects cached SVG/data images.
          }
          setLoadedSrc(resolvedSrc);
        }}
        onError={(event) => {
          setFailedSrc(resolvedSrc);
          onError?.(event);
        }}
      />
      {!loaded && <span className="safe-image-loader" aria-hidden="true" />}
    </>
  );
}
