import { useEffect, useState } from "react";
import { ShieldCheck, RefreshCw, AlertTriangle, FileText, Phone } from "lucide-react";
import api from "../../api/api";
import { updateSEO } from "../../utils/seo";

export default function Terms() {
  const [setting, setSetting] = useState(() => {
    return JSON.parse(localStorage.getItem("setting") || "{}");
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await api.get("/home");
        if (res.data?.data?.setting) {
          const updatedSetting = res.data.data.setting;
          setSetting(updatedSetting);
          localStorage.setItem("setting", JSON.stringify(updatedSetting));
        }
      } catch (err) {
        console.error("Failed to sync settings:", err);
      }
    }
    fetchSettings();
    updateSEO({
      title: "Điều Khoản Dịch Vụ & Bảo Hành",
      description: "Đọc kỹ các quy định, điều khoản sử dụng dịch vụ và chính sách bảo hành tài khoản game trước khi thực hiện giao dịch tại shop.",
      keywords: "dieu khoan dich vu, chinh sach bao hanh, quy dinh, ho tro shop acc"
    });
  }, []);

  const phoneDisplay = setting.sdt_admin || "099.999.9999";

  return (
    <div className="page-container terms-page">
      <header className="customer-page-heading">
        <span className="customer-page-eyebrow"><FileText size={15} aria-hidden="true" /> Quy định mua hàng</span>
        <h1>Điều khoản và bảo hành</h1>
        <p>Những thông tin quan trọng cần biết trước và sau khi mua tài khoản.</p>
      </header>

      <div className="terms-content">
        
        {/* Intro */}
        <section className="terms-intro" aria-label="Giới thiệu điều khoản">
          <p>
            Chào mừng bạn đến với {setting.ten_web || "Shopgameliqi"}. Khi sử dụng bất kỳ dịch vụ nào trên hệ thống của chúng tôi (mua tài khoản, nạp tiền ví, v.v.), bạn mặc định đồng ý với các chính sách và điều khoản sử dụng dưới đây. Vui lòng đọc kỹ để bảo vệ quyền lợi cá nhân của bạn.
          </p>
        </section>

        {/* Policies Grid */}
        <div className="terms-grid">
          
          {/* Card 1: Warranty */}
          <section className="terms-policy">
            <h2><ShieldCheck size={20} aria-hidden="true" /> Chính sách bảo hành acc</h2>
            <ul>
              <li>Shop cam kết tài khoản đúng 100% so với thông tin mô tả và hình ảnh đi kèm.</li>
              <li>Bảo hành lỗi <strong>Sai Mật Khẩu</strong> hoặc <strong>Thông Tin Đăng Nhập Sai</strong> tại thời điểm giao dịch (Hoàn tiền 100% hoặc đổi acc tương đương).</li>
              <li><strong>Không bảo hành</strong> trong trường hợp người mua đã đổi mật khẩu thành công nhưng sau đó bị hack, mất tài khoản do tải phần mềm thứ ba (hack game, mod skin) hoặc chia sẻ thông tin cho người khác.</li>
            </ul>
          </section>

          {/* Card 2: Recharging policy */}
          <section className="terms-policy">
            <h2><RefreshCw size={20} aria-hidden="true" /> Quy định nạp tiền ví</h2>
            <ul>
              <li><strong>ATM/Momo:</strong> Ghi đúng cú pháp <code>NAPTIEN [username]</code> và giữ lại biên lai. Giao dịch sẽ được đối soát trước khi số dư ví được cập nhật; ghi sai cú pháp vui lòng liên hệ hỗ trợ để xử lý.</li>
              <li>Hệ thống chỉ chấp nhận thanh toán qua các cổng ngân hàng/ví điện tử đang hoạt động được niêm yết chính thức tại trang nạp tiền của website.</li>
              <li>Số tiền nạp vào tài khoản ví dùng để mua nick trên shop, không hỗ trợ quy đổi ngược lại thành tiền mặt hoặc rút về tài khoản ngân hàng.</li>
            </ul>
          </section>

          {/* Card 3: Account security */}
          <section className="terms-policy">
            <h2><AlertTriangle size={20} aria-hidden="true" /> Khuyến nghị bảo mật Garena</h2>
            <ul>
              <li>Ngay sau khi mua nick thành công, vui lòng truy cập trang chủ <code>account.garena.com</code> để kiểm tra thông tin.</li>
              <li>Đổi mật khẩu mới ngay lập tức.</li>
              <li>Cập nhật hoặc liên kết số điện thoại cá nhân và địa chỉ email bảo mật của bạn.</li>
              <li>Kích hoạt tính năng xác thực 2 lớp (Garena Authenticator) để bảo vệ nick tuyệt đối.</li>
            </ul>
          </section>

          {/* Card 4: Support */}
          <section className="terms-policy">
            <h2><Phone size={20} aria-hidden="true" /> Giải quyết tranh chấp và hỗ trợ</h2>
            <ul>
              <li>Mọi tranh chấp phát sinh liên quan đến giao dịch mua tài khoản phải được báo cáo cho ban quản trị trong vòng 24 giờ kể từ thời điểm mua hàng.</li>
              <li>Sau 24 giờ nếu khách hàng không phản hồi, giao dịch được coi là thành công tốt đẹp và shop sẽ từ chối giải quyết các khiếu nại phát sinh sau đó.</li>
              <li>Liên hệ hỗ trợ nhanh qua Zalo CSKH: <strong>{phoneDisplay}</strong> hoặc các kênh mạng xã hội đính kèm ở góc màn hình.</li>
            </ul>
          </section>

        </div>

        {/* Footer Text */}
        <p className="terms-updated"><FileText size={14} aria-hidden="true" /> Cập nhật lần cuối: 2026-06-17.</p>
      </div>
    </div>
  );
}
