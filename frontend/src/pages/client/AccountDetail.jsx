import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../../api/api";
import Modal from "../../components/Modal";
import { ChevronLeft, ShoppingCart, Copy, Check, Info, ShieldAlert, Gamepad2, ZoomIn, X } from "lucide-react";
import { updateSEO } from "../../utils/seo";

export default function AccountDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [account, setAccount] = useState(null);
  const [discountCode, setDiscountCode] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Image gallery state
  const [activeImg, setActiveImg] = useState("");
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  
  // Modal states
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [purchaseData, setPurchaseData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Clipboard copy feedback
  const [copiedField, setCopiedField] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const res = await api.get(`/accounts/${id}`);
      setAccount(res.data.data);
      if (res.data.data) {
        setActiveImg(res.data.data.img || "");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // Parse images helper
  const images = (() => {
    if (!account) return [];
    let list = [];
    if (account.img) list.push(account.img);
    try {
      const parsed = account.list_img ? JSON.parse(account.list_img) : [];
      if (Array.isArray(parsed)) {
        list = [...list, ...parsed];
      }
    } catch {
      // Ignored
    }
    // Remove duplicates
    return [...new Set(list)];
  })();

  // Parse sub-information details (e.g. rank, heroes count)
  const specs = (() => {
    if (!account) return [];
    const raw = account.list_thong_tin || account.thong_tin || "";
    const delimiter = raw.includes("|") ? "|" : raw.includes(",") ? "," : "\n";
    return raw
      .split(delimiter)
      .map(item => {
        const parts = item.split(":");
        if (parts.length >= 2) {
          return {
            label: parts[0].trim(),
            value: parts.slice(1).join(":").trim()
          };
        }
        return {
          label: "Thông tin",
          value: item.trim()
        };
      })
      .filter(item => item.value.length > 0);
  })();

  async function buyAccount() {
    setErrorMsg("");
    try {
      const res = await api.post("/orders/buy", {
        account_id: account.id,
        discount_code: discountCode || undefined,
      });

      setPurchaseData(res.data.data);
      setIsConfirmOpen(false);
      setIsSuccessOpen(true);
      
      // Update account status local
      setAccount(prev => prev ? { ...prev, status: 1 } : null);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || "Mua tài khoản thất bại. Vui lòng kiểm tra lại số dư hoặc mã giảm giá.");
    }
  }

  function handleCopy(text, fieldName) {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(""), 2000);
  }

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    if (account) {
      updateSEO({
        title: `Mã Số #${account.id} - Chi Tiết Acc Liên Quân`,
        description: `Xem chi tiết tài khoản game Liên Quân Mobile mã số #${account.id}. Giá bán: ${Number(account.gia || 0).toLocaleString()}đ. Nhận tài khoản lập tức sau khi thanh toán.`,
        keywords: `acc game #${account.id}, mua nick game #${account.id}, tai khoan lien quan #${account.id}`
      });
    }
  }, [account]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setIsZoomOpen(false);
        setZoomScale(1);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "120px 0", gap: "16px" }}>
        <div className="premium-loader-container-small">
          <div className="loader-ring-small"></div>
          <div className="loader-icon-box-small">
            <Gamepad2 className="loader-gamepad-small" size={20} />
          </div>
        </div>
        <style>{`
          .premium-loader-container-small {
            position: relative;
            width: 50px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .loader-ring-small {
            position: absolute;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            border: 2px solid transparent;
            border-top-color: var(--accent-color);
            border-bottom-color: var(--cyan-color);
            animation: loader-spin 1.2s linear infinite;
          }
          .loader-icon-box-small {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 30px;
            height: 30px;
            background: var(--bg-secondary);
            border-radius: 50%;
            border: 1px solid var(--border-color);
          }
          .loader-gamepad-small {
            color: var(--accent-color);
            animation: pulse-glow-small 1.5s ease-in-out infinite;
          }
          @keyframes pulse-glow-small {
            0%, 100% { opacity: 0.7; transform: scale(0.95); }
            50% { opacity: 1; transform: scale(1.05); }
          }
          @keyframes loader-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="page-container" style={{ textAlign: "center", padding: "80px 24px" }}>
        <h2>Không tìm thấy tài khoản game này hoặc tài khoản đã bị xóa.</h2>
        <Link to="/accounts" className="btn-primary" style={{ marginTop: "24px" }}>
          Quay lại kho acc
        </Link>
      </div>
    );
  }

  const isSold = Number(account.status) === 1;
  const currentPrice = Number(account.final_price || account.gia);

  return (
    <div className="page-container">
      {/* Back Button */}
      <div style={{ marginBottom: "24px" }}>
        <Link to="/accounts" className="btn-outline" style={{ padding: "8px 16px", fontSize: "0.9rem" }}>
          <ChevronLeft size={16} /> Quay lại kho acc
        </Link>
      </div>

      <h1 className="page-title" style={{ marginBottom: "32px" }}>TÀI KHOẢN LIÊN QUÂN MS #{account.id}</h1>

      <div className="detail-layout">
        {/* Gallery Image Grid */}
        <div className="detail-gallery">
          <div 
            className="gallery-main" 
            style={{ position: "relative", cursor: "zoom-in" }}
            onClick={() => setIsZoomOpen(true)}
          >
            <img src={activeImg || "https://placehold.co/600x350/111827/ffffff?text=Lien+Quan"} alt={`Account detail ${account.id}`} />
            <button 
              onClick={() => setIsZoomOpen(true)}
              className="small-btn"
              style={{
                position: "absolute",
                bottom: "16px",
                right: "16px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                opacity: 0.9,
                zIndex: 10
              }}
            >
              <ZoomIn size={14} /> Xem ảnh lớn
            </button>
          </div>

          {images.length > 1 && (
            <div className="gallery-thumbs">
              {images.map((img, i) => (
                <div
                  key={i}
                  className={`gallery-thumb-item ${activeImg === img ? "active" : ""}`}
                  onClick={() => setActiveImg(img)}
                >
                  <img src={img} alt={`Thumb ${i}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info detail Card */}
        <div className="detail-info-card">
          <div className="detail-badge-row">
            <span className="badge-id" style={{ position: "static", background: "var(--bg-tertiary)" }}>
              MÃ SỐ: {account.id}
            </span>
            <span className={`tag-spec`} style={{ 
              background: isSold ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)", 
              color: isSold ? "var(--accent-color)" : "var(--green-color)",
              border: `1px solid ${isSold ? "rgba(239, 68, 68, 0.3)" : "rgba(16, 185, 129, 0.3)"}`,
              padding: "4px 10px",
              borderRadius: "20px",
              fontWeight: "700"
            }}>
              {isSold ? "ĐÃ BÁN" : "ĐANG BÁN"}
            </span>
          </div>

          {/* Account Specifications */}
          <div>
            <h3 style={{ color: "var(--text-primary)", fontSize: "1.2rem", marginBottom: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>
              CHI TIẾT TÀI KHOẢN
            </h3>
            
            <table className="detail-specs-table">
              <tbody>
                <tr>
                  <td className="label-spec">Loại nick</td>
                  <td className="value-spec" style={{ color: "var(--cyan-color)" }}>
                    {account.accountType?.name || `Loại #${account.loai_id}`}
                  </td>
                </tr>
                {specs.length > 0 ? (
                  specs.map((item, i) => (
                    <tr key={i}>
                      <td className="label-spec">{item.label}</td>
                      <td className="value-spec">{item.value}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="label-spec">Mô tả</td>
                    <td className="value-spec">{account.thong_tin || "Tài khoản game đăng bán tự động"}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Price Section */}
          <div className="detail-price-section">
            <span style={{ fontWeight: "600", color: "var(--text-secondary)" }}>Giá bán:</span>
            <div style={{ textAlign: "right" }}>
              {account.is_sale ? (
                <>
                  <del style={{ display: "block", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                    {Number(account.original_price).toLocaleString()}đ
                  </del>
                  <strong style={{ fontSize: "1.75rem", color: "var(--gold-color)", fontWeight: "800" }}>
                    {Number(account.final_price).toLocaleString()}đ
                  </strong>
                </>
              ) : (
                <strong style={{ fontSize: "1.75rem", color: "var(--gold-color)", fontWeight: "800" }}>
                  {Number(account.gia).toLocaleString()}đ
                </strong>
              )}
            </div>
          </div>

          {/* Action Row */}
          {!isSold ? (
            <>
              {/* Discount/Coupon Section */}
              <div className="coupon-section form-group-premium" style={{ marginBottom: "0" }}>
                <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                  <input
                    placeholder="Nhập mã giảm giá (nếu có)"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                    style={{ flexGrow: "1" }}
                  />
                </div>
              </div>

              <button onClick={() => setIsConfirmOpen(true)} className="btn-primary" style={{ width: "100%", padding: "14px", fontSize: "1.1rem" }}>
                <ShoppingCart size={20} /> MUA NGAY
              </button>
            </>
          ) : (
            <button disabled className="btn-outline" style={{ width: "100%", padding: "14px", color: "var(--text-muted)", cursor: "not-allowed" }}>
              TÀI KHOẢN NÀY ĐÃ ĐƯỢC BÁN
            </button>
          )}
        </div>
      </div>

      {/* MODAL 1: CONFIRM PURCHASE */}
      <Modal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="Xác nhận mua tài khoản"
        footer={
          <>
            <button onClick={() => setIsConfirmOpen(false)} className="btn-outline" style={{ padding: "8px 16px" }}>
              Hủy bỏ
            </button>
            <button onClick={buyAccount} className="btn-primary" style={{ padding: "8px 16px" }}>
              Xác nhận thanh toán
            </button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", textAlign: "left" }}>
          <p style={{ color: "var(--text-secondary)" }}>
            Bạn đang thực hiện mua tài khoản Liên Quân mã số: <strong>#{account.id}</strong>.
          </p>
          <div style={{ background: "var(--bg-primary)", border: "1px solid var(--border-color)", padding: "16px", borderRadius: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span>Giá gốc:</span>
              <span>{Number(account.gia).toLocaleString()}đ</span>
            </div>
            {discountCode && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", color: "var(--cyan-color)" }}>
                <span>Mã giảm giá:</span>
                <span>{discountCode}</span>
              </div>
            )}
            <hr style={{ border: "0", borderTop: "1px solid var(--border-color)", margin: "8px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "700", color: "var(--gold-color)", fontSize: "1.1rem" }}>
              <span>Tổng thanh toán:</span>
              <span>{Number(currentPrice).toLocaleString()}đ</span>
            </div>
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", alignItems: "flex-start", gap: "6px" }}>
            <Info size={14} style={{ flexShrink: "0", marginTop: "2px" }} />
            Hệ thống sẽ trừ tiền trực tiếp vào tài khoản của bạn và hiển thị thông tin đăng nhập ngay sau khi hoàn thành.
          </p>

          {errorMsg && (
            <div className="alert-error" style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
              <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </Modal>

      {/* MODAL 2: PURCHASE SUCCESS & SHOW CREDENTIALS */}
      <Modal
        isOpen={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
        title="🎉 Mua tài khoản thành công!"
        footer={
          <>
            <button onClick={() => navigate("/my-orders")} className="btn-outline" style={{ padding: "8px 16px" }}>
              Lịch sử mua hàng
            </button>
            <button onClick={() => setIsSuccessOpen(false)} className="btn-primary" style={{ padding: "8px 16px" }}>
              Đóng lại
            </button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", textAlign: "left" }}>
          <p style={{ color: "var(--green-color)", fontWeight: "600" }}>
            Giao dịch hoàn tất! Cảm ơn bạn đã tin tưởng ủng hộ {JSON.parse(localStorage.getItem("setting") || "{}").ten_web || "Shopgameliqi"}.
          </p>
          
          <div style={{ background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.2)", padding: "16px", borderRadius: "12px" }}>
            <h4 style={{ color: "var(--text-primary)", marginBottom: "8px", fontWeight: "700" }}>Thông tin đăng nhập của bạn:</h4>
            
            <div className="login-credentials-box" style={{ marginTop: 0 }}>
              <div className="credential-item">
                <span style={{ color: "var(--text-secondary)" }}>Tài khoản:</span>
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <strong style={{ color: "var(--text-primary)" }}>{purchaseData?.login?.split("|")[0]}</strong>
                  <button 
                    onClick={() => handleCopy(purchaseData?.login?.split("|")[0], "user")} 
                    className="copy-badge"
                  >
                    {copiedField === "user" ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </span>
              </div>
              <div className="credential-item">
                <span style={{ color: "var(--text-secondary)" }}>Mật khẩu:</span>
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <strong style={{ color: "var(--text-primary)" }}>{purchaseData?.login?.split("|")[1]}</strong>
                  <button 
                    onClick={() => handleCopy(purchaseData?.login?.split("|")[1], "pass")} 
                    className="copy-badge"
                  >
                    {copiedField === "pass" ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </span>
              </div>
            </div>
          </div>

          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", alignItems: "flex-start", gap: "6px" }}>
            <Info size={14} style={{ flexShrink: "0", marginTop: "2px", color: "var(--gold-color)" }} />
            <span>
              <strong>Lưu ý quan trọng:</strong> Vui lòng đăng nhập vào tài khoản Liên Quân, kích hoạt số điện thoại bảo mật và đổi mật khẩu Garena để tránh xảy ra tranh chấp sau này.
            </span>
          </p>
        </div>
      </Modal>

      {isZoomOpen && (
        <div 
          onClick={() => { setIsZoomOpen(false); setZoomScale(1); }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.95)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            cursor: "zoom-out"
          }}
        >
          {/* Prominent Floating Close Button in Top-Right */}
          <button 
            onClick={() => { setIsZoomOpen(false); setZoomScale(1); }}
            style={{
              position: "absolute",
              top: "24px",
              right: "24px",
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              backgroundColor: "var(--accent-color)",
              border: "2px solid white",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.6)",
              zIndex: 10005,
              padding: 0,
              transition: "transform 0.2s"
            }}
            title="Đóng (ESC)"
            className="zoom-modal-close-trigger"
          >
            <X size={24} strokeWidth={2.5} />
          </button>

          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              gap: "12px",
              marginBottom: "16px",
              zIndex: 10000,
              width: "100%",
              justifyContent: "center"
            }}
          >
            <button 
              className="small-btn" 
              onClick={() => setZoomScale(prev => Math.max(prev - 0.25, 0.5))}
              style={{ padding: "8px 16px" }}
            >
              Thu nhỏ (-)
            </button>
            <button 
              className="small-btn" 
              onClick={() => setZoomScale(1)}
              style={{ padding: "8px 16px" }}
            >
              100% (Reset)
            </button>
            <button 
              className="small-btn" 
              onClick={() => setZoomScale(prev => Math.min(prev + 0.25, 4))}
              style={{ padding: "8px 16px" }}
            >
              Phóng to (+)
            </button>
            <button 
              className="danger-btn" 
              onClick={() => { setIsZoomOpen(false); setZoomScale(1); }}
              style={{ padding: "8px 16px" }}
            >
              Đóng (ESC)
            </button>
          </div>
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              flexGrow: 1,
              width: "100%",
              height: "100%",
              overflow: "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <img 
              src={activeImg} 
              alt="Zoomed view" 
              style={{
                transform: `scale(${zoomScale})`,
                transition: "transform 0.15s ease-out",
                maxHeight: "80vh",
                maxWidth: "85vw",
                objectFit: "contain",
                borderRadius: 0,
                cursor: "grab"
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
