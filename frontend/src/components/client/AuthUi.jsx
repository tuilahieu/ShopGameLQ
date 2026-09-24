import { AlertCircle, Gamepad2 } from "lucide-react";
import FormField from "./FormField";

export function AuthCard({ title, description, error, children, footer }) {
  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <div className="auth-header-logo">
          <div className="auth-game-mark"><Gamepad2 size={27} aria-hidden="true" /></div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>

        {error && (
          <div className="alert-error auth-alert" role="alert">
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
            <span>{error}</span>
          </div>
        )}

        {children}

        <div className="auth-footer-text">{footer}</div>
      </div>
    </div>
  );
}

export function AuthField({ id, label, icon: Icon, ...inputProps }) {
  return (
    <FormField id={id} label={<><Icon size={15} aria-hidden="true" /> {label}</>} labelClassName="auth-field-label">
      <input id={id} {...inputProps} />
    </FormField>
  );
}
