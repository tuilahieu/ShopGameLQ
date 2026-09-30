import { useState } from "react";
import { User, Lock, Copy, Check, Eye, EyeOff } from "lucide-react";

export default function LoginCredentials({ login, copiedField, onCopy }) {
  const [username, password] = String(login || "").split("|");
  const [showPassword, setShowPassword] = useState(true);

  return (
    <div className="login-credentials-box">
      {/* USERNAME ROW */}
      <div className="credential-item credential-card-field">
        <div className="credential-field-header">
          <span className="credential-field-title">
            <User size={13} aria-hidden="true" />
            <span>Tài khoản</span>
          </span>
        </div>
        <div className="credential-field-row">
          <input
            type="text"
            readOnly
            value={username || "Chưa có dữ liệu"}
            className="credential-code-input"
            onClick={(e) => e.target.select()}
            aria-label="Tài khoản đăng nhập"
          />
          <button
            type="button"
            className={`credential-copy-button ${copiedField === "user" ? "is-copied" : ""}`}
            onClick={() => onCopy(username, "user")}
            aria-label="Sao chép tên đăng nhập"
          >
            {copiedField === "user" ? (
              <>
                <Check size={13} aria-hidden="true" />
                <span>Đã chép</span>
              </>
            ) : (
              <>
                <Copy size={13} aria-hidden="true" />
                <span>Sao chép</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* PASSWORD ROW */}
      <div className="credential-item credential-card-field">
        <div className="credential-field-header">
          <span className="credential-field-title">
            <Lock size={13} aria-hidden="true" />
            <span>Mật khẩu</span>
          </span>
        </div>
        <div className="credential-field-row">
          <input
            type={showPassword ? "text" : "password"}
            readOnly
            value={password || "Chưa có dữ liệu"}
            className="credential-code-input"
            onClick={(e) => e.target.select()}
            aria-label="Mật khẩu tài khoản"
          />
          <button
            type="button"
            className="credential-visibility-button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showPassword ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
          </button>
          <button
            type="button"
            className={`credential-copy-button ${copiedField === "pass" ? "is-copied" : ""}`}
            onClick={() => onCopy(password, "pass")}
            aria-label="Sao chép mật khẩu"
          >
            {copiedField === "pass" ? (
              <>
                <Check size={13} aria-hidden="true" />
                <span>Đã chép</span>
              </>
            ) : (
              <>
                <Copy size={13} aria-hidden="true" />
                <span>Sao chép</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
