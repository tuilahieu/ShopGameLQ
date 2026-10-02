import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/api";
import Modal from "../../components/Modal";
import SkeletonLoading from "../../components/SkeletonLoading";
import { Key, Calendar, ShieldCheck } from "lucide-react";
import CustomerPageHeading from "../../components/client/CustomerPageHeading";
import AccountSecurityGuide from "../../components/client/AccountSecurityGuide";
import LoginCredentials from "../../components/client/LoginCredentials";
import SafeImage from "../../components/SafeImage";
import useClipboardFeedback from "../../hooks/useClipboardFeedback";
import { formatDateTime, formatVnd } from "../../utils/formatters";
import { getApiErrorMessage } from "../../utils/apiError";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  
  // Modal states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const { copiedField, copy } = useClipboardFeedback();

  async function load() {
    setLoading(true);
    setLoadError("");
    try {
      const res = await api.get("/orders/my");
      setOrders(res.data.data);
    } catch (err) {
      console.error(err);
      setLoadError(getApiErrorMessage(err, "Không thể tải lịch sử mua hàng."));
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
      setDetailError(getApiErrorMessage(err, "Không thể tải chi tiết đơn hàng."));
    } finally {
      setModalLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (!localStorage.getItem("accessToken")) {
    return <div className="page-container empty-state"><h1 className="page-title">Đăng nhập để xem đơn hàng</h1><p>Thông tin tài khoản đã mua chỉ hiển thị cho chủ tài khoản.</p><Link className="btn-primary" to="/login?redirect=%2Fmy-orders">Đăng nhập</Link></div>;
  }

  return (
    <div className="page-container orders-page">
      <CustomerPageHeading
        eyebrow={<><Key size={17} aria-hidden="true" /> Tài khoản của bạn</>}
        title="Tài khoản đã mua"
        description="Xem lại thông tin đăng nhập và bảo mật tài khoản sau khi nhận."
      />

      {loading ? (
        <SkeletonLoading variant="orders" items={2} compact label="Đang tải tài khoản đã mua" />
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
              <div className="order-card-media">
                <SafeImage
                  src={o.account?.img}
                  alt={`Ảnh tài khoản đã mua mã số ${o.acc_id}`}
                  width={960}
                  height={540}
                  loading="lazy"
                  decoding="async"
                  fallbackLabel="Chưa có ảnh tài khoản"
                />
                <span className="order-number">Đơn hàng #{o.id}</span>
              </div>

              <div className="order-card-content">
                <div className="order-info-left">
                  <span className="order-card-eyebrow">Đã bán</span>
                  <h2>{o.account?.accountType?.name || `Acc Liên Quân #${o.acc_id}`}</h2>
                  <p>
                    <Calendar size={15} aria-hidden="true" /> <time dateTime={o.created_at || o.createdAt}>{formatDateTime(o.created_at || o.createdAt)}</time>
                  </p>
                  <p>
                    <ShieldCheck size={15} aria-hidden="true" /> Mã tài khoản #{o.acc_id}
                  </p>
                </div>

                <div className="order-info-right">
                  <span className="order-price">{formatVnd(o.final_price)}</span>
                  <button type="button" onClick={() => viewOrderDetails(o.id)} className="btn-primary">
                    <Key size={16} aria-hidden="true" /> Xem thông tin acc
                  </button>
                </div>
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
        title={`Tài khoản đơn hàng #${selectedOrder?.id || ""}`}
        className="client-transaction-dialog client-credentials-dialog"
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
          <SkeletonLoading variant="order-detail" label="Đang tải thông tin tài khoản" />
        ) : detailError ? (
          <div className="alert-error" role="alert">{detailError}</div>
        ) : selectedOrder ? (
          <div className="order-detail-content">
            
            <div className="order-credentials">
              <div className="order-credentials-header">
                <div className="order-credentials-heading">
                  <ShieldCheck size={18} aria-hidden="true" />
                  <div>
                    <span className="order-credentials-eyebrow">Thông tin quan trọng</span>
                    <h4>Tài khoản &amp; mật khẩu</h4>
                  </div>
                </div>
                <span className="order-credentials-tag">Sẵn sàng</span>
              </div>
              
              <LoginCredentials login={selectedOrder.account?.login} copiedField={copiedField} onCopy={copy} />
            </div>

            <AccountSecurityGuide />

            <dl className="order-detail-summary" aria-label="Thông tin đơn hàng">
              <div><dt>Đơn hàng</dt><dd>#{selectedOrder.id}</dd></div>
              <div><dt>Mã tài khoản</dt><dd>#{selectedOrder.acc_id}</dd></div>
              <div><dt>Thanh toán</dt><dd>{formatVnd(selectedOrder.final_price)}</dd></div>
            </dl>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
