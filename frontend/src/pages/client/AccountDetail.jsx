import { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../../api/api";
import Modal from "../../components/Modal";
import SafeImage from "../../components/SafeImage";
import { ChevronLeft, ShoppingCart, Copy, Check, Info, ShieldAlert, Gamepad2, ZoomIn } from "lucide-react";
import { updateSEO } from "../../utils/seo";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import { getAccountPricing } from "../../utils/accountPricing";

function getAccountImages(account) {
  if (!account) return [];

  const candidates = [account.img];
  const rawGallery = account.list_img;

  if (Array.isArray(rawGallery)) {
    candidates.push(...rawGallery);
  } else if (typeof rawGallery === "string" && rawGallery.trim() && rawGallery.trim() !== "0") {
    try {
      const parsed = JSON.parse(rawGallery);
      if (Array.isArray(parsed)) candidates.push(...parsed);
      else if (typeof parsed === "string") candidates.push(parsed);
    } catch {
      candidates.push(...rawGallery.split(/\r?\n|\s*\|\s*/));
    }
  }

  return [...new Set(candidates.map(resolveMediaUrl).filter(Boolean))];
}

function getAccountHighlights(account) {
  const raw = String(account?.thong_tin || "").trim();
  if (!raw || raw === "0") return [];

  return [...new Set(raw
    .split(/\r?\n|\s*\|\s*/)
    .map((item) => item.trim())
    .filter(Boolean))];
}

export default function AccountDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [account, setAccount] = useState(null);
  const [discountCode, setDiscountCode] = useState("");
  const [discountPreview, setDiscountPreview] = useState(null);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  
  // Image gallery state
  const [activeImg, setActiveImg] = useState("");
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [imagePan, setImagePan] = useState({ x: 0, y: 0 });
  const [isImagePanning, setIsImagePanning] = useState(false);
  const imagePanStartRef = useRef(null);
  
  // Modal states
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [purchaseData, setPurchaseData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isBuying, setIsBuying] = useState(false);
  const [userBalance, setUserBalance] = useState(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
      return storedUser?.money == null ? null : Number(storedUser.money);
    } catch {
      return null;
    }
  });
  const purchaseKeyRef = useRef(null);

  // Clipboard copy feedback
  const [copiedField, setCopiedField] = useState("");

  async function loadData() {
    setLoading(true);
    setLoadError("");
    try {
      const res = await api.get(`/accounts/${id}`);
      const nextAccount = res.data.data;
      setAccount(nextAccount);
      setActiveImg(getAccountImages(nextAccount)[0] || "");
    } catch (error) {
      console.error(error);
      setLoadError(error.response?.data?.message || "Không thể tải thông tin tài khoản. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  // Parse images helper
  const images = getAccountImages(account);

  // Parse sub-information details (e.g. rank, heroes count)
  const specs = (() => {
    if (!account) return [];
    const raw = String(account.list_thong_tin || "").trim();
    if (!raw || raw === "0") return [];
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
  const highlights = getAccountHighlights(account);

  async function buyAccount() {
    if (isBuying) return;
    setErrorMsg("");
    setIsBuying(true);
    try {
      purchaseKeyRef.current ||= crypto.randomUUID();
      const res = await api.post("/orders/buy", {
        account_id: account.id,
        discount_code: discountCode || undefined,
      }, {
        headers: { "Idempotency-Key": purchaseKeyRef.current },
      });

      setPurchaseData(res.data.data);
      purchaseKeyRef.current = null;
      setIsConfirmOpen(false);
      setIsSuccessOpen(true);
      
      // Update account status local
      setAccount(prev => prev ? { ...prev, status: 1 } : null);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || "Mua tài khoản thất bại. Vui lòng kiểm tra lại số dư hoặc mã giảm giá.");
    } finally {
      setIsBuying(false);
    }
  }

  async function applyDiscount() {
    const code = discountCode.trim();
    if (!code) return;
    setDiscountLoading(true);
    setDiscountError("");
    try {
      const res = await api.post("/discount/check", { code, account_id: account.id });
      setDiscountPreview(res.data.data);
    } catch (error) {
      setDiscountPreview(null);
      setDiscountError(error.response?.data?.message || "Mã giảm giá không hợp lệ.");
    } finally {
      setDiscountLoading(false);
    }
  }

  function openPurchase() {
    if (!localStorage.getItem("accessToken")) {
      navigate(`/login?redirect=${encodeURIComponent(`/account/${id}`)}`);
      return;
    }
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
      setUserBalance(storedUser?.money == null ? null : Number(storedUser.money));
    } catch {
      setUserBalance(null);
    }
    setErrorMsg("");
    setIsConfirmOpen(true);
  }

  function handleCopy(text, fieldName) {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(""), 2000);
  }

  function resetImageViewer() {
    imagePanStartRef.current = null;
    setIsImagePanning(false);
    setZoomScale(1);
    setImagePan({ x: 0, y: 0 });
  }

  function closeImageViewer() {
    setIsZoomOpen(false);
    resetImageViewer();
  }

  function openImageViewer() {
    if (!activeImg) return;
    resetImageViewer();
    setIsZoomOpen(true);
  }

  function setImageZoom(nextScale) {
    const constrainedScale = Math.min(4, Math.max(1, nextScale));
    setZoomScale(constrainedScale);
    if (constrainedScale === 1) {
      setImagePan({ x: 0, y: 0 });
    }
  }

  function clampImagePan(nextPan, stage) {
    const rect = stage.getBoundingClientRect();
    const maxX = Math.max(0, ((zoomScale - 1) * rect.width) / 2);
    const maxY = Math.max(0, ((zoomScale - 1) * rect.height) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, nextPan.x)),
      y: Math.max(-maxY, Math.min(maxY, nextPan.y)),
    };
  }

  function handleImagePointerDown(event) {
    if (zoomScale <= 1 || event.pointerType === "mouse" && event.button !== 0) return;
    const stage = event.currentTarget;
    stage.setPointerCapture?.(event.pointerId);
    imagePanStartRef.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      panX: imagePan.x,
      panY: imagePan.y,
    };
    setIsImagePanning(true);
  }

  function handleImagePointerMove(event) {
    const start = imagePanStartRef.current;
    if (!start || start.pointerId !== event.pointerId) return;
    event.preventDefault();
    setImagePan(clampImagePan({
      x: start.panX + event.clientX - start.clientX,
      y: start.panY + event.clientY - start.clientY,
    }, event.currentTarget));
  }

  function handleImagePointerEnd(event) {
    if (imagePanStartRef.current?.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    imagePanStartRef.current = null;
    setIsImagePanning(false);
  }

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    if (account) {
      const { currentPrice: seoPrice } = getAccountPricing(account);
      updateSEO({
        title: `Mã Số #${account.id} - Chi Tiết Acc Liên Quân`,
        description: `Xem chi tiết tài khoản game Liên Quân Mobile mã số #${account.id}. Giá bán: ${seoPrice.toLocaleString()}đ. Nhận tài khoản lập tức sau khi thanh toán.`,
        keywords: `acc game #${account.id}, mua nick game #${account.id}, tai khoan lien quan #${account.id}`
      });
    }
  }, [account]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        imagePanStartRef.current = null;
        setIsZoomOpen(false);
        setIsImagePanning(false);
        setZoomScale(1);
        setImagePan({ x: 0, y: 0 });
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

  if (loadError || !account) {
    return (
      <div className="page-container empty-state">
        <h1 className="page-title">Không thể mở tài khoản</h1>
        <p>{loadError || "Tài khoản này không còn tồn tại hoặc đã được bán."}</p>
        <div className="empty-state-actions">
          <button onClick={loadData} className="btn-primary">Thử lại</button>
          <Link to="/accounts" className="btn-outline">Về kho tài khoản</Link>
        </div>
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
  const {
    hasSale,
    originalPrice,
    currentPrice,
    savingAmount,
    discountLabel: saleDiscountLabel,
  } = getAccountPricing(account);
  const hasVoucher = Boolean(discountPreview);
  const voucherAmount = Number(discountPreview?.discount_amount || 0);
  const finalPurchasePrice = Number(discountPreview?.final_price ?? currentPrice);
  const hasInsufficientBalance = userBalance !== null && userBalance < finalPurchasePrice;

  return (
    <div className="page-container account-detail-page">
      <Link to="/accounts" className="catalogue-back-link account-detail-back">
        <ChevronLeft size={17} aria-hidden="true" /> Quay lại kho acc
      </Link>

      <div className="detail-layout">
        <section className="detail-gallery" aria-label={`Thư viện ảnh tài khoản ${account.id}`}>
          <button
            type="button"
            className="gallery-main"
            onClick={openImageViewer}
            disabled={!activeImg}
            aria-label={activeImg ? `Mở ảnh lớn tài khoản ${account.id}` : "Tài khoản chưa có ảnh"}
          >
            <SafeImage
              src={activeImg}
              alt={`Ảnh chi tiết tài khoản Liên Quân mã số ${account.id}`}
              width={800}
              height={560}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              fallbackLabel="Tài khoản này chưa có ảnh"
            />
            {activeImg && <span className="gallery-zoom-label"><ZoomIn size={16} aria-hidden="true" /> Xem ảnh lớn</span>}
          </button>

          {images.length > 1 && (
            <div className="gallery-thumbs" aria-label="Chọn ảnh chi tiết">
              {images.map((img, i) => (
                <button
                  type="button"
                  key={i}
                  className={`gallery-thumb-item ${activeImg === img ? "active" : ""}`}
                  onClick={() => setActiveImg(img)}
                  aria-label={`Xem ảnh ${i + 1} của tài khoản ${account.id}`}
                  aria-pressed={activeImg === img}
                >
                  <SafeImage
                    src={img}
                    alt={`Ảnh thu nhỏ ${i + 1} của tài khoản ${account.id}`}
                    width={120}
                    height={84}
                    loading="lazy"
                    decoding="async"
                    fallbackLabel="Ảnh lỗi"
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="detail-info-card" aria-labelledby="account-detail-title">
          <div className="detail-badge-row">
            <span className="detail-account-id">Mã acc #{account.id}</span>
            <span className={`detail-availability ${isSold ? "unavailable" : "available"}`}>
              {isSold ? "Hết tài khoản" : "Có thể mua ngay"}
            </span>
          </div>
          <h1 id="account-detail-title">{account.accountType?.name || "Tài khoản game"} #{account.id}</h1>

          <div className="detail-price-section">
            <div className="detail-price-heading">
              <span>{hasSale ? "Giá sale" : "Giá bán"}</span>
              {hasSale && <span className="detail-sale-badge">GIẢM {saleDiscountLabel}</span>}
            </div>
            <div className="detail-price-values">
              {(hasVoucher || hasSale) && (
                <del>{(hasVoucher ? currentPrice : originalPrice).toLocaleString()}đ</del>
              )}
              <strong>{finalPurchasePrice.toLocaleString()}đ</strong>
            </div>
          </div>

          {highlights.length > 0 && (
            <div className="detail-highlights" aria-label="Điểm nổi bật tài khoản">
              {highlights.map((highlight) => <span key={highlight}>{highlight}</span>)}
            </div>
          )}

          {(specs.length > 0 || highlights.length === 0) && (
            <section className="detail-specs" aria-labelledby="account-specs-title">
              <h2 id="account-specs-title">Thông tin chính</h2>
              <dl className="detail-spec-list">
                <div>
                  <dt>Loại nick</dt>
                  <dd>{account.accountType?.name || `Loại #${account.loai_id}`}</dd>
                </div>
                {specs.length > 0 ? specs.map((item, i) => (
                  <div key={i}>
                    <dt>{item.label}</dt>
                    <dd>{item.value}</dd>
                  </div>
                )) : (
                  <div>
                    <dt>Mô tả</dt>
                    <dd>Tài khoản game đăng bán tự động</dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          {!isSold ? (
            <>
              <div className="coupon-section form-group-premium">
                <label htmlFor="discount-code">Mã giảm giá</label>
                <div className="coupon-input-row">
                  <input
                    id="discount-code"
                    name="discountCode"
                    autoComplete="off"
                    placeholder="Nhập mã giảm giá (nếu có)"
                    value={discountCode}
                    onChange={(e) => {
                      setDiscountCode(e.target.value.toUpperCase());
                      setDiscountPreview(null);
                      setDiscountError("");
                    }}
                  />
                  {hasVoucher ? (
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountCode("");
                        setDiscountPreview(null);
                        setDiscountError("");
                      }}
                      className="btn-outline coupon-remove-btn"
                    >
                      Hủy mã
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={applyDiscount}
                      disabled={!discountCode.trim() || discountLoading}
                      className="btn-outline"
                    >
                      {discountLoading ? "Đang kiểm tra" : "Áp dụng"}
                    </button>
                  )}
                </div>
                {hasVoucher && (
                  <p className="form-hint success">
                    ✓ Đã áp dụng: giảm {voucherAmount.toLocaleString()}đ
                  </p>
                )}
                {discountError && <p className="form-hint error">{discountError}</p>}
              </div>

              <button onClick={openPurchase} className="btn-primary detail-purchase-main">
                <ShoppingCart size={20} /> MUA NGAY
              </button>
            </>
          ) : (
            <button disabled className="btn-outline detail-sold-button">
              TÀI KHOẢN NÀY ĐÃ BÁN
            </button>
          )}
        </section>
      </div>

      {!isSold && (
        <div className="mobile-purchase-bar" aria-label="Mua tài khoản">
          <div className="mobile-purchase-price">
            <span className="mobile-purchase-label">
              {hasVoucher ? "Giá sau voucher" : (hasSale ? "Giá sale" : "Giá")}
              {hasVoucher ? (
                <b className="mobile-voucher-tag">-{voucherAmount.toLocaleString()}đ</b>
              ) : hasSale ? (
                <b>GIẢM {saleDiscountLabel}</b>
              ) : null}
            </span>
            <span className="mobile-purchase-values">
              {hasVoucher ? (
                <>
                  <del>{currentPrice.toLocaleString()}đ</del>
                  <strong>{finalPurchasePrice.toLocaleString()}đ</strong>
                </>
              ) : hasSale ? (
                <>
                  <del>{originalPrice.toLocaleString()}đ</del>
                  <strong>{currentPrice.toLocaleString()}đ</strong>
                </>
              ) : (
                <strong>{currentPrice.toLocaleString()}đ</strong>
              )}
            </span>
          </div>
          <button type="button" className="btn-primary" onClick={openPurchase}>
            MUA NGAY
          </button>
        </div>
      )}

      {/* MODAL 1: CONFIRM PURCHASE */}
      <Modal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="Xác nhận mua tài khoản"
        footer={
          <>
            <button onClick={() => setIsConfirmOpen(false)} className="btn-outline">
              Quay lại
            </button>
            {hasInsufficientBalance ? (
              <Link to="/nap-tien" className="btn-primary">Nạp thêm tiền</Link>
            ) : (
              <button disabled={isBuying} aria-busy={isBuying} onClick={buyAccount} className="btn-primary">
                {isBuying ? "Đang xử lý..." : "Xác nhận mua"}
              </button>
            )}
          </>
        }
      >
        <div className="purchase-confirmation">
          <p>
            Kiểm tra lại thông tin trước khi mua. Hệ thống chỉ trừ tiền khi giao dịch thành công.
          </p>
          <dl className="purchase-confirm-summary">
            <div>
              <dt>Tài khoản</dt>
              <dd>{account.accountType?.name || "Tài khoản game"} #{account.id}</dd>
            </div>
            {hasSale && (
              <div>
                <dt>Giá gốc</dt>
                <dd><del>{originalPrice.toLocaleString()}đ</del></dd>
              </div>
            )}
            {hasSale && (
              <div className="sale-row">
                <dt>Giảm giá sale ({saleDiscountLabel})</dt>
                <dd>-{savingAmount.toLocaleString()}đ</dd>
              </div>
            )}
            <div>
              <dt>{hasSale ? "Giá sau sale" : "Giá sản phẩm"}</dt>
              <dd>{currentPrice.toLocaleString()}đ</dd>
            </div>
            {discountPreview && (
              <div className="discount-row">
                <dt>Voucher {discountCode && `(${discountCode})`}</dt>
                <dd>-{Number(discountPreview.discount_amount || 0).toLocaleString()}đ</dd>
              </div>
            )}
            <div>
              <dt>Số dư hiện tại</dt>
              <dd>{userBalance === null ? "Chưa đồng bộ" : `${userBalance.toLocaleString()}đ`}</dd>
            </div>
            <div className="total-row">
              <dt>Thanh toán</dt>
              <dd>{finalPurchasePrice.toLocaleString()}đ</dd>
            </div>
          </dl>
          {!discountPreview && discountCode && <p className="form-hint">Mã giảm giá sẽ được kiểm tra khi thanh toán. Chọn “Áp dụng” để xem số tiền dự kiến.</p>}
          {hasInsufficientBalance && (
            <div className="purchase-balance-warning" role="status">
              <ShieldAlert size={18} aria-hidden="true" />
              <span><strong>Số dư chưa đủ.</strong> Bạn cần nạp thêm {(finalPurchasePrice - userBalance).toLocaleString()}đ để mua tài khoản này.</span>
            </div>
          )}
          <p className="purchase-confirm-note">
            <Info size={15} aria-hidden="true" />
            Hệ thống sẽ trừ tiền trực tiếp vào tài khoản của bạn và hiển thị thông tin đăng nhập ngay sau khi hoàn thành.
          </p>

          {errorMsg && (
            <div className="alert-error purchase-error" role="alert">
              <ShieldAlert size={16} aria-hidden="true" />
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
                    type="button"
                    onClick={() => handleCopy(purchaseData?.login?.split("|")[0], "user")} 
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
                  <strong style={{ color: "var(--text-primary)" }}>{purchaseData?.login?.split("|")[1]}</strong>
                  <button 
                    type="button"
                    onClick={() => handleCopy(purchaseData?.login?.split("|")[1], "pass")} 
                    className="copy-badge"
                    aria-label="Sao chép mật khẩu tài khoản game"
                  >
                    {copiedField === "pass" ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
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

      <Modal
        isOpen={isZoomOpen}
        onClose={closeImageViewer}
        title={`Ảnh tài khoản #${account.id}`}
        className="image-viewer-dialog"
        footer={
          <>
            <div className="zoom-controls" aria-label="Điều khiển ảnh">
              <button type="button" className="btn-outline" onClick={() => setImageZoom(zoomScale - 0.25)} disabled={zoomScale <= 1} aria-label="Thu nhỏ ảnh">
                Thu nhỏ
              </button>
              <button type="button" className="btn-outline" onClick={resetImageViewer} aria-label="Đặt lại kích thước và vị trí ảnh">
                {Math.round(zoomScale * 100)}%
              </button>
              <button type="button" className="btn-outline" onClick={() => setImageZoom(zoomScale + 0.25)} disabled={zoomScale >= 4} aria-label="Phóng to ảnh">
                Phóng to
              </button>
            </div>
            {!isSold && (
              <button type="button" className="btn-primary zoom-purchase-action" onClick={() => { closeImageViewer(); openPurchase(); }}>
                <ShoppingCart size={18} aria-hidden="true" /> MUA NGAY · {currentPrice.toLocaleString()}đ
              </button>
            )}
          </>
        }
      >
        <div
          className={`zoom-image-stage ${zoomScale > 1 ? "is-zoomed" : ""} ${isImagePanning ? "is-panning" : ""}`}
          onPointerDown={handleImagePointerDown}
          onPointerMove={handleImagePointerMove}
          onPointerUp={handleImagePointerEnd}
          onPointerCancel={handleImagePointerEnd}
          onDoubleClick={() => setImageZoom(zoomScale > 1 ? 1 : 2)}
          aria-label={zoomScale > 1 ? "Kéo ảnh để xem các vị trí khác" : "Nhấn đúp hoặc dùng nút phóng to để xem ảnh lớn"}
        >
          <SafeImage
            src={activeImg}
            alt={`Ảnh phóng to của tài khoản ${account.id}`}
            width={1200}
            height={800}
            draggable={false}
            style={{ transform: `translate3d(${imagePan.x}px, ${imagePan.y}px, 0) scale(${zoomScale})` }}
            fallbackLabel="Không thể hiển thị ảnh lớn"
          />
        </div>
      </Modal>
    </div>
  );
}
