import { useEffect, useState } from "react";
import api from "../../api/api";
import Modal from "../../components/Modal";
import { Key, Calendar, ShieldCheck, Copy, Check, Info } from "lucide-react";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [copiedField, setCopiedField] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/orders/my");
      setOrders(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function viewOrderDetails(orderId) {
    setModalLoading(true);
    setIsModalOpen(true);
    try {
      const res = await api.get(`/orders/${orderId}`);
      setSelectedOrder(res.data.data);
    } catch (err) {
      console.error(err);
      alert("Không thể tải chi tiết đơn hàng");
      setIsModalOpen(false);
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

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ marginBottom: "32px" }}>TÀI KHOẢN ĐÃ MUA</h1>

      {loading ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <div style={{ display: "inline-block", border: "4px solid rgba(255,255,255,0.1)", borderTop: "4px solid var(--accent-color)", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite", marginBottom: "16px" }}></div>
          <div style={{ color: "var(--text-secondary)" }}>Đang tải lịch sử mua nick...</div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 24px", background: "var(--bg-secondary)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem" }}>Bạn chưa mua tài khoản nào trên hệ thống.</p>
        </div>
      ) : (
        <div className="order-cards-container">
          {orders.map((o) => (
            <div className="order-card-item" key={o.id}>
              <div className="order-info-left">
                <h4>Đơn hàng #{o.id} - Acc #{o.acc_id}</h4>
                <p style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Calendar size={14} /> Mua ngày: {new Date(o.created_at || o.createdAt).toLocaleString()}
                </p>
                {o.account?.accountType?.name && (
                  <p style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--cyan-color)" }}>
                    <ShieldCheck size={14} /> Danh mục: {o.account.accountType.name}
                  </p>
                )}
              </div>

              <div className="order-info-right">
                <span className="order-price">{Number(o.final_price).toLocaleString()}đ</span>
                <button onClick={() => viewOrderDetails(o.id)} className="btn-gold" style={{ padding: "8px 16px" }}>
                  <Key size={14} /> Xem tài khoản
                </button>
              </div>
            </div>
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
            style={{ padding: "8px 16px" }}
          >
            Đóng lại
          </button>
        }
      >
        {modalLoading ? (
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <div style={{ display: "inline-block", border: "3px solid rgba(255,255,255,0.1)", borderTop: "3px solid var(--accent-color)", borderRadius: "50%", width: "30px", height: "30px", animation: "spin 1s linear infinite" }}></div>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        ) : selectedOrder ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", textAlign: "left" }}>
            
            <div style={{ background: "var(--bg-primary)", border: "1px solid var(--border-color)", padding: "14px", borderRadius: "8px", fontSize: "0.9rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "var(--text-secondary)" }}>Mã đơn hàng:</span>
                <span style={{ color: "var(--text-primary)", fontWeight: "600" }}>#{selectedOrder.id}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "var(--text-secondary)" }}>Mã số tài khoản:</span>
                <span style={{ color: "var(--text-primary)", fontWeight: "600" }}>#{selectedOrder.acc_id}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "var(--text-secondary)" }}>Thanh toán:</span>
                <span style={{ color: "var(--gold-color)", fontWeight: "700" }}>{Number(selectedOrder.final_price).toLocaleString()}đ</span>
              </div>
            </div>

            <div style={{ background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.2)", padding: "16px", borderRadius: "10px" }}>
              <h4 style={{ color: "var(--text-primary)", marginBottom: "8px", fontWeight: "700" }}>Thông tin tài khoản & mật khẩu:</h4>
              
              <div className="login-credentials-box" style={{ marginTop: 0 }}>
                <div className="credential-item">
                  <span style={{ color: "var(--text-secondary)" }}>Tài khoản:</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <strong style={{ color: "var(--text-primary)" }}>{selectedOrder.account?.login?.split("|")[0]}</strong>
                    <button 
                      onClick={() => handleCopy(selectedOrder.account?.login?.split("|")[0], "user")} 
                      className="copy-badge"
                    >
                      {copiedField === "user" ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </span>
                </div>
                <div className="credential-item">
                  <span style={{ color: "var(--text-secondary)" }}>Mật khẩu:</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <strong style={{ color: "var(--text-primary)" }}>{selectedOrder.account?.login?.split("|")[1]}</strong>
                    <button 
                      onClick={() => handleCopy(selectedOrder.account?.login?.split("|")[1], "pass")} 
                      className="copy-badge"
                    >
                      {copiedField === "pass" ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </span>
                </div>
              </div>
            </div>

            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", alignItems: "flex-start", gap: "6px" }}>
              <Info size={14} style={{ flexShrink: "0", marginTop: "2px", color: "var(--gold-color)" }} />
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
