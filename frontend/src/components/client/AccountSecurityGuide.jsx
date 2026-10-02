import { ShieldAlert } from "lucide-react";

export default function AccountSecurityGuide() {
  return (
    <aside className="order-security-note" aria-labelledby="account-security-title">
      <div className="order-security-heading">
        <span className="order-security-icon" aria-hidden="true">
          <ShieldAlert size={20} />
        </span>
        <div>
          <span className="order-security-eyebrow">Làm ngay sau khi đăng nhập</span>
          <strong id="account-security-title">Bảo vệ tài khoản của bạn</strong>
        </div>
      </div>
      <ol className="order-security-steps">
        <li><span>1</span><p><strong>Kiểm tra đăng nhập</strong>Đăng nhập game bằng thông tin phía trên.</p></li>
        <li><span>2</span><p><strong>Thêm thông tin cá nhân</strong>Liên kết số điện thoại và email bảo mật của bạn.</p></li>
        <li><span>3</span><p><strong>Đổi mật khẩu ngay</strong>Tạo mật khẩu mới và không chia sẻ mã xác nhận cho người khác.</p></li>
      </ol>
    </aside>
  );
}
