import CopyButton from "./CopyButton";

export default function LoginCredentials({ login, copiedField, onCopy }) {
  const [username, password] = String(login || "").split("|");

  return (
    <div className="login-credentials-box" style={{ marginTop: 0 }}>
      <div className="credential-item">
        <span style={{ color: "var(--text-secondary)" }}>Tài khoản:</span>
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <strong style={{ color: "var(--text-primary)" }}>{username}</strong>
          <CopyButton value={username} field="user" copiedField={copiedField} onCopy={onCopy} label="Sao chép tên đăng nhập tài khoản game" size={12} />
        </span>
      </div>
      <div className="credential-item">
        <span style={{ color: "var(--text-secondary)" }}>Mật khẩu:</span>
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <strong style={{ color: "var(--text-primary)" }}>{password}</strong>
          <CopyButton value={password} field="pass" copiedField={copiedField} onCopy={onCopy} label="Sao chép mật khẩu tài khoản game" size={12} />
        </span>
      </div>
    </div>
  );
}
