export default function AccessState({ pageClassName, className = "", icon, title, description, children }) {
  return (
    <div className={`page-container ${pageClassName}`.trim()}>
      <section className={`recharge-access-state ${className}`.trim()}>
        {icon}
        <h1>{title}</h1>
        <p>{description}</p>
        {children}
      </section>
    </div>
  );
}
