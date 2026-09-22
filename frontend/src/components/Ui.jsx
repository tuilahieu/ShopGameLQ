export function PageHeading({ children, description, className = "" }) {
  return (
    <div className={`ui-page-heading ${className}`.trim()}>
      <h1 className="page-title">{children}</h1>
      {description && <p>{description}</p>}
    </div>
  );
}

export function StatusMessage({ title, description, action, className = "" }) {
  return (
    <div className={`empty-state ui-status ${className}`.trim()} role={action ? "alert" : "status"}>
      <strong>{title}</strong>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, tone = "default" }) {
  return (
    <div className={`dashboard-card ui-stat-card ui-stat-card--${tone}`}>
      <h3>{label}</h3>
      <strong>{value}</strong>
      <Icon className="card-icon" size={36} aria-hidden="true" />
    </div>
  );
}
