import { RefreshCw } from "lucide-react";
import Modal from "../Modal";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Label } from "../ui/label";

export function AdminPageHeader({ eyebrow = "Admin workspace", title, description, actions }) {
  return (
    <header className="ui-admin-page-header">
      <div className="ui-admin-page-header-copy">
        <p className="ui-admin-page-header-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="ui-admin-page-header-actions">{actions}</div>}
    </header>
  );
}

export function AdminField({ id, label, required = false, helper, className = "", children }) {
  return (
    <div className={`ui-field ${className}`.trim()}>
      <Label htmlFor={id}>{label}{required && <span className="is-required" aria-hidden="true">*</span>}</Label>
      {children}
      {helper && <p className="ui-field-helper">{helper}</p>}
    </div>
  );
}

export function AdminError({ message, onRetry }) {
  if (!message) return null;
  return (
    <Card>
      <CardContent className="ui-inline-error" role="alert">
        <span>{message}</span>
        {onRetry && <Button size="sm" variant="outline" onClick={onRetry}><RefreshCw size={14} aria-hidden="true" /> Thử lại</Button>}
      </CardContent>
    </Card>
  );
}

export function AdminConfirmDialog({ open, title, description, confirmLabel = "Xác nhận", destructive = false, pending = false, onClose, onConfirm }) {
  return (
    <Modal
      isOpen={open}
      onClose={() => !pending && onClose()}
      title={title}
      className="admin-confirm-modal"
      footer={<><Button variant="outline" onClick={onClose} disabled={pending}>Hủy</Button><Button variant={destructive ? "destructive" : "default"} onClick={onConfirm} disabled={pending} aria-busy={pending}>{pending ? "Đang xử lý…" : confirmLabel}</Button></>}
    >
      <p className="modal-description">{description}</p>
    </Modal>
  );
}
