import { useCallback, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Check, Copy, Info, Landmark, QrCode, RefreshCw, Wallet } from "lucide-react";
import api from "../../api/api";
import { updateSEO } from "../../utils/seo";
import Modal from "../../components/Modal";
import SafeImage from "../../components/SafeImage";
import CurrencyInput from "../../components/CurrencyInput";
import SkeletonLoading from "../../components/SkeletonLoading";

export default function Recharge() {
  const token = localStorage.getItem("accessToken");

  const [copiedField, setCopiedField] = useState("");
  
  // Bank state loaded dynamically from list_bank API
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
      const res = await api.get("/banks");
      const bankList = res.data.data || [];
      setBanks(bankList);
      if (bankList.length > 0) {
        setSelectedBankId((current) => current || bankList[0].id.toString());
      }
    } catch (err) {
      console.error("Failed to fetch banks:", err);
      setBankLoadError(err.response?.data?.message || "Không thể tải tài khoản nhận tiền.");
    } finally {
      setBanksLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchBanks();
    }
  }, [fetchBanks, token]);

  useEffect(() => {
    updateSEO({
      title: "Nạp Tiền Vào Tài Khoản - Tự Động Siêu Tốc",
      description: "Hướng dẫn nạp tiền vào ví qua ngân hàng hoặc ví điện tử với nội dung chuyển khoản chính xác.",
      keywords: "nap tien shop acc, nap ATM, nap momo, nap tu dong"
    });
  }, []);

  const selectedBank = banks.find((b) => b.id.toString() === selectedBankId);
  const activeBank = paymentIntent?.bank || selectedBank;
  const qrUrl = paymentIntent?.qr_url || "";
  const paymentIntentId = paymentIntent?.id;
  const paymentIntentStatus = paymentIntent?.status;

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
        const response = await api.get(`/payments/intents/${paymentIntentId}`, {
          params: { poll: Date.now() },
        });
        if (!cancelled) setPaymentIntent(response.data.data);
      } catch (error) {
        // Keep the transfer instructions available; a temporary polling error
        // must never make a valid payment code disappear.
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

  function handleCopy(text, fieldName) {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(""), 2000);
  }

  async function handleCreateIntent() {
    if (depositAmount < 10000) {
      setIntentError("Số tiền nạp tối thiểu là 10.000đ");
      return;
    }
    if (!selectedBankId) {
      setIntentError("Vui lòng chọn tài khoản nhận tiền");
      return;
    }
    setCreatingIntent(true);
    setIntentError("");
    try {
      const response = await api.post("/payments/intents", {
        amount: depositAmount,
        bank_id: selectedBankId,
      });
      setPaymentIntent(response.data.data);
      setIsQrModalOpen(true);
    } catch (error) {
      setIntentError(error.response?.data?.message || "Không thể tạo mã nạp tiền, vui lòng thử lại");
    } finally {
      setCreatingIntent(false);
    }
  }

  if (!token) {
    return (
      <div className="page-container recharge-page">
        <section className="recharge-access-state">
          <Wallet size={32} aria-hidden="true" />
          <h1>Đăng nhập để nạp tiền</h1>
          <p>
            Vui lòng đăng nhập để nhận đúng nội dung chuyển khoản của tài khoản bạn.
          </p>
          <div className="recharge-access-actions">
            <Link to="/login" className="btn-primary">Đăng nhập</Link>
            <Link to="/register" className="btn-outline">Đăng ký</Link>
          </div>
        </section>
      </div>
    );
  }

  if (!banksLoading && bankLoadError) {
    return (
      <div className="page-container recharge-page">
        <section className="recharge-access-state error-state">
          <AlertCircle size={32} aria-hidden="true" />
          <h1>Chưa tải được cổng nạp</h1>
          <p>{bankLoadError}</p>
          <button type="button" className="btn-primary" onClick={fetchBanks}>
            <RefreshCw size={18} aria-hidden="true" /> Thử lại
          </button>
        </section>
      </div>
    );
  }

  if (!banksLoading && banks.length === 0) {
    return (
      <div className="page-container recharge-page">
        <section className="recharge-access-state">
          <Landmark size={32} aria-hidden="true" />
          <h1>Cổng nạp đang bảo trì</h1>
          <p>
            Hiện chưa có tài khoản ngân hàng đang hoạt động. Vui lòng quay lại sau hoặc liên hệ hỗ trợ để được hướng dẫn.
          </p>
          <div className="recharge-access-actions">
            <a href="https://zalo.me/0999999999" target="_blank" rel="noreferrer" className="btn-primary">
              Liên hệ Admin
            </a>
            <Link to="/" className="btn-outline">Về trang chủ</Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-container recharge-page">
      <header className="recharge-heading">
        <span className="storefront-section-kicker"><Wallet size={17} aria-hidden="true" /> Ví của bạn</span>
        <h1>Nạp tiền tự động</h1>
        <p>Tạo mã nạp riêng, chuyển khoản đúng thông tin và chờ hệ thống xác nhận.</p>
      </header>

      <section className="recharge-card" aria-labelledby="recharge-form-title">
        <h2 id="recharge-form-title">Tạo mã chuyển khoản</h2>

        <div className="recharge-step">
          <div className="recharge-step-title"><span>1</span><strong>Chọn số tiền</strong></div>
          <div className="form-group-premium">
            <label htmlFor="recharge-amount">Số tiền muốn nạp</label>
            <div className="recharge-amount-options">
              {[20000, 50000, 100000, 500000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setDepositAmount(val)}
                  className={`btn-suggestion ${depositAmount === val ? "active" : ""}`}
                  aria-pressed={depositAmount === val}
                >
                  {val.toLocaleString()}đ
                </button>
              ))}
            </div>
            <CurrencyInput
              id="recharge-amount"
              name="amount"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value ? Number(e.target.value) : "")}
              placeholder="Tối thiểu 10.000đ"
              aria-describedby="recharge-amount-hint"
            />
            <small id="recharge-amount-hint" className={Number(depositAmount || 0) < 10000 ? "form-hint error" : "form-hint"}>
              {Number(depositAmount || 0) < 10000 ? "Số tiền nạp tối thiểu là 10.000đ" : `Bạn sẽ tạo lệnh nạp ${Number(depositAmount || 0).toLocaleString()}đ`}
            </small>
          </div>
        </div>

        <div className="recharge-step recharge-bank-step">
          <div className="recharge-step-title"><span>2</span><strong>Chọn tài khoản nhận</strong></div>
          {banksLoading ? (
            <SkeletonLoading variant="form" items={1} compact label="Đang tải danh sách ngân hàng" />
          ) : (
            <div className="form-group-premium">
              <label htmlFor="payment-bank">Ngân hàng</label>
              <select
                id="payment-bank"
                name="bankId"
                className="filter-input"
                value={selectedBankId}
                onChange={(e) => setSelectedBankId(e.target.value)}
              >
                {banks.map((bank) => (
                  <option key={bank.id} value={bank.id.toString()}>{bank.name}</option>
                ))}
              </select>
            </div>
          )}

          {selectedBank && (
            <dl className="recharge-bank-summary">
              <div><dt>Ngân hàng</dt><dd>{selectedBank.name}</dd></div>
              <div>
                <dt>Số tài khoản</dt>
                <dd>
                  <strong>{selectedBank.account_no}</strong>
                  <button type="button" onClick={() => handleCopy(selectedBank.account_no, "accno")} className="copy-badge" aria-label="Sao chép số tài khoản">
                    {copiedField === "accno" ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
                  </button>
                </dd>
              </div>
              <div><dt>Chủ tài khoản</dt><dd>{selectedBank.account_name}</dd></div>
            </dl>
          )}
        </div>

        <button
          type="button"
          className="btn-primary recharge-submit"
          onClick={handleCreateIntent}
          disabled={creatingIntent || banksLoading || !selectedBankId}
          aria-busy={creatingIntent}
        >
          <QrCode size={19} aria-hidden="true" /> {creatingIntent ? "Đang tạo mã nạp…" : "Tạo mã nạp tiền"}
        </button>

        {intentError && <p role="alert" className="recharge-error"><AlertCircle size={17} aria-hidden="true" /> {intentError}</p>}

        <p className="recharge-security-note">
          <Info size={17} aria-hidden="true" />
          <span><strong>Chỉ chuyển khoản sau khi tạo mã.</strong> Mỗi mã có nội dung riêng, dùng một lần. Shop không bao giờ yêu cầu mật khẩu hay OTP.</span>
        </p>
      </section>

      <Modal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title="Thông tin chuyển khoản"
        footer={
          <button type="button" onClick={() => setIsQrModalOpen(false)} className="btn-primary">
            {paymentIntent?.status === "paid" ? "Hoàn tất" : "Đóng"}
          </button>
        }
      >
        <div className="recharge-qr-content">
          <div className={`payment-status ${paymentIntent?.status || "pending"}`} aria-live="polite">
            {paymentIntent?.status === "paid"
              ? "Đã cộng tiền vào số dư"
              : paymentIntent?.status === "expired"
                ? "Mã nạp đã hết hạn"
                : "Đang chờ chuyển khoản"}
          </div>

          <p className="recharge-qr-help">
            {paymentIntent?.status === "paid"
              ? "Giao dịch đã được SePay xác nhận thành công."
              : paymentIntent?.status === "expired"
                ? "Đóng cửa sổ này và tạo mã nạp mới để tiếp tục."
                : "Quét QR hoặc nhập đúng từng thông tin bên dưới. Số dư sẽ tự cập nhật sau khi SePay xác nhận."}
          </p>

          {paymentIntent?.status === "paid" ? (
            <div className="recharge-success-mark"><Check size={28} aria-hidden="true" /> Nạp tiền thành công</div>
          ) : activeBank && qrUrl ? (
            <div className="recharge-qr-image">
              <SafeImage
                src={qrUrl}
                alt={`Mã QR nạp tiền ${activeBank.name}`}
                width={220}
                height={220}
                fallbackLabel="Không thể tạo mã QR"
              />
            </div>
          ) : (
            <p className="form-hint error">Không thể hiển thị mã QR. Bạn vẫn có thể chuyển khoản theo thông tin bên dưới.</p>
          )}

          <dl className="recharge-transfer-details">
            <div><dt>Ngân hàng</dt><dd>{activeBank?.name}</dd></div>
            <div>
              <dt>Số tài khoản</dt>
              <dd><strong>{activeBank?.account_no}</strong><button type="button" onClick={() => handleCopy(activeBank?.account_no, "modal_accno")} className="copy-badge" aria-label="Sao chép số tài khoản">{copiedField === "modal_accno" ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}</button></dd>
            </div>
            <div><dt>Chủ tài khoản</dt><dd>{activeBank?.account_name}</dd></div>
            <div>
              <dt>Số tiền</dt>
              <dd><strong>{Number(paymentIntent?.amount || depositAmount).toLocaleString()}đ</strong><button type="button" onClick={() => handleCopy(String(paymentIntent?.amount || depositAmount), "modal_amount")} className="copy-badge" aria-label="Sao chép số tiền">{copiedField === "modal_amount" ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}</button></dd>
            </div>
            <div className="transfer-content-row">
              <dt>Nội dung chuyển khoản</dt>
              <dd><strong>{paymentIntent?.code || ""}</strong><button type="button" onClick={() => handleCopy(paymentIntent?.code || "", "modal_syntax")} className="copy-badge" aria-label="Sao chép nội dung chuyển khoản">{copiedField === "modal_syntax" ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}</button></dd>
            </div>
          </dl>
        </div>
      </Modal>
    </div>
  );
}
