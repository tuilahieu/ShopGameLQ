export default function FormField({ id, label, labelClassName, className = "", children }) {
  return (
    <div className={`form-group-premium ${className}`.trim()}>
      <label htmlFor={id} className={labelClassName}>{label}</label>
      {children}
    </div>
  );
}
