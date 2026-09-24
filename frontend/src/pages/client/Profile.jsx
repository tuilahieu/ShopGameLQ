import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/api";
import { Key, CreditCard, History, Check, AlertCircle, ChevronDown } from "lucide-react";
import SkeletonLoading from "../../components/SkeletonLoading";
import CustomerPageHeading from "../../components/client/CustomerPageHeading";
import usePageSeo from "../../hooks/usePageSeo";
import { formatDateTime, formatVnd } from "../../utils/formatters";
import AccessState from "../../components/client/AccessState";
import { getApiErrorMessage } from "../../utils/apiError";
import FormField from "../../components/client/FormField";

export default function Profile() {
  const token = localStorage.getItem("accessToken");
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

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
    setLoadError("");
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
      setLoadError(getApiErrorMessage(err, "Không thể tải thông tin cá nhân."));
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

    if (passwordForm.newPassword.length < 10) {
      setPwStatus({ type: "error", msg: "Mật khẩu mới cần tối thiểu 10 ký tự." });
      return;
    }

    setPwLoading(true);
    try {
      await api.post("/profile/change-password", {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      });
      setPwStatus({ type: "success", msg: "Đổi mật khẩu thành công. Bạn cần đăng nhập lại để tiếp tục." });
      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmNewPassword: ""
      });
      localStorage.clear();
      sessionStorage.removeItem("adminSession");
      window.setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setPwStatus({ 
        type: "error", 
        msg: getApiErrorMessage(err, "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ.")
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

  usePageSeo({
    title: "Thông Tin Cá Nhân & Lịch Sử Giao Dịch",
    description: "Xem thông tin tài khoản cá nhân, lịch sử giao dịch nạp ví và lịch sử đơn hàng acc game đã mua.",
    keywords: "thong tin ca nhan, lich su giao dich, don hang da mua, ho so",
  });

  if (!token) {
    return (
      <AccessState pageClassName="profile-page" title="Đăng nhập để xem hồ sơ" description="Vui lòng đăng nhập để truy cập trang cá nhân của bạn.">
        <Link to="/login" className="btn-primary">Đăng nhập</Link>
      </AccessState>
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
    <div className="page-container profile-page">
      <CustomerPageHeading
        eyebrow="Hồ sơ & bảo mật"
        title="Tài khoản cá nhân"
        description="Kiểm tra số dư, lịch sử giao dịch và bảo vệ tài khoản của bạn."
      />

      {loading ? (
        <SkeletonLoading variant="profile" compact label="Đang tải thông tin cá nhân" />
      ) : loadError || !profile ? (
        <div className="empty-state"><p>{loadError || "Không tìm thấy thông tin tài khoản."}</p><button className="btn-primary" onClick={loadProfileAndTx}>Tải lại</button></div>
      ) : (
        <div className="profile-layout">
          {/* Sidebar user card */}
          <div className="profile-sidebar-card">
            <div className="profile-avatar" aria-label={`Tài khoản ${profile?.username || ""}`}>
              {(profile?.username || "?").slice(0, 1).toUpperCase()}
            </div>
            
            <div className="profile-identity">
              <h2>{profile?.username}</h2>
              <span>{roleText}</span>
            </div>

            <dl className="profile-summary">
              <div><dt>Tên tài khoản</dt><dd>{profile?.username}</dd></div>
              <div><dt>Số dư ví</dt><dd className="profile-balance">{formatVnd(profile?.money || 0)}</dd></div>
              <div><dt>Trạng thái</dt><dd className={Number(profile?.banned) === 1 ? "is-banned" : "is-active"}>{Number(profile?.banned) === 1 ? "Bị khóa" : "Hoạt động"}</dd></div>
            </dl>

            <div className="profile-quick-actions">
              <Link to="/nap-tien" className="btn-primary">
                <CreditCard size={14} /> Nạp tiền ví
              </Link>
              <Link to="/my-orders" className="btn-outline">
                <History size={14} /> Lịch sử mua nick
              </Link>
            </div>
          </div>

          {/* Main profile content */}
          <div className="profile-main-content">
            {/* Change password section */}
            <details className="profile-section-card profile-password-disclosure">
              <summary className="profile-password-summary">
                <span className="profile-password-summary-main">
                  <Key size={20} aria-hidden="true" />
                  <span>
                    <strong>Đổi mật khẩu</strong>
                    <small>Chỉ mở khi bạn cần cập nhật mật khẩu</small>
                  </span>
                </span>
                <span className="profile-password-summary-action" aria-hidden="true">
                  <span className="profile-password-closed-label">Mở</span>
                  <span className="profile-password-open-label">Thu gọn</span>
                  <ChevronDown size={18} />
                </span>
              </summary>

              <div className="profile-password-content">
                {pwStatus.msg && (
                  <div className={`profile-form-status ${pwStatus.type}`} role={pwStatus.type === "error" ? "alert" : "status"}>
                    {pwStatus.type === "success" ? <Check size={16} aria-hidden="true" /> : <AlertCircle size={16} aria-hidden="true" />}
                    <span>{pwStatus.msg}</span>
                  </div>
                )}

                <form onSubmit={handlePasswordChange} className="profile-password-form">
                  <FormField id="current-password" label="Mật khẩu hiện tại" className="profile-current-password">
                    <input
                      id="current-password"
                      name="currentPassword"
                      type="password"
                      autoComplete="current-password"
                      placeholder="Nhập mật khẩu hiện tại"
                      value={passwordForm.oldPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                      required
                    />
                  </FormField>

                  <FormField id="new-password" label="Mật khẩu mới">
                    <input
                      id="new-password"
                      name="newPassword"
                      type="password"
                      autoComplete="new-password"
                      minLength={4}
                      maxLength={16}
                      placeholder="4 - 16 ký tự"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      required
                    />
                  </FormField>

                  <FormField id="confirm-new-password" label="Nhập lại mật khẩu mới">
                    <input
                      id="confirm-new-password"
                      name="confirmNewPassword"
                      type="password"
                      autoComplete="new-password"
                      minLength={4}
                      maxLength={16}
                      placeholder="Xác nhận lại mật khẩu mới"
                      value={passwordForm.confirmNewPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })}
                      required
                    />
                  </FormField>

                  <button disabled={pwLoading} aria-busy={pwLoading} className="btn-primary profile-submit-btn">
                    {pwLoading ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                  </button>
                </form>
              </div>
            </details>

            {/* Transaction history section */}
            <div className="profile-section-card">
              <h2><History size={19} aria-hidden="true" /> Biến động số dư</h2>

              {transactions.length === 0 ? (
                <p className="profile-empty-copy">Chưa có giao dịch ví nào.</p>
              ) : (
                <>
                <div className="transaction-mobile-list">
                  {transactions.map((tx) => {
                    const amount = Number(tx.amount || 0);
                    const isAdd = amount > 0;
                    return (
                      <article className="transaction-mobile-card" key={tx.id}>
                        <div>
                          <strong>{tx.description || tx.type}</strong>
                          <span>#{tx.id} · {formatDateTime(tx.created_at || tx.createdAt)}</span>
                        </div>
                        <div>
                          <strong className={isAdd ? "amount-add" : "amount-sub"}>{isAdd ? "+" : "-"}{formatVnd(Math.abs(amount))}</strong>
                          <span>Sau GD: {formatVnd(tx.balance_after)}</span>
                        </div>
                      </article>
                    );
                  })}
                </div>
                <div className="table-wrapper transaction-desktop-table">
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
                        const amount = Number(tx.amount || 0);
                        const isAdd = amount > 0;
                        return (
                          <tr key={tx.id}>
                            <td style={{ fontWeight: "500", color: "var(--text-primary)" }}>#{tx.id}</td>
                            <td>{tx.description || tx.type}</td>
                            <td className={isAdd ? "amount-add" : "amount-sub"}>
                              {isAdd ? "+" : "-"}{formatVnd(Math.abs(amount))}
                            </td>
                            <td>{formatVnd(tx.balance_after)}</td>
                            <td style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                              {formatDateTime(tx.created_at || tx.createdAt)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
