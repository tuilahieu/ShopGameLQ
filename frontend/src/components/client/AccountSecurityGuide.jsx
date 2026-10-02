import { ChevronDown, ShieldAlert } from "lucide-react";

export default function AccountSecurityGuide() {
  return (
    <details className="order-security-note">
      <summary className="order-security-heading">
        <span className="order-security-icon" aria-hidden="true">
          <ShieldAlert size={18} />
        </span>
        <div>
          <strong>Bảo mật tài khoản ngay sau khi đăng nhập</strong>
          <span>Đổi mật khẩu, liên kết số điện thoại và email của bạn</span>
        </div>
        <ChevronDown className="order-security-chevron" size={18} aria-hidden="true" />
      </summary>
      <div className="order-security-content">
        <ol className="order-security-steps">
          <li><span>1</span><p><strong>Kiểm tra đăng nhập</strong>Đăng nhập game bằng thông tin phía trên.</p></li>
          <li><span>2</span><p><strong>Liên kết bảo mật</strong>Thêm số điện thoại và email cá nhân.</p></li>
          <li><span>3</span><p><strong>Đổi mật khẩu</strong>Tạo mật khẩu mới và không chia sẻ mã xác nhận.</p></li>
        </ol>
      </div>
    </details>
  );
}
