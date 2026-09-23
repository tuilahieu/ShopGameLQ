export function SkeletonBlock({ className = "" }) {
  return <span className={`skeleton-block ${className}`.trim()} aria-hidden="true" />;
}

function LoadingRegion({ className, label, children }) {
  return <div className={`skeleton-layout ${className}`} role="status" aria-label={label} aria-busy="true">{children}</div>;
}

function ProductSkeletonCard({ compact = false }) {
  return (
    <article className={`skeleton-product-card${compact ? " is-compact" : ""}`} aria-hidden="true">
      <SkeletonBlock className="skeleton-product-media" />
      <div className="skeleton-product-copy">
        <SkeletonBlock className="is-line is-65" />
        <div className="skeleton-chip-row"><SkeletonBlock className="is-mini-chip" /><SkeletonBlock className="is-mini-chip" /></div>
        <div className="skeleton-product-footer"><SkeletonBlock className="is-price-line" /><SkeletonBlock className="is-status" /></div>
      </div>
    </article>
  );
}

function HomeSkeleton({ label }) {
  return (
    <LoadingRegion className="skeleton-home" label={label}>
      <section className="skeleton-home-hero" aria-hidden="true">
        <SkeletonBlock className="skeleton-home-title" />
        <div className="skeleton-console"><SkeletonBlock className="skeleton-console-screen" /></div>
        <div className="skeleton-home-actions"><SkeletonBlock /><SkeletonBlock /></div>
        <div className="skeleton-notice-row"><SkeletonBlock className="is-line is-45" /><SkeletonBlock className="is-badge" /></div>
        <SkeletonBlock className="skeleton-feed" />
      </section>
      {Array.from({ length: 2 }, (_, section) => (
        <section className="skeleton-store-section" aria-hidden="true" key={section}>
          <div className="skeleton-section-heading"><SkeletonBlock className="is-title is-45" /><SkeletonBlock className="is-button-small" /></div>
          <div className="skeleton-home-grid"><ProductSkeletonCard compact /><ProductSkeletonCard compact /></div>
        </section>
      ))}
    </LoadingRegion>
  );
}

function CatalogueSkeleton({ label, results = false, items = 4 }) {
  return (
    <LoadingRegion className={`skeleton-catalogue${results ? " is-results" : ""}`} label={label}>
      <div className="skeleton-catalogue-heading" aria-hidden="true">
        <SkeletonBlock className="is-line is-45" /><SkeletonBlock className="is-title is-65" />{!results && <SkeletonBlock className="is-line is-65" />}
      </div>
      {results && <div className="skeleton-type-cartridge" aria-hidden="true"><SkeletonBlock className="skeleton-cartridge-media" /><div className="skeleton-cartridge-copy"><SkeletonBlock className="is-title is-65" /><SkeletonBlock className="is-line is-65" /><SkeletonBlock className="is-field" /></div></div>}
      {results && <div className="skeleton-sort-control" aria-hidden="true"><SkeletonBlock className="is-line is-45" /><SkeletonBlock className="is-field" /></div>}
      <div className={results ? "skeleton-account-grid" : "skeleton-category-grid"}>{Array.from({ length: items }, (_, index) => <ProductSkeletonCard compact={!results} key={index} />)}</div>
    </LoadingRegion>
  );
}

function DetailSkeleton({ label }) {
  return (
    <LoadingRegion className="skeleton-detail-page" label={label}>
      <SkeletonBlock className="skeleton-back-link" />
      <div className="skeleton-detail-layout">
        <div className="skeleton-detail-media"><SkeletonBlock /></div>
        <div className="skeleton-detail-panel">
          <div className="skeleton-detail-badges"><SkeletonBlock className="is-badge" /><SkeletonBlock className="is-badge" /></div>
          <SkeletonBlock className="is-title" /><SkeletonBlock className="is-price" />
          <div className="skeleton-chip-row"><SkeletonBlock className="is-chip" /><SkeletonBlock className="is-chip" /></div>
          <SkeletonBlock className="is-line is-45" /><div className="skeleton-field-row"><SkeletonBlock className="is-field" /><SkeletonBlock className="is-button-small" /></div><SkeletonBlock className="is-button" />
        </div>
      </div>
    </LoadingRegion>
  );
}

function ProfileSkeleton({ label, showHeading = true }) {
  return (
    <LoadingRegion className="skeleton-profile-page" label={label}>
      {showHeading && <div className="skeleton-page-heading"><SkeletonBlock className="is-line is-45" /><SkeletonBlock className="is-title is-45" /><SkeletonBlock className="is-line is-65" /></div>}
      <div className="skeleton-profile-layout">
        <div className="skeleton-profile-side"><SkeletonBlock className="is-avatar" /><SkeletonBlock className="is-title is-65" /><SkeletonBlock className="is-line is-45" />{Array.from({ length: 3 }, (_, index) => <SkeletonBlock className="is-field" key={index} />)}</div>
        <div className="skeleton-profile-main"><SkeletonBlock className="is-title is-45" />{Array.from({ length: 5 }, (_, index) => <SkeletonBlock className={`is-line ${index % 2 ? "is-65" : ""}`} key={index} />)}<SkeletonBlock className="is-button is-45" /></div>
      </div>
    </LoadingRegion>
  );
}

function OrdersSkeleton({ label, items, showHeading = true }) {
  return (
    <LoadingRegion className="skeleton-orders-page" label={label}>
      {showHeading && <div className="skeleton-page-heading"><SkeletonBlock className="is-line is-45" /><SkeletonBlock className="is-title is-45" /><SkeletonBlock className="is-line is-65" /></div>}
      <div className="skeleton-orders-list">{Array.from({ length: items }, (_, index) => <article className="skeleton-order-card" aria-hidden="true" key={index}><div><SkeletonBlock className="is-badge" /><SkeletonBlock className="is-title is-45" /><SkeletonBlock className="is-line is-65" /></div><div><SkeletonBlock className="is-price-line" /><SkeletonBlock className="is-button" /></div></article>)}</div>
    </LoadingRegion>
  );
}

function RechargeSkeleton({ label }) {
  return (
    <LoadingRegion className="skeleton-recharge-page" label={label}>
      <div className="skeleton-page-heading"><SkeletonBlock className="is-line is-45" /><SkeletonBlock className="is-title is-45" /><SkeletonBlock className="is-line is-65" /></div>
      <div className="skeleton-recharge-layout">
        <div className="skeleton-recharge-card" aria-hidden="true">
          <SkeletonBlock className="is-title is-45" />
          <div className="skeleton-recharge-step"><SkeletonBlock className="is-line is-45" /><div className="skeleton-amount-grid">{Array.from({ length: 4 }, (_, i) => <SkeletonBlock className="is-chip" key={i} />)}</div><SkeletonBlock className="is-field" /></div>
          <div className="skeleton-recharge-step"><SkeletonBlock className="is-line is-45" /><SkeletonBlock className="is-field" /><SkeletonBlock className="is-price" /></div>
          <SkeletonBlock className="is-button" />
        </div>
      </div>
    </LoadingRegion>
  );
}

function AuthSkeleton({ label }) {
  return <LoadingRegion className="skeleton-auth-page" label={label}><div className="skeleton-auth-card" aria-hidden="true"><SkeletonBlock className="is-avatar" /><SkeletonBlock className="is-title is-65" /><SkeletonBlock className="is-line is-45" /><SkeletonBlock className="is-field" /><SkeletonBlock className="is-field" /><SkeletonBlock className="is-button" /><SkeletonBlock className="is-line is-45" /></div></LoadingRegion>;
}

function ArticleSkeleton({ label, contact = false }) {
  return <LoadingRegion className={`skeleton-article-page${contact ? " is-contact" : ""}`} label={label}><div className="skeleton-page-heading"><SkeletonBlock className="is-title is-45" /><SkeletonBlock className="is-line is-65" /></div><div className="skeleton-article-card" aria-hidden="true">{Array.from({ length: contact ? 5 : 9 }, (_, index) => <SkeletonBlock className={index % 3 === 2 ? "is-line is-65" : "is-line"} key={index} />)}{contact && <><SkeletonBlock className="is-field" /><SkeletonBlock className="is-button is-45" /></>}</div></LoadingRegion>;
}

function WorkspaceSkeleton({ label, table = false, items = 6 }) {
  return (
    <LoadingRegion className="skeleton-workspace-page" label={label}>
      <div className="skeleton-workspace-heading"><div><SkeletonBlock className="is-title is-45" /><SkeletonBlock className="is-line is-65" /></div><SkeletonBlock className="is-button-small" /></div>
      {table ? <div className="skeleton-workspace-table" aria-hidden="true"><div className="skeleton-table-tools"><SkeletonBlock className="is-field" /><SkeletonBlock className="is-button-small" /></div>{Array.from({ length: items }, (_, index) => <div className="skeleton-table-row" key={index}>{Array.from({ length: 5 }, (_, cell) => <SkeletonBlock className={cell === 0 ? "is-badge" : "is-line"} key={cell} />)}</div>)}</div> : <div className="skeleton-stats-grid">{Array.from({ length: items }, (_, index) => <div className="skeleton-stat-card" key={index}><SkeletonBlock className="is-line is-45" /><SkeletonBlock className="is-title is-65" /></div>)}</div>}
    </LoadingRegion>
  );
}

export default function SkeletonLoading({ variant = "cards", label = "Đang tải nội dung", items = 4, compact = false }) {
  if (variant === "home") return <HomeSkeleton label={label} />;
  if (variant === "catalogue") return <CatalogueSkeleton label={label} items={items} />;
  if (variant === "catalogue-results") return <CatalogueSkeleton label={label} results items={items} />;
  if (variant === "detail") return <DetailSkeleton label={label} />;
  if (variant === "profile") return <ProfileSkeleton label={label} showHeading={!compact} />;
  if (variant === "orders") return <OrdersSkeleton label={label} items={items} showHeading={!compact} />;
  if (variant === "recharge") return <RechargeSkeleton label={label} />;
  if (variant === "auth") return <AuthSkeleton label={label} />;
  if (variant === "article") return <ArticleSkeleton label={label} />;
  if (variant === "contact") return <ArticleSkeleton label={label} contact />;
  if (variant === "workspace" || variant === "stats") return <WorkspaceSkeleton label={label} items={items} />;
  if (variant === "workspace-table") return <WorkspaceSkeleton label={label} table items={items} />;
  if (variant === "form") return <LoadingRegion className={`skeleton-form ${compact ? "is-compact" : ""}`} label={label}><SkeletonBlock className="is-title is-45" /><SkeletonBlock className="is-line is-65" />{Array.from({ length: items }, (_, index) => <SkeletonBlock className="is-field" key={index} />)}<SkeletonBlock className="is-button is-45" /></LoadingRegion>;
  if (variant === "list") return <LoadingRegion className="skeleton-list" label={label}>{Array.from({ length: items }, (_, index) => <div className="skeleton-list-item" key={index}><SkeletonBlock className="is-thumb" /><span className="skeleton-list-copy" aria-hidden="true"><SkeletonBlock className="is-line is-65" /><SkeletonBlock className="is-line is-45" /></span><SkeletonBlock className="is-button" /></div>)}</LoadingRegion>;
  return <CatalogueSkeleton label={label} items={items} />;
}
