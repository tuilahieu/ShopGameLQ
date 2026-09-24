import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, Check, Clock3, Info, Landmark, QrCode, RefreshCw, Wallet } from "lucide-react";
import api from "../../api/api";
import Modal from "../../components/Modal";
import CurrencyInput from "../../components/CurrencyInput";
import SkeletonLoading from "../../components/SkeletonLoading";
import useClipboardFeedback from "../../hooks/useClipboardFeedback";
import usePageSeo from "../../hooks/usePageSeo";
import { formatVnd } from "../../utils/formatters";
import CopyButton from "../../components/client/CopyButton";
import AccessState from "../../components/client/AccessState";
import FormField from "../../components/client/FormField";
import "./Recharge.css";

const QUICK_AMOUNTS = [20000, 50000, 100000, 500000];

function getDepositErrorMessage(error) {
  const messages = {
    PAYMENT_NOT_CONFIGURED: "Chức năng nạp tiền đang tạm ngưng. Vui lòng quay lại sau.",
    INVALID_AMOUNT: "Số tiền nạp chưa hợp lệ. Vui lòng kiểm tra lại.",
    INVALID_BANK: "Vui lòng chọn tài khoản nhận tiền.",
    BANK_NOT_FOUND: "Tài khoản nhận tiền vừa chọn không còn hoạt động.",
    PAYMENT_INTENT_FAILED: "Chưa thể chuẩn bị thông tin nạp tiền. Vui lòng thử lại.",
  };
  return messages[error?.response?.data?.code] || "Chưa thể chuẩn bị thông tin nạp tiền. Vui lòng thử lại.";
}

function formatExpiry(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(date);
}

function LazyPaymentQr({ src, alt, enabled }) {
  const [imageSrc, setImageSrc] = useState("");
  const [state, setState] = useState("idle");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled || !src) {
      setImageSrc("");
      setState("idle");
      return undefined;
    }

    setState("loading");
    const frame = window.requestAnimationFrame(() => setImageSrc(src));
    return () => window.cancelAnimationFrame(frame);
  }, [attempt, enabled, src]);

  const retry = () => {
    setImageSrc("");
    setAttempt((value) => value + 1);
  };

  return (
    <div className={`recharge-qr-image is-${state}`} aria-busy={state === "loading"}>
      {state === "loading" && (
        <div className="recharge-qr-skeleton" role="status">
          <span className="recharge-qr-skeleton-mark"><QrCode size={28} aria-hidden="true" /></span>
          <span>Đang tải mã chuyển khoản…</span>
        </div>
      )}
      {imageSrc && state !== "error" && (
        <img
          key={`${src}-${attempt}`}
          src={imageSrc}
          alt={alt}
          width="260"
          height="260"
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          onLoad={() => setState("loaded")}
          onError={() => setState("error")}
        />
      )}
      {state === "error" && (
        <div className="recharge-qr-fallback" role="alert">
          <AlertCircle size={24} aria-hidden="true" />
          <strong>Chưa tải được mã</strong>
          <span>Bạn vẫn có thể chuyển khoản bằng thông tin bên cạnh.</span>
          <button type="button" className="btn-outline" onClick={retry}>
            <RefreshCw size={16} aria-hidden="true" /> Tải lại
          </button>
        </div>
      )}
    </div>
  );
}

export default function Recharge() {
  const token = localStorage.getItem("accessToken");
  const { copiedField, copy } = useClipboardFeedback();
  const [banks, setBanks] = useState([]);
  const [selectedBankId, setSelectedBankId] = useState("");
  const [banksLoading, setBanksLoading] = useState(true);
  const [bankLoadError, setBankLoadError] = useState("");
  const [depositAmount, setDepositAmount] = useState(50000);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState(null);
  const [creatingIntent, setCreatingIntent] = useState(false);
  const [intentError, setIntentError] = useState("");

  const fetchBanks = useCallback(async () => {
    setBanksLoading(true);
    setBankLoadError("");
    try {
      const response = await api.get("/banks");
      const bankList = response.data.data || [];
      setBanks(bankList);
      if (bankList.length > 0) setSelectedBankId((current) => current || bankList[0].id.toString());
    } catch (error) {
      console.error("Failed to fetch banks:", error);
      setBankLoadError("Chưa tải được tài khoản nhận tiền. Vui lòng thử lại.");
    } finally {
      setBanksLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) fetchBanks();
  }, [fetchBanks, token]);

  usePageSeo({
    title: "Nạp tiền vào tài khoản",
    description: "Nạp tiền vào số dư bằng chuyển khoản ngân hàng với thông tin dành riêng cho tài khoản của bạn.",
    keywords: "nạp tiền shop game, chuyển khoản ngân hàng, nạp số dư",
  });

  const selectedBank = banks.find((bank) => bank.id.toString() === selectedBankId);
  const activeBank = paymentIntent?.bank || selectedBank;
  const qrUrl = paymentIntent?.qr_url || "";
  const paymentIntentId = paymentIntent?.id;
  const paymentIntentStatus = paymentIntent?.status;
  const expiryTime = useMemo(() => formatExpiry(paymentIntent?.expires_at), [paymentIntent?.expires_at]);

  useEffect(() => {
    if (!isQrModalOpen || !paymentIntentId || paymentIntentStatus !== "pending") return undefined;
    let cancelled = false;
    let inFlight = false;
    let timer;

    const checkStatus = async () => {
      if (cancelled) return;
      if (document.hidden) {
        timer = window.setTimeout(checkStatus, 2500);
        return;
      }
      inFlight = true;
      try {
        const response = await api.get(`/payments/intents/${paymentIntentId}`, { params: { poll: Date.now() } });
        if (!cancelled) setPaymentIntent(response.data.data);
      } catch (error) {
        console.error("Failed to poll payment status:", error);
      } finally {
        inFlight = false;
        if (!cancelled) timer = window.setTimeout(checkStatus, 2500);
      }
    };

    const onVisibilityChange = () => {
      if (!document.hidden && !inFlight) {
        window.clearTimeout(timer);
        timer = window.setTimeout(checkStatus, 0);
      }
    };
    timer = window.setTimeout(checkStatus, 2500);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [isQrModalOpen, paymentIntentId, paymentIntentStatus]);

  async function handleCreateIntent(event) {
    event?.preventDefault();
    if (depositAmount < 10000) {
      setIntentError("Số tiền nạp tối thiểu là 10.000đ.");
      return;
    }
    if (!selectedBankId) {
      setIntentError("Vui lòng chọn tài khoản nhận tiền.");
      return;
    }

    setCreatingIntent(true);
    setIntentError("");
    try {
      const response = await api.post("/payments/intents", { amount: depositAmount, bank_id: selectedBankId });
      setPaymentIntent(response.data.data);
      setIsQrModalOpen(true);
    } catch (error) {
      setIntentError(getDepositErrorMessage(error));
    } finally {
      setCreatingIntent(false);
    }
  }

  if (!token) {
    return (
      <AccessState pageClassName="recharge-page" icon={<Wallet size={32} aria-hidden="true" />} title="Đăng nhập để nạp tiền" description="Đăng nhập để nhận thông tin chuyển khoản dành riêng cho tài khoản của bạn.">
        <div className="recharge-access-actions"><Link to="/login" className="btn-primary">Đăng nhập</Link><Link to="/register" className="btn-outline">Đăng ký</Link></div>
      </AccessState>
    );
  }

  if (!banksLoading && bankLoadError) {
    return (
      <AccessState pageClassName="recharge-page" className="error-state" icon={<AlertCircle size={32} aria-hidden="true" />} title="Chưa thể nạp tiền" description={bankLoadError}>
        <button type="button" className="btn-primary" onClick={fetchBanks}><RefreshCw size={18} aria-hidden="true" /> Thử lại</button>
      </AccessState>
    );
  }

  if (!banksLoading && banks.length === 0) {
    return (
      <AccessState pageClassName="recharge-page" icon={<Landmark size={32} aria-hidden="true" />} title="Nạp tiền đang tạm ngưng" description="Hiện chưa có tài khoản nhận tiền. Vui lòng quay lại sau hoặc liên hệ hỗ trợ.">
        <div className="recharge-access-actions"><Link to="/contact" className="btn-primary">Liên hệ hỗ trợ</Link><Link to="/" className="btn-outline">Về trang chủ</Link></div>
      </AccessState>
    );
  }

  return (
    <div className="page-container recharge-page recharge-page-v2">
      <header className="recharge-heading">
        <span className="storefront-section-kicker"><Wallet size={17} aria-hidden="true" /> Số dư tài khoản</span>
        <h1>Nạp tiền</h1>
        <p>Chọn số tiền và tài khoản nhận. Sau khi bạn chuyển khoản, số dư sẽ được cập nhật.</p>
      </header>

      <form className="recharge-card recharge-form-v2" onSubmit={handleCreateIntent} aria-labelledby="recharge-form-title">
        <div className="recharge-form-intro">
          <div><span className="recharge-form-eyebrow">Chuyển khoản ngân hàng</span><h2 id="recharge-form-title">Thông tin nạp tiền</h2></div>
          <span className="recharge-form-time"><Clock3 size={16} aria-hidden="true" /> Hoàn tất trong 15 phút</span>
        </div>

        <div className="recharge-form-grid">
          <section className="recharge-step" aria-labelledby="recharge-amount-title">
            <div className="recharge-step-title"><span>1</span><div><strong id="recharge-amount-title">Số tiền</strong><small>Chọn nhanh hoặc nhập số khác</small></div></div>
            <FormField id="recharge-amount" label="Số tiền muốn nạp">
              <div className="recharge-amount-options">
                {QUICK_AMOUNTS.map((value) => (
                  <button key={value} type="button" onClick={() => { setDepositAmount(value); setIntentError(""); }} className="btn-suggestion" aria-pressed={depositAmount === value}>{formatVnd(value)}</button>
                ))}
              </div>
              <div className="recharge-amount-input">
                <CurrencyInput id="recharge-amount" name="amount" value={depositAmount} onChange={(event) => { setDepositAmount(event.target.value ? Number(event.target.value) : ""); setIntentError(""); }} placeholder="Tối thiểu 10.000" aria-describedby="recharge-amount-hint" />
                <span>đ</span>
              </div>
              <small id="recharge-amount-hint" className={Number(depositAmount || 0) < 10000 ? "form-hint error" : "form-hint"}>
                {Number(depositAmount || 0) < 10000 ? "Tối thiểu 10.000đ" : `Bạn sẽ nạp ${formatVnd(depositAmount || 0)}`}
              </small>
            </FormField>
          </section>

          <section className="recharge-step recharge-bank-step" aria-labelledby="recharge-bank-title">
            <div className="recharge-step-title"><span>2</span><div><strong id="recharge-bank-title">Tài khoản nhận</strong><small>Chọn nơi bạn sẽ chuyển tiền đến</small></div></div>
            {banksLoading ? <SkeletonLoading variant="form" items={1} compact label="Đang tải tài khoản nhận tiền" /> : (
              <FormField id="payment-bank" label="Ngân hàng">
                <select id="payment-bank" name="bankId" className="filter-input" value={selectedBankId} onChange={(event) => { setSelectedBankId(event.target.value); setIntentError(""); }}>
                  {banks.map((bank) => <option key={bank.id} value={bank.id.toString()}>{bank.name}</option>)}
                </select>
              </FormField>
            )}
            {selectedBank && (
              <dl className="recharge-bank-summary">
                <div><dt>Ngân hàng</dt><dd>{selectedBank.name}</dd></div>
                <div><dt>Số tài khoản</dt><dd><strong>{selectedBank.account_no}</strong></dd></div>
                <div><dt>Chủ tài khoản</dt><dd>{selectedBank.account_name}</dd></div>
              </dl>
            )}
          </section>
        </div>

        {intentError && <p role="alert" className="recharge-error"><AlertCircle size={17} aria-hidden="true" /> {intentError}</p>}
        <div className="recharge-form-actions">
          <p className="recharge-security-note"><Info size={17} aria-hidden="true" /><span>Chỉ chuyển khoản theo thông tin ở bước tiếp theo. Không cung cấp mật khẩu hoặc mã xác nhận cho bất kỳ ai.</span></p>
          <button type="submit" className="btn-primary recharge-submit" disabled={creatingIntent || banksLoading || !selectedBankId || Number(depositAmount || 0) < 10000} aria-busy={creatingIntent}>
            {creatingIntent ? "Đang chuẩn bị…" : "Tiếp tục nạp tiền"}{!creatingIntent && <ArrowRight size={19} aria-hidden="true" />}
          </button>
        </div>
      </form>

      <Modal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title={paymentIntent?.status === "paid" ? "Nạp tiền thành công" : "Hoàn tất nạp tiền"}
        className="recharge-payment-modal"
        footer={<button type="button" onClick={() => setIsQrModalOpen(false)} className="btn-primary recharge-modal-close">{paymentIntent?.status === "paid" ? "Xong" : "Đóng"}</button>}
      >
        <div className="recharge-qr-content">
          <div className={`payment-status ${paymentIntent?.status || "pending"}`} aria-live="polite">
            {paymentIntent?.status === "paid" ? <><Check size={18} aria-hidden="true" /> Số dư đã được cập nhật</> : paymentIntent?.status === "expired" ? <><AlertCircle size={18} aria-hidden="true" /> Thông tin này đã hết hạn</> : <><span className="payment-status-dot" aria-hidden="true" /> Chờ bạn chuyển khoản</>}
          </div>
          <div className="recharge-modal-lead">
            <p className="recharge-qr-help">
              {paymentIntent?.status === "paid" ? "Giao dịch đã hoàn tất. Bạn có thể đóng cửa sổ này." : paymentIntent?.status === "expired" ? "Đóng cửa sổ này và tạo thông tin mới để tiếp tục nạp tiền." : "Quét mã hoặc chuyển khoản đúng thông tin bên dưới. Số dư sẽ cập nhật sau khi giao dịch hoàn tất."}
            </p>
            {paymentIntent?.status === "pending" && expiryTime && <span className="recharge-expiry"><Clock3 size={15} aria-hidden="true" /> Dùng trước {expiryTime}</span>}
          </div>

          {paymentIntent?.status === "paid" ? (
            <div className="recharge-success-mark"><Check size={30} aria-hidden="true" /><strong>Nạp tiền thành công</strong><span>{formatVnd(paymentIntent?.amount || depositAmount)}</span></div>
          ) : (
            <div className="recharge-payment-layout">
              <section className="recharge-qr-panel" aria-label="Mã chuyển khoản">
                {activeBank && qrUrl && paymentIntent?.status !== "expired" ? <LazyPaymentQr src={qrUrl} alt={`Mã chuyển khoản đến ${activeBank.name}`} enabled={isQrModalOpen && paymentIntent?.status === "pending"} /> : (
                  <div className="recharge-qr-fallback is-static"><QrCode size={26} aria-hidden="true" /><strong>Không có mã để quét</strong><span>Hãy dùng thông tin chuyển khoản bên cạnh.</span></div>
                )}
                <small>Quét bằng ứng dụng ngân hàng</small>
              </section>
              <section className="recharge-details-panel" aria-label="Thông tin chuyển khoản">
                <dl className="recharge-transfer-details">
                  <div><dt>Ngân hàng</dt><dd>{activeBank?.name}</dd></div>
                  <div><dt>Số tài khoản</dt><dd><strong>{activeBank?.account_no}</strong><CopyButton value={activeBank?.account_no} field="modal_accno" copiedField={copiedField} onCopy={copy} label="Sao chép số tài khoản" /></dd></div>
                  <div><dt>Chủ tài khoản</dt><dd>{activeBank?.account_name}</dd></div>
                  <div><dt>Số tiền</dt><dd><strong>{formatVnd(paymentIntent?.amount || depositAmount)}</strong><CopyButton value={String(paymentIntent?.amount || depositAmount)} field="modal_amount" copiedField={copiedField} onCopy={copy} label="Sao chép số tiền" /></dd></div>
                  <div className="transfer-content-row"><dt>Nội dung chuyển khoản</dt><dd><strong>{paymentIntent?.code || ""}</strong><CopyButton value={paymentIntent?.code || ""} field="modal_syntax" copiedField={copiedField} onCopy={copy} label="Sao chép nội dung chuyển khoản" /></dd></div>
                </dl>
                <p className="recharge-transfer-warning"><Info size={16} aria-hidden="true" /> Cần nhập đúng số tiền và nội dung để số dư được cập nhật.</p>
              </section>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
