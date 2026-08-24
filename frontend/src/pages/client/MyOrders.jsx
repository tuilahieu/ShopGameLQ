import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/api";
import Modal from "../../components/Modal";
import { Key, Calendar, ShieldCheck, Copy, Check, Info } from "lucide-react";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  
  // Modal states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [copiedField, setCopiedField] = useState("");

  async function load() {
    setLoading(true);
    setLoadError("");
    try {
      const res = await api.get("/orders/my");
      setOrders(res.data.data);
    } catch (err) {
      console.error(err);
      setLoadError(err.response?.data?.message || "Không thể tải lịch sử mua hàng.");
    } finally {
      setLoading(false);
    }
  }

  async function viewOrderDetails(orderId) {
    setModalLoading(true);
    setDetailError("");
    setIsModalOpen(true);
    try {
      const res = await api.get(`/orders/${orderId}`);
      setSelectedOrder(res.data.data);
    } catch (err) {
      console.error(err);
      setDetailError(err.response?.data?.message || "Không thể tải chi tiết đơn hàng.");
    } finally {
      setModalLoading(false);
    }
  }

  function handleCopy(text, fieldName) {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(""), 2000);
  }

  useEffect(() => {
    load();
  }, []);

  if (!localStorage.getItem("accessToken")) {
    return <div className="page-container empty-state"><h1 className="page-title">Đăng nhập để xem đơn hàng</h1><p>Thông tin tài khoản đã mua chỉ hiển thị cho chủ tài khoản.</p><Link className="btn-primary" to="/login?redirect=%2Fmy-orders">Đăng nhập</Link></div>;
  }

  return (
    <div className="page-container orders-page">
      <header className="customer-page-heading">
        <span className="storefront-section-kicker"><Key size={17} aria-hidden="true" /> Tài khoản của bạn</span>
        <h1>Tài khoản đã mua</h1>
        <p>Xem lại thông tin đăng nhập và bảo mật tài khoản sau khi nhận.</p>
      </header>

      {loading ? (
        <div className="customer-loading-state" aria-live="polite">Đang tải tài khoản đã mua…</div>
      ) : loadError ? (
        <div className="empty-state"><p>{loadError}</p><button className="btn-primary" onClick={load}>Tải lại</button></div>
      ) : orders.length === 0 ? (
        <div className="empty-state customer-empty-state">
          <h2>Chưa có tài khoản đã mua</h2>
          <p>Chọn một tài khoản phù hợp để bắt đầu.</p>
          <Link to="/accounts" className="btn-primary">Chọn tài khoản</Link>
        </div>
      ) : (
        <div className="order-cards-container">
          {orders.map((o) => (
            <article className="order-card-item" key={o.id}>
              <div className="order-info-left">
                <span className="order-number">Đơn hàng #{o.id}</span>
                <h2>Acc #{o.acc_id}</h2>
                <p>
                  <Calendar size={15} aria-hidden="true" /> <time dateTime={o.created_at || o.createdAt}>{new Date(o.created_at || o.createdAt).toLocaleString()}</time>
                </p>
                {o.account?.accountType?.name && (
                  <p>
                    <ShieldCheck size={15} aria-hidden="true" /> {o.account.accountType.name}
                  </p>
                )}
              </div>

              <div className="order-info-right">
                <span className="order-price">{Number(o.final_price).toLocaleString()}đ</span>
                <button onClick={() => viewOrderDetails(o.id)} className="btn-primary">
                  <Key size={16} aria-hidden="true" /> Xem thông tin acc
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* DETAILED ORDER MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedOrder(null);
        }}
        title={`Thông tin tài khoản đơn hàng #${selectedOrder?.id || ""}`}
        footer={
          <button 
            onClick={() => {
              setIsModalOpen(false);
              setSelectedOrder(null);
            }} 
            className="btn-primary" 
          >
            Đóng
          </button>
        }
      >
        {modalLoading ? (
          <div className="customer-loading-state">Đang tải thông tin acc…</div>
        ) : detailError ? (
          <div className="alert-error" role="alert">{detailError}</div>
        ) : selectedOrder ? (
          <div className="order-detail-content">
            
            <dl className="order-detail-summary">
              <div><dt>Mã đơn hàng</dt><dd>#{selectedOrder.id}</dd></div>
              <div><dt>Mã tài khoản</dt><dd>#{selectedOrder.acc_id}</dd></div>
              <div><dt>Đã thanh toán</dt><dd>{Number(selectedOrder.final_price).toLocaleString()}đ</dd></div>
            </dl>

            <div className="order-credentials">
              <h4>Thông tin đăng nhập</h4>
              
              <div className="login-credentials-box" style={{ marginTop: 0 }}>
                <div className="credential-item">
                  <span style={{ color: "var(--text-secondary)" }}>Tài khoản:</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <strong style={{ color: "var(--text-primary)" }}>{selectedOrder.account?.login?.split("|")[0]}</strong>
                    <button 
                      type="button"
                      onClick={() => handleCopy(selectedOrder.account?.login?.split("|")[0], "user")} 
                      className="copy-badge"
                      aria-label="Sao chép tên đăng nhập tài khoản game"
                    >
                      {copiedField === "user" ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
                    </button>
                  </span>
                </div>
                <div className="credential-item">
                  <span style={{ color: "var(--text-secondary)" }}>Mật khẩu:</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <strong style={{ color: "var(--text-primary)" }}>{selectedOrder.account?.login?.split("|")[1]}</strong>
                    <button 
                      type="button"
                      onClick={() => handleCopy(selectedOrder.account?.login?.split("|")[1], "pass")} 
                      className="copy-badge"
                      aria-label="Sao chép mật khẩu tài khoản game"
                    >
                      {copiedField === "pass" ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
                    </button>
                  </span>
                </div>
              </div>
            </div>

            <p className="order-security-note">
              <Info size={15} aria-hidden="true" />
              <span>
                <strong>Khuyến nghị bảo mật:</strong> Nếu đăng nhập thành công, vui lòng truy cập trang chủ Garena để liên kết số điện thoại, email bảo mật cá nhân và đổi mật khẩu mới.
              </span>
            </p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
