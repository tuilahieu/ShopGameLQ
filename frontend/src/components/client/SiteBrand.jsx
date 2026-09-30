import SafeImage from "../SafeImage";

export function BrandWordmark({ name }) {
  const brandName = String(name || "Shop Game").trim();
  const words = brandName.split(/\s+/).filter(Boolean);
  let primary = words.slice(0, -1).join(" ");
  let accent = words.at(-1) || "Game";

  if (words.length === 1) {
    const preferredBreak = brandName.search(/game|liên|lien|quân|quan|store/i);
    const breakAt = preferredBreak > 1 ? preferredBreak : Math.max(1, Math.ceil(brandName.length / 2));
    primary = brandName.slice(0, breakAt);
    accent = brandName.slice(breakAt);
  }

  return (
    <span className="client-wordmark" aria-label={brandName}>
      <span>{primary}</span><em>{accent}</em>
    </span>
  );
}

export default function SiteBrand({ setting = {}, imageWidth = 132, imageHeight = 32 }) {
  const name = setting.ten_web?.trim() || "Shop Game";

  return setting.logo ? (
    <SafeImage
      src={setting.logo}
      alt={`Logo ${name}`}
      width={imageWidth}
      height={imageHeight}
      loading="eager"
      fallbackLabel={name}
    />
  ) : <BrandWordmark name={name} />;
}
