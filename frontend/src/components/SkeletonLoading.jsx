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

function CatalogueCategorySkeletonCard() {
  return (
    <article className="skeleton-catalogue-category-card" aria-hidden="true">
      <SkeletonBlock className="skeleton-catalogue-category-media" />
      <div className="skeleton-catalogue-category-copy">
        <SkeletonBlock className="is-title is-65" />
        <div className="skeleton-catalogue-category-footer">
          <SkeletonBlock className="is-line is-65" />
          <SkeletonBlock className="is-line" />
        </div>
      </div>
    </article>
  );
}

function CatalogueAccountSkeletonCard() {
  return (
    <article className="skeleton-catalogue-account-card" aria-hidden="true">
      <div className="skeleton-catalogue-account-media">
        <SkeletonBlock />
        <SkeletonBlock className="is-badge skeleton-catalogue-account-id" />
      </div>
      <div className="skeleton-catalogue-account-copy">
        <SkeletonBlock className="is-title is-65" />
        <div className="skeleton-catalogue-account-description"><SkeletonBlock className="is-line" /><SkeletonBlock className="is-line is-65" /></div>
        <div className="skeleton-chip-row"><SkeletonBlock className="is-mini-chip" /><SkeletonBlock className="is-mini-chip" /></div>
        <div className="skeleton-catalogue-account-price"><SkeletonBlock className="is-price-line" /><SkeletonBlock className="is-status" /></div>
        <SkeletonBlock className="skeleton-catalogue-account-action" />
      </div>
    </article>
  );
}

function HomeSkeleton({ label }) {
  return (
    <LoadingRegion className="skeleton-home" label={label}>
      <div className="skeleton-home-stack" aria-hidden="true">
        <section className="skeleton-home-hero">
          <div className="skeleton-home-copy">
            <SkeletonBlock className="skeleton-home-eyebrow" />
            <div className="skeleton-home-title">
              <SkeletonBlock />
              <SkeletonBlock />
              <SkeletonBlock />
            </div>
            <div className="skeleton-home-description"><SkeletonBlock /><SkeletonBlock /></div>
            <div className="skeleton-home-actions"><SkeletonBlock /></div>
            <div className="skeleton-home-benefits"><SkeletonBlock /><SkeletonBlock /></div>
          </div>
          <div className="skeleton-home-media">
            <div className="skeleton-console">
              <div className="skeleton-console-ticker is-top"><SkeletonBlock className="is-line" /><SkeletonBlock className="is-badge" /></div>
              <div className="skeleton-console-screen"><SkeletonBlock className="skeleton-console-count" /></div>
              <div className="skeleton-console-ticker is-bottom"><SkeletonBlock className="is-badge" /><SkeletonBlock className="is-line" /></div>
            </div>
          </div>
        </section>
        <div className="skeleton-notice-row"><SkeletonBlock className="is-line is-45" /><SkeletonBlock className="is-badge" /></div>
      </div>
      {Array.from({ length: 2 }, (_, section) => (
        <section className="skeleton-store-section" aria-hidden="true" key={section}>
          <div className="skeleton-section-heading"><SkeletonBlock className="is-title is-45" /><SkeletonBlock className="is-button-small" /></div>
          <div className="skeleton-home-grid">{Array.from({ length: 3 }, (_, index) => <ProductSkeletonCard compact key={index} />)}</div>
        </section>
      ))}
    </LoadingRegion>
  );
}

function CatalogueSkeleton({ label, results = false, items = 4 }) {
  return (
    <LoadingRegion className={`skeleton-catalogue${results ? " is-results" : ""}`} label={label}>
      {!results && (
        <div className="skeleton-catalogue-category-heading" aria-hidden="true">
          <div><SkeletonBlock className="is-line is-45" /><SkeletonBlock className="is-title is-65" /><SkeletonBlock className="is-line is-65" /></div>
        </div>
      )}
      {results && <div className="skeleton-type-cartridge" aria-hidden="true"><SkeletonBlock className="skeleton-cartridge-media" /><div className="skeleton-cartridge-copy"><SkeletonBlock className="is-title is-65" /><SkeletonBlock className="is-line" /><SkeletonBlock className="is-line is-65" /><SkeletonBlock className="is-field" /></div></div>}
      {results && <div className="skeleton-sort-control" aria-hidden="true"><SkeletonBlock className="is-line is-45" /><SkeletonBlock className="is-field" /></div>}
      <div className={results ? "skeleton-account-grid" : "skeleton-category-grid"}>
        {Array.from({ length: items }, (_, index) => results
          ? <CatalogueAccountSkeletonCard key={index} />
          : <CatalogueCategorySkeletonCard key={index} />)}
      </div>
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
          <div className="skeleton-detail-specs">
            <SkeletonBlock className="is-line is-45" />
            {Array.from({ length: 2 }, (_, index) => <div className="skeleton-detail-spec-row" key={index}><SkeletonBlock className="is-line is-45" /><SkeletonBlock className="is-line is-65" /></div>)}
          </div>
          <div className="skeleton-detail-coupon">
            <SkeletonBlock className="is-line is-45" />
            <div className="skeleton-field-row"><SkeletonBlock className="is-field" /><SkeletonBlock className="is-button-small" /></div>
          </div>
          <SkeletonBlock className="is-button skeleton-detail-purchase" />
          <div className="skeleton-detail-benefits">
            <SkeletonBlock className="is-line is-45" />
            <SkeletonBlock className="is-line is-65" />
            <SkeletonBlock className="is-line is-65" />
          </div>
        </div>
      </div>
      <div className="skeleton-detail-mobile-purchase" aria-hidden="true">
        <span><SkeletonBlock className="is-line is-45" /><SkeletonBlock className="is-price-line" /></span>
        <SkeletonBlock className="is-button" />
      </div>
    </LoadingRegion>
  );
}

function ProfileSkeleton({ label, showHeading = true }) {
  return (
    <LoadingRegion className="skeleton-profile-page" label={label}>
      {showHeading && <div className="skeleton-page-heading"><SkeletonBlock className="is-line is-45" /><SkeletonBlock className="is-title is-45" /><SkeletonBlock className="is-line is-65" /></div>}
      <div className="skeleton-profile-layout">
        <div className="skeleton-profile-side">
          <SkeletonBlock className="is-avatar" />
          <div className="skeleton-profile-identity"><SkeletonBlock className="is-title is-65" /><SkeletonBlock className="is-line is-45" /></div>
          <div className="skeleton-profile-summary">{Array.from({ length: 3 }, (_, index) => <div key={index}><SkeletonBlock className="is-line is-45" /><SkeletonBlock className="is-line is-45" /></div>)}</div>
          <div className="skeleton-profile-actions"><SkeletonBlock className="is-button" /><SkeletonBlock className="is-button" /></div>
        </div>
        <div className="skeleton-profile-main-stack">
          <div className="skeleton-profile-disclosure"><span><SkeletonBlock className="is-avatar" /><span><SkeletonBlock className="is-line is-45" /><SkeletonBlock className="is-line is-65" /></span></span><SkeletonBlock className="is-button-small" /></div>
          <div className="skeleton-profile-transactions">
            <SkeletonBlock className="is-title is-45" />
            <div className="skeleton-transaction-mobile-list">{Array.from({ length: 3 }, (_, index) => <div className="skeleton-transaction-mobile-card" key={index}><span><SkeletonBlock className="is-line is-65" /><SkeletonBlock className="is-line is-45" /></span><span><SkeletonBlock className="is-price-line" /><SkeletonBlock className="is-line is-65" /></span></div>)}</div>
            <div className="skeleton-transaction-table">{Array.from({ length: 5 }, (_, index) => <div className="skeleton-transaction-row" key={index}>{Array.from({ length: 5 }, (_, cell) => <SkeletonBlock className={cell === 2 ? "is-price-line" : "is-line"} key={cell} />)}</div>)}</div>
          </div>
        </div>
      </div>
    </LoadingRegion>
  );
}

function OrdersSkeleton({ label, items, showHeading = true }) {
  return (
    <LoadingRegion className="skeleton-orders-page" label={label}>
      {showHeading && <div className="skeleton-page-heading"><SkeletonBlock className="is-line is-45" /><SkeletonBlock className="is-title is-45" /><SkeletonBlock className="is-line is-65" /></div>}
      <div className="skeleton-orders-list">
        {Array.from({ length: items }, (_, index) => (
          <article className="skeleton-order-card" aria-hidden="true" key={index}>
            <SkeletonBlock className="skeleton-order-media" />
            <div className="skeleton-order-content">
              <div>
                <SkeletonBlock className="is-badge" />
                <SkeletonBlock className="is-title is-65" />
                <SkeletonBlock className="is-line is-55" />
                <SkeletonBlock className="is-line is-45" />
              </div>
              <div>
                <SkeletonBlock className="is-price-line" />
                <SkeletonBlock className="is-button" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </LoadingRegion>
  );
}

function RechargeSkeleton({ label }) {
  return (
    <LoadingRegion className="skeleton-recharge-page" label={label}>
      <div className="skeleton-page-heading"><SkeletonBlock className="is-line is-45" /><SkeletonBlock className="is-title is-45" /><SkeletonBlock className="is-line is-65" /></div>
      <div className="skeleton-recharge-layout">
        <div className="skeleton-recharge-card" aria-hidden="true">
          <div className="skeleton-recharge-intro"><div><SkeletonBlock className="is-line is-45" /><SkeletonBlock className="is-title is-65" /></div><SkeletonBlock className="is-badge" /></div>
          <div className="skeleton-recharge-grid">
            <div className="skeleton-recharge-step"><SkeletonBlock className="is-line is-45" /><div className="skeleton-amount-grid">{Array.from({ length: 4 }, (_, i) => <SkeletonBlock className="is-chip" key={i} />)}</div><SkeletonBlock className="is-field" /></div>
            <div className="skeleton-recharge-step"><SkeletonBlock className="is-line is-45" /><SkeletonBlock className="is-field" />{Array.from({ length: 3 }, (_, index) => <SkeletonBlock className="is-line" key={index} />)}</div>
          </div>
          <div className="skeleton-recharge-actions"><SkeletonBlock className="is-line is-65" /><SkeletonBlock className="is-button" /></div>
        </div>
      </div>
    </LoadingRegion>
  );
}

function RechargeBankSkeleton({ label }) {
  return (
    <LoadingRegion className="skeleton-recharge-bank" label={label}>
      <div className="skeleton-recharge-bank-field"><SkeletonBlock className="is-line is-45" /><SkeletonBlock className="is-field" /></div>
      <div className="skeleton-recharge-bank-summary">{Array.from({ length: 3 }, (_, index) => <div key={index}><SkeletonBlock className="is-line is-45" /><SkeletonBlock className="is-line is-45" /></div>)}</div>
    </LoadingRegion>
  );
}

function OrderDetailSkeleton({ label }) {
  return (
    <LoadingRegion className="skeleton-order-detail order-detail-content" label={label}>
      <section className="skeleton-order-credentials order-credentials" aria-hidden="true">
        <div className="skeleton-order-credentials-header"><span><SkeletonBlock className="is-avatar" /><span><SkeletonBlock className="is-line is-45" /><SkeletonBlock className="is-title is-65" /></span></span><SkeletonBlock className="is-badge" /></div>
        <SkeletonBlock className="skeleton-order-copy-all" />
        {Array.from({ length: 2 }, (_, index) => <div className="skeleton-order-credential-field" key={index}><SkeletonBlock className="is-line is-45" /><div><SkeletonBlock className="is-line is-65" /><SkeletonBlock className="is-button-small" /></div></div>)}
      </section>
      <section className="skeleton-order-security" aria-hidden="true">
        <div className="skeleton-order-security-heading"><SkeletonBlock className="is-avatar" /><span><SkeletonBlock className="is-line is-45" /><SkeletonBlock className="is-title is-65" /></span></div>
        <div className="skeleton-order-security-steps">{Array.from({ length: 3 }, (_, index) => <div key={index}><SkeletonBlock className="is-badge" /><span><SkeletonBlock className="is-line is-65" /><SkeletonBlock className="is-line" /></span></div>)}</div>
      </section>
      <div className="skeleton-order-summary" aria-hidden="true">{Array.from({ length: 3 }, (_, index) => <div key={index}><SkeletonBlock className="is-line is-45" /><SkeletonBlock className={index === 2 ? "is-price-line" : "is-line is-45"} /></div>)}</div>
    </LoadingRegion>
  );
}

function AuthSkeleton({ label }) {
  return <LoadingRegion className="skeleton-auth-page" label={label}><div className="skeleton-auth-card" aria-hidden="true"><SkeletonBlock className="is-avatar" /><SkeletonBlock className="is-title is-65" /><SkeletonBlock className="is-line is-45" /><SkeletonBlock className="is-field" /><SkeletonBlock className="is-field" /><SkeletonBlock className="is-button" /><SkeletonBlock className="is-line is-45" /></div></LoadingRegion>;
}

function ArticleSkeleton({ label, contact = false }) {
  return <LoadingRegion className={`skeleton-article-page${contact ? " is-contact" : ""}`} label={label}><div className="skeleton-page-heading"><SkeletonBlock className="is-line is-45" /><SkeletonBlock className="is-title is-45" /><SkeletonBlock className="is-line is-65" /></div>{contact ? <div className="skeleton-article-card skeleton-contact-card" aria-hidden="true"><SkeletonBlock className="is-title is-45" />{Array.from({ length: 3 }, (_, index) => <div className="skeleton-contact-row" key={index}><SkeletonBlock className="is-avatar" /><span><SkeletonBlock className="is-line is-45" /><SkeletonBlock className="is-line is-65" /></span><SkeletonBlock className="is-button-small" /></div>)}</div> : <><div className="skeleton-article-card skeleton-terms-intro" aria-hidden="true"><SkeletonBlock className="is-line" /><SkeletonBlock className="is-line is-65" /></div><div className="skeleton-terms-grid" aria-hidden="true">{Array.from({ length: 4 }, (_, index) => <div className="skeleton-article-card" key={index}><SkeletonBlock className="is-title is-65" /><SkeletonBlock className="is-line" /><SkeletonBlock className="is-line" /><SkeletonBlock className="is-line is-65" /></div>)}</div></>}</LoadingRegion>;
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
  if (variant === "recharge-bank") return <RechargeBankSkeleton label={label} />;
  if (variant === "order-detail") return <OrderDetailSkeleton label={label} />;
  if (variant === "auth") return <AuthSkeleton label={label} />;
  if (variant === "article") return <ArticleSkeleton label={label} />;
  if (variant === "contact") return <ArticleSkeleton label={label} contact />;
  if (variant === "workspace" || variant === "stats") return <WorkspaceSkeleton label={label} items={items} />;
  if (variant === "workspace-table") return <WorkspaceSkeleton label={label} table items={items} />;
  if (variant === "form") return <LoadingRegion className={`skeleton-form ${compact ? "is-compact" : ""}`} label={label}><SkeletonBlock className="is-title is-45" /><SkeletonBlock className="is-line is-65" />{Array.from({ length: items }, (_, index) => <SkeletonBlock className="is-field" key={index} />)}<SkeletonBlock className="is-button is-45" /></LoadingRegion>;
  if (variant === "list") return <LoadingRegion className="skeleton-list" label={label}>{Array.from({ length: items }, (_, index) => <div className="skeleton-list-item" key={index}><SkeletonBlock className="is-thumb" /><span className="skeleton-list-copy" aria-hidden="true"><SkeletonBlock className="is-line is-65" /><SkeletonBlock className="is-line is-45" /></span><SkeletonBlock className="is-button" /></div>)}</LoadingRegion>;
  return <CatalogueSkeleton label={label} items={items} />;
}
