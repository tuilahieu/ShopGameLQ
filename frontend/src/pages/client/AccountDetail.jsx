import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../../api/api";
import Modal from "../../components/Modal";
import SafeImage from "../../components/SafeImage";
import SkeletonLoading from "../../components/SkeletonLoading";
import { CheckCircle2, ChevronLeft, ShoppingCart, Info, ShieldAlert, ZoomIn, Sparkles, ShieldCheck, History } from "lucide-react";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import { getAccountPricing } from "../../utils/accountPricing";
import LoginCredentials from "../../components/client/LoginCredentials";
import useClipboardFeedback from "../../hooks/useClipboardFeedback";
import { readStoredJson } from "../../utils/storage";
import usePageSeo from "../../hooks/usePageSeo";
import { formatVnd } from "../../utils/formatters";
import { getApiErrorMessage } from "../../utils/apiError";
import useLatestRequest from "../../hooks/useLatestRequest";
import { createIdempotencyKey } from "../../utils/idempotencyKey";

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
  const [supportPhone, setSupportPhone] = useState(() => readStoredJson("setting", {}).sdt_admin || "");
  
  // Image gallery state
  const [activeImg, setActiveImg] = useState("");
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  
  // Modal states
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [purchaseData, setPurchaseData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isBuying, setIsBuying] = useState(false);
  const [userBalance, setUserBalance] = useState(() => {
    const storedUser = readStoredJson("user", null);
    return storedUser?.money == null ? null : Number(storedUser.money);
  });
  const purchaseKeyRef = useRef(null);
  const { beginRequest, isLatestRequest } = useLatestRequest();

  // Clipboard copy feedback
  const { copiedField, copy } = useClipboardFeedback();

  const loadData = useCallback(async () => {
    const sequence = beginRequest();
    setLoading(true);
    setLoadError("");
    try {
      const res = await api.get(`/accounts/${id}`);
      if (!isLatestRequest(sequence)) return;
      const nextAccount = res.data.data;
      setAccount(nextAccount);
      setActiveImg(getAccountImages(nextAccount)[0] || "");
    } catch (error) {
      if (isLatestRequest(sequence)) setLoadError(getApiErrorMessage(error, "Không thể tải thông tin tài khoản. Vui lòng thử lại."));
    } finally {
      if (isLatestRequest(sequence)) setLoading(false);
    }
  }, [beginRequest, id, isLatestRequest]);

  useEffect(() => {
    let active = true;
    api.get("/settings").then((res) => {
      if (active) setSupportPhone(res.data?.data?.sdt_admin || "");
    }).catch(() => {});
    return () => { active = false; };
  }, []);

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
    await new Promise((resolve) => setTimeout(resolve, 140));
    setIsBuying(true);
    try {
      if (!purchaseKeyRef.current) purchaseKeyRef.current = createIdempotencyKey();
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
      setErrorMsg(getApiErrorMessage(error, "Mua tài khoản thất bại. Vui lòng kiểm tra lại số dư hoặc mã giảm giá."));
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
      setDiscountError(getApiErrorMessage(error, "Mã giảm giá không hợp lệ."));
    } finally {
      setDiscountLoading(false);
    }
  }

  function openPurchase() {
    if (!localStorage.getItem("accessToken")) {
      navigate(`/login?redirect=${encodeURIComponent(`/account/${id}`)}`);
      return;
    }
    const storedUser = readStoredJson("user", null);
    setUserBalance(storedUser?.money == null ? null : Number(storedUser.money));
    setErrorMsg("");
    setIsConfirmOpen(true);
  }

  function closeImageViewer() {
    setIsZoomOpen(false);
  }

  function openImageViewer() {
    if (!activeImg) return;
    setIsZoomOpen(true);
  }

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const hasPurchaseBar = Boolean(account && Number(account.status) !== 1);
    document.body.classList.toggle("has-mobile-purchase-bar", hasPurchaseBar);
    return () => document.body.classList.remove("has-mobile-purchase-bar");
  }, [account]);

  const seoPrice = account ? getAccountPricing(account).currentPrice : 0;
  usePageSeo(account ? {
    title: `Mã Số #${account.id} - Chi Tiết Acc Liên Quân`,
    description: `Xem chi tiết tài khoản game Liên Quân Mobile mã số #${account.id}. Giá bán: ${formatVnd(seoPrice)}. Nhận tài khoản lập tức sau khi thanh toán.`,
    keywords: `acc game #${account.id}, mua nick game #${account.id}, tai khoan lien quan #${account.id}`,
  } : null);

  if (loading) {
    return <SkeletonLoading variant="detail" label="Đang tải chi tiết tài khoản" />;
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
  const zaloPhone = supportPhone.trim();
  const zaloDigits = zaloPhone.replace(/\D/g, "");
  const zaloLink = zaloDigits ? `https://zalo.me/${zaloDigits}` : null;

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
          <div className="detail-heading">
            <span>Chi tiết tài khoản</span>
            <h1 id="account-detail-title">{account.accountType?.name || "Tài khoản game"} #{account.id}</h1>
          </div>

          <div className="detail-price-section">
            <div className="detail-price-heading">
              <span>{hasSale ? "Giá sale" : "Giá bán"}</span>
              {hasSale && <span className="detail-sale-badge">GIẢM {saleDiscountLabel}</span>}
            </div>
            <div className="detail-price-values">
              {(hasVoucher || hasSale) && (
                <del>{formatVnd(hasVoucher ? currentPrice : originalPrice)}</del>
              )}
              <strong>{formatVnd(finalPurchasePrice)}</strong>
            </div>
          </div>

          {highlights.length > 0 && (
            <div className="detail-highlights" aria-label="Điểm nổi bật tài khoản">
              {highlights.map((highlight) => <span key={highlight}>{highlight}</span>)}
            </div>
          )}

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
                    ✓ Đã áp dụng: giảm {formatVnd(voucherAmount)}
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

          <aside className="detail-purchase-notice" aria-label="Lưu ý khi mua tài khoản">
            <h2>Quyền lợi sau mua</h2>
            <div><CheckCircle2 size={17} aria-hidden="true" /><p><strong>Miễn phí đổi thông tin</strong><span>Shop hỗ trợ sau khi nhận tài khoản.</span></p></div>
            <div><CheckCircle2 size={17} aria-hidden="true" /><p><strong>Đúng giá niêm yết</strong><span>Không phát sinh thêm chi phí.</span></p></div>
          </aside>

          {zaloLink && (
            <a className="detail-zalo-contact" href={zaloLink} target="_blank" rel="noopener noreferrer" aria-label={`Liên hệ Zalo ${zaloPhone} để được hỗ trợ`}>
              <span className="detail-zalo-mark" aria-hidden="true">Zalo</span>
              <span className="detail-zalo-contact-copy">
                <strong>Zalo: <span>{zaloPhone}</span></strong>
                <small>Hỗ trợ: 24/7 (T2–CN, cả ngày lễ)</small>
              </span>
            </a>
          )}
        </section>
      </div>

      {!isSold && createPortal((
        <div className="mobile-purchase-bar" aria-label="Mua tài khoản">
          <div className="mobile-purchase-price">
            <span className="mobile-purchase-label">
              {hasVoucher ? "Giá sau voucher" : (hasSale ? "Giá sale" : "Giá")}
              {hasVoucher ? (
                <b className="mobile-voucher-tag">-{formatVnd(voucherAmount)}</b>
              ) : hasSale ? (
                <b>GIẢM {saleDiscountLabel}</b>
              ) : null}
            </span>
            <span className="mobile-purchase-values">
              {hasVoucher ? (
                <>
                  <del>{formatVnd(currentPrice)}</del>
                  <strong>{formatVnd(finalPurchasePrice)}</strong>
                </>
              ) : hasSale ? (
                <>
                  <del>{formatVnd(originalPrice)}</del>
                  <strong>{formatVnd(currentPrice)}</strong>
                </>
              ) : (
                <strong>{formatVnd(currentPrice)}</strong>
              )}
            </span>
          </div>
          <button type="button" className="btn-primary" onClick={openPurchase}>
            MUA NGAY
          </button>
        </div>
      ), document.body)}

      {/* MODAL 1: CONFIRM PURCHASE */}
      <Modal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title={<span className="dialog-title-with-icon"><ShoppingCart size={20} aria-hidden="true" /> Xác nhận đơn hàng</span>}
        className="client-transaction-dialog client-purchase-confirm-dialog"
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
          <div className="purchase-confirm-product">
            <SafeImage src={activeImg} alt={`Ảnh tài khoản ${account.id}`} width={112} height={70} fallbackLabel="Chưa có ảnh" />
            <span><small>Tài khoản đang mua</small><strong>{account.accountType?.name || "Tài khoản game"} #{account.id}</strong><em>Nhận thông tin đăng nhập ngay sau thanh toán</em></span>
            <b>{formatVnd(finalPurchasePrice)}</b>
          </div>
          <dl className="purchase-confirm-summary">
            <div>
              <dt>Tài khoản</dt>
              <dd>{account.accountType?.name || "Tài khoản game"} #{account.id}</dd>
            </div>
            {hasSale && (
              <div>
                <dt>Giá gốc</dt>
                <dd><del>{formatVnd(originalPrice)}</del></dd>
              </div>
            )}
            {hasSale && (
              <div className="sale-row">
                <dt>Giảm giá sale ({saleDiscountLabel})</dt>
                <dd>-{formatVnd(savingAmount)}</dd>
              </div>
            )}
            <div>
              <dt>{hasSale ? "Giá sau sale" : "Giá sản phẩm"}</dt>
              <dd>{formatVnd(currentPrice)}</dd>
            </div>
            {discountPreview && (
              <div className="discount-row">
                <dt>Voucher {discountCode && `(${discountCode})`}</dt>
                <dd>-{formatVnd(discountPreview.discount_amount || 0)}</dd>
              </div>
            )}
            <div>
              <dt>Số dư hiện tại</dt>
              <dd>{userBalance === null ? "Chưa đồng bộ" : formatVnd(userBalance)}</dd>
            </div>
            <div className="total-row">
              <dt>Thanh toán</dt>
              <dd>{formatVnd(finalPurchasePrice)}</dd>
            </div>
          </dl>
          {!discountPreview && discountCode && <p className="form-hint">Mã giảm giá sẽ được kiểm tra khi thanh toán. Chọn “Áp dụng” để xem số tiền dự kiến.</p>}
          {hasInsufficientBalance && (
            <div className="purchase-balance-warning" role="status">
              <ShieldAlert size={18} aria-hidden="true" />
              <span><strong>Số dư chưa đủ.</strong> Bạn cần nạp thêm {formatVnd(finalPurchasePrice - userBalance)} để mua tài khoản này.</span>
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
        title={
          <span className="dialog-title-with-icon">
            <CheckCircle2 size={21} aria-hidden="true" /> Mua tài khoản thành công
          </span>
        }
        className="client-transaction-dialog client-credentials-dialog"
        footer={
          <>
            <button
              type="button"
              onClick={() => navigate("/my-orders")}
              className="btn-outline modal-btn-secondary"
            >
              <History size={16} aria-hidden="true" />
              <span>Lịch sử mua hàng</span>
            </button>
            <button
              type="button"
              onClick={() => setIsSuccessOpen(false)}
              className="btn-primary modal-btn-primary"
            >
              <span>Đóng lại</span>
            </button>
          </>
        }
      >
        <div className="credential-delivery">
          <div className="credential-delivery-banner">
            <div className="credential-delivery-badge">
              <Sparkles size={13} aria-hidden="true" />
              <span>GIAO DỊCH HOÀN TẤT</span>
            </div>
            <p className="credential-delivery-text">
              Cảm ơn bạn đã tin tưởng ủng hộ <strong>{readStoredJson("setting", {}).ten_web || "Shop Tran Hieu"}</strong>. Tài khoản đã được bàn giao tự động thành công!
            </p>
          </div>
          
          <div className="order-credentials">
            <div className="order-credentials-header">
              <div className="order-credentials-heading">
                <ShieldCheck size={18} aria-hidden="true" />
                <h4>THÔNG TIN ĐĂNG NHẬP</h4>
              </div>
              <span className="order-credentials-tag">Bàn giao tự động</span>
            </div>
            
            <LoginCredentials login={purchaseData?.login} copiedField={copiedField} onCopy={copy} />
          </div>

          <div className="order-security-note">
            <ShieldAlert size={18} className="order-security-icon" aria-hidden="true" />
            <div className="order-security-content">
              <strong>Lưu ý bảo mật quan trọng:</strong>
              <p>
                Vui lòng đăng nhập vào tài khoản Liên Quân, kích hoạt số điện thoại bảo mật và đổi mật khẩu Garena ngay để tránh xảy ra tranh chấp sau này.
              </p>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isZoomOpen}
        onClose={closeImageViewer}
        title={`Ảnh tài khoản #${account.id}`}
        className="image-viewer-dialog"
        hideHeader
      >
        <div className="zoom-image-stage">
          <SafeImage
            src={activeImg}
            alt={`Ảnh phóng to của tài khoản ${account.id}`}
            width={1200}
            height={800}
            loading="eager"
            draggable={false}
            fallbackLabel="Không thể hiển thị ảnh lớn"
          />
        </div>
      </Modal>
    </div>
  );
}
