import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/api";
import { Key, CreditCard, History, Check, AlertCircle } from "lucide-react";
import { updateSEO } from "../../utils/seo";

export default function Profile() {
  const token = localStorage.getItem("accessToken");
  const [profile, setProfile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Change password form
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: ""
  });
  const [pwStatus, setPwStatus] = useState({ type: "", msg: "" });
  const [pwLoading, setPwLoading] = useState(false);

  async function loadProfileAndTx() {
    setLoading(true);
    try {
      const [profileRes, txRes] = await Promise.all([
        api.get("/profile"),
        api.get("/transactions")
      ]);
      setProfile(profileRes.data.data.user || profileRes.data.data);
      const txData = txRes.data.data;
      const list = Array.isArray(txData) ? txData : (txData?.transactions || txData?.rows || []);
      setTransactions(list);
    } catch (err) {
      console.error("Failed to load profile data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    setPwStatus({ type: "", msg: "" });

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setPwStatus({ type: "error", msg: "Mật khẩu mới xác nhận không khớp!" });
      return;
    }

    setPwLoading(true);
    try {
      await api.post("/profile/change-password", {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      });
      setPwStatus({ type: "success", msg: "Đổi mật khẩu thành công!" });
      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmNewPassword: ""
      });
    } catch (err) {
      setPwStatus({ 
        type: "error", 
        msg: err.response?.data?.message || "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ." 
      });
    } finally {
      setPwLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      loadProfileAndTx();
    }
  }, [token]);

  useEffect(() => {
    updateSEO({
      title: "Thông Tin Cá Nhân & Lịch Sử Giao Dịch",
      description: "Xem thông tin tài khoản cá nhân, lịch sử giao dịch nạp ví và lịch sử đơn hàng acc game đã mua.",
      keywords: "thong tin ca nhan, lich su giao dich, don hang da mua, ho so"
    });
  }, []);

  if (!token) {
    return (
      <div className="page-container" style={{ textAlign: "center", padding: "80px 24px" }}>
        <div style={{ maxWidth: "500px", margin: "0 auto", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "40px" }}>
          <h2>Yêu Cầu Đăng Nhập</h2>
          <p style={{ color: "var(--text-secondary)", margin: "16px 0 24px" }}>
            Vui lòng đăng nhập để truy cập trang cá nhân của bạn.
          </p>
          <Link to="/login" className="btn-primary" style={{ padding: "10px 24px" }}>Đăng nhập ngay</Link>
        </div>
      </div>
    );
  }

  const roleText = (() => {
    if (!profile) return "";
    const level = Number(profile.level);
    if (level === 99) return "Admin Hệ Thống";
    if (level === 1) return "Cộng Tác Viên";
    return "Thành Viên";
  })();

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ marginBottom: "32px" }}>TÀI KHOẢN CÁ NHÂN</h1>

      {loading ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <div style={{ display: "inline-block", border: "4px solid rgba(255,255,255,0.1)", borderTop: "4px solid var(--accent-color)", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite", marginBottom: "16px" }}></div>
          <div style={{ color: "var(--text-secondary)" }}>Đang tải thông tin cá nhân...</div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <div className="profile-layout">
          {/* Sidebar user card */}
          <div className="profile-sidebar-card">
            <img 
              src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${profile?.username || "default"}`} 
              alt="Avatar" 
              style={{ width: "80px", height: "80px", borderRadius: "50%", background: "var(--bg-tertiary)", padding: "4px", border: "2px solid var(--border-color)", objectFit: "cover" }} 
            />
            
            <div style={{ marginTop: "8px" }}>
              <h3 style={{ color: "var(--text-primary)", fontSize: "1.25rem", fontWeight: "700" }}>{profile?.username}</h3>
              <span style={{ fontSize: "0.85rem", color: "var(--cyan-color)", fontWeight: "600" }}>{roleText}</span>
            </div>

            <div style={{ width: "100%", borderTop: "1px solid var(--border-color)", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "12px", textAlign: "left" }}>
              <div style={{ display: "flex", justifySelf: "space-between", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Tên tài khoản:</span>
                <strong style={{ color: "var(--text-primary)" }}>{profile?.username}</strong>
              </div>
              <div style={{ display: "flex", justifySelf: "space-between", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Số dư ví:</span>
                <strong style={{ color: "var(--gold-color)" }}>{Number(profile?.money || 0).toLocaleString()}đ</strong>
              </div>
              <div style={{ display: "flex", justifySelf: "space-between", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Trạng thái:</span>
                <span style={{ color: Number(profile?.banned) === 1 ? "var(--accent-color)" : "var(--green-color)", fontWeight: "600", fontSize: "0.9rem" }}>
                  {Number(profile?.banned) === 1 ? "Bị khóa" : "Hoạt động"}
                </span>
              </div>
            </div>

            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px" }}>
              <Link to="/nap-tien" className="btn-primary" style={{ width: "100%", fontSize: "0.9rem", padding: "8px" }}>
                <CreditCard size={14} /> Nạp tiền ví
              </Link>
              <Link to="/my-orders" className="btn-outline" style={{ width: "100%", fontSize: "0.9rem", padding: "8px" }}>
                <History size={14} /> Lịch sử mua nick
              </Link>
            </div>
          </div>

          {/* Main profile content */}
          <div className="profile-main-content">
            {/* Change password section */}
            <div className="profile-section-card">
              <h3><Key size={18} /> ĐỔI MẬT KHẨU TÀI KHOẢN</h3>
              
              {pwStatus.msg && (
                <div 
                  className={pwStatus.type === "success" ? "alert-error" : "alert-error"} 
                  style={{ 
                    background: pwStatus.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                    border: `1px solid ${pwStatus.type === "success" ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
                    color: pwStatus.type === "success" ? "#34d399" : "#f87171",
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  {pwStatus.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
                  <span>{pwStatus.msg}</span>
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="profile-password-form">
                <div className="form-group-premium" style={{ gridColumn: "1 / -1" }}>
                  <label>Mật khẩu hiện tại</label>
                  <input 
                    type="password" 
                    placeholder="Nhập mật khẩu hiện tại"
                    value={passwordForm.oldPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group-premium">
                  <label>Mật khẩu mới</label>
                  <input 
                    type="password" 
                    placeholder="Tối thiểu 6 ký tự"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group-premium">
                  <label>Nhập lại mật khẩu mới</label>
                  <input 
                    type="password" 
                    placeholder="Xác nhận lại mật khẩu mới"
                    value={passwordForm.confirmNewPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })}
                    required
                  />
                </div>

                <button disabled={pwLoading} className="btn-primary profile-submit-btn" style={{ padding: "10px 24px", gridColumn: "1 / -1" }}>
                  {pwLoading ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                </button>
              </form>
            </div>

            {/* Transaction history section */}
            <div className="profile-section-card">
              <h3><History size={18} /> LỊCH SỬ BIẾN ĐỘNG SỐ DƯ</h3>

              {transactions.length === 0 ? (
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>Không có lịch sử biến động số dư ví nào.</p>
              ) : (
                <div className="table-wrapper">
                  <table className="table-premium">
                    <thead>
                      <tr>
                        <th>Giao dịch</th>
                        <th>Loại</th>
                        <th>Biến động</th>
                        <th>Số dư sau</th>
                        <th>Thời gian</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => {
                        const isAdd = tx.type === "recharge" || tx.type === "admin_add" || (tx.description && tx.description.toLowerCase().includes("cộng"));
                        return (
                          <tr key={tx.id}>
                            <td style={{ fontWeight: "500", color: "var(--text-primary)" }}>#{tx.id}</td>
                            <td>{tx.description || tx.type}</td>
                            <td className={isAdd ? "amount-add" : "amount-sub"}>
                              {isAdd ? "+" : "-"}{Number(tx.amount).toLocaleString()}đ
                            </td>
                            <td>{Number(tx.balance_after).toLocaleString()}đ</td>
                            <td style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                              {new Date(tx.created_at || tx.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
