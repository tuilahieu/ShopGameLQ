import { useState } from "react";
import { User, Lock, Copy, Check, Eye, EyeOff } from "lucide-react";

export default function LoginCredentials({ login, copiedField, onCopy }) {
  const rawLogin = String(login || "");
  const separatorIndex = rawLogin.indexOf("|");
  const username = separatorIndex >= 0 ? rawLogin.slice(0, separatorIndex) : rawLogin;
  const password = separatorIndex >= 0 ? rawLogin.slice(separatorIndex + 1) : "";
  const [showPassword, setShowPassword] = useState(true);

  return (
    <div className="login-credentials-box">
      <div className="credential-quick-copy">
        <span>Nhấn vào từng ô để chọn nhanh</span>
        <button
          type="button"
          className={`credential-copy-all ${copiedField === "all" ? "is-copied" : ""}`}
          onClick={() => onCopy(rawLogin, "all")}
          disabled={!rawLogin}
        >
          {copiedField === "all" ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
          <span>{copiedField === "all" ? "Đã chép cả hai" : "Sao chép cả hai"}</span>
        </button>
      </div>
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
