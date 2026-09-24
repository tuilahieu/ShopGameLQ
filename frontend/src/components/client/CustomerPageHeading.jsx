export default function CustomerPageHeading({ eyebrow, title, description, eyebrowClassName = "storefront-section-kicker" }) {
  return (
    <header className="customer-page-heading">
      <span className={eyebrowClassName}>{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  );
}
