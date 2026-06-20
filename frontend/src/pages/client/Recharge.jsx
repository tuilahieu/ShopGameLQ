import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Copy, Check, Info, QrCode } from "lucide-react";
import api from "../../api/api";
import { updateSEO } from "../../utils/seo";
import Modal from "../../components/Modal";

export default function Recharge() {
  const token = localStorage.getItem("accessToken");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [copiedField, setCopiedField] = useState("");
  
  // Bank state loaded dynamically from list_bank API
  const [banks, setBanks] = useState([]);
  const [selectedBankId, setSelectedBankId] = useState("");
  const [banksLoading, setBanksLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState(50000);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  useEffect(() => {
    async function fetchBanks() {
      try {
        const res = await api.get("/banks");
        const bankList = res.data.data || [];
        setBanks(bankList);
        if (bankList.length > 0) {
          setSelectedBankId(bankList[0].id.toString());
        }
      } catch (err) {
        console.error("Failed to fetch banks:", err);
      } finally {
        setBanksLoading(false);
      }
    }
    if (token) {
      fetchBanks();
    }
  }, [token]);

  useEffect(() => {
    updateSEO({
      title: "Nạp Tiền Vào Tài Khoản - Tự Động Siêu Tốc",
      description: "Hệ thống nạp tiền tự động qua ngân hàng, ví MoMo, ATM siêu tốc. Hỗ trợ cộng tiền tự động sau 30 giây giao dịch.",
      keywords: "nap tien shop acc, nap ATM, nap momo, nap tu dong"
    });
  }, []);

  const activeBank = banks.find((b) => b.id.toString() === selectedBankId);

  // Generate VietQR URL dynamically
  const qrUrl = (() => {
    if (!token || !activeBank) return "";
    const addInfo = encodeURIComponent(`NAPTIEN ${user.username}`);
    const bId = activeBank.bank_id.toLowerCase();
    if (bId.includes("momo")) {
      return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=2|99|${activeBank.account_no}|||0|0|${depositAmount}|NAPTIEN%20${user.username}`;
    } else {
      const formattedBankId = bId.toUpperCase();
      return `https://img.vietqr.io/image/${formattedBankId}-${activeBank.account_no}-compact2.png?amount=${depositAmount}&addInfo=${addInfo}&accountName=${encodeURIComponent(activeBank.account_name)}`;
    }
  })();

  function handleCopy(text, fieldName) {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(""), 2000);
  }

  if (!token) {
    return (
      <div className="page-container" style={{ textAlign: "center", padding: "80px 24px" }}>
        <div style={{ maxWidth: "500px", margin: "0 auto", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "40px" }}>
          <h2>Yêu Cầu Đăng Nhập</h2>
          <p style={{ color: "var(--text-secondary)", margin: "16px 0 24px" }}>
            Vui lòng đăng nhập tài khoản của bạn để nhận cú pháp nạp tiền chính xác và thực hiện giao dịch nạp ví tự động.
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
            <Link to="/login" className="btn-primary" style={{ padding: "10px 24px" }}>Đăng nhập</Link>
            <Link to="/register" className="btn-outline" style={{ padding: "10px 24px" }}>Đăng ký</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!banksLoading && banks.length === 0) {
    return (
      <div className="page-container" style={{ textAlign: "center", padding: "80px 24px" }}>
        <div style={{ maxWidth: "500px", margin: "0 auto", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "40px" }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🛠️</div>
          <h2>Bảo Trì Cổng Nạp Tiền</h2>
          <p style={{ color: "var(--text-secondary)", margin: "16px 0 24px" }}>
            Hiện tại các cổng nạp tiền tự động (ATM / Ví MoMo) đang trong quá trình bảo trì để nâng cấp dịch vụ. Vui lòng quay lại sau hoặc liên hệ Admin để được hỗ trợ nạp tay nhanh chóng!
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
            <a href="https://zalo.me/0999999999" target="_blank" rel="noreferrer" className="btn-primary" style={{ padding: "10px 24px" }}>
              Liên hệ Admin
            </a>
            <Link to="/" className="btn-outline" style={{ padding: "10px 24px" }}>
              Quay về Trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ marginBottom: "32px" }}>NẠP TIỀN VÀO TÀI KHOẢN</h1>

      <div className="recharge-layout" style={{ display: "block", maxWidth: "680px", margin: "0 auto" }}>
        {/* ATM Details */}
        <div className="recharge-instructions" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <h3>🏦 THÔNG TIN CHUYỂN KHOẢN</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", margin: 0 }}>
            Bạn vui lòng chuyển khoản đúng số tài khoản và cú pháp bên dưới. Số dư sẽ tự động cộng vào tài khoản sau 1-3 phút.
          </p>

          {banksLoading ? (
            <p style={{ color: "var(--text-secondary)" }}>Đang tải danh sách ngân hàng...</p>
          ) : (
            <>
              <div className="form-group-premium">
                <label>Chọn cổng thanh toán</label>
                <select 
                  className="filter-input" 
                  value={selectedBankId} 
                  onChange={(e) => setSelectedBankId(e.target.value)}
                >
                  {banks.map((b) => (
                    <option key={b.id} value={b.id.toString()}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {activeBank && (
                <div style={{ background: "var(--bg-primary)", border: "1px solid var(--border-color)", padding: "20px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Ngân hàng:</span>
                    <span style={{ color: "var(--text-primary)", fontWeight: "600" }}>{activeBank.name}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Số tài khoản:</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <strong style={{ color: "var(--gold-color)", fontSize: "1.1rem" }}>{activeBank.account_no}</strong>
                      <button 
                        onClick={() => handleCopy(activeBank.account_no, "accno")} 
                        className="copy-badge"
                      >
                        {copiedField === "accno" ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Chủ tài khoản:</span>
                    <span style={{ color: "var(--text-primary)", fontWeight: "600" }}>{activeBank.account_name}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Cú pháp nạp:</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <strong style={{ color: "var(--accent-color)", fontSize: "0.9rem" }}>NAPTIEN {user.username}</strong>
                      <button 
                        onClick={() => handleCopy(`NAPTIEN ${user.username}`, "syntax")} 
                        className="copy-badge"
                      >
                        {copiedField === "syntax" ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="form-group-premium">
            <label>Số tiền muốn nạp (để tạo QR chính xác)</label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
              {[20000, 50000, 100000, 500000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setDepositAmount(val)}
                  className={`btn-suggestion ${depositAmount === val ? "active" : ""}`}
                  style={{
                    padding: "8px 14px",
                    fontSize: "0.85rem",
                    borderRadius: "8px",
                    cursor: "pointer",
                    border: depositAmount === val ? "1px solid var(--accent-color)" : "1px solid var(--border-color)",
                    background: depositAmount === val ? "var(--accent-color)" : "var(--bg-primary)",
                    color: depositAmount === val ? "white" : "var(--text-primary)",
                    fontWeight: "600",
                    transition: "var(--transition-smooth)"
                  }}
                >
                  {Number(val / 1000)}k
                </button>
              ))}
            </div>
            <input 
              type="number" 
              value={depositAmount} 
              onChange={(e) => setDepositAmount(Number(e.target.value))}
              min="10000"
              step="10000"
              placeholder="Nhập số tiền..."
            />
            {depositAmount < 10000 && (
              <span style={{ color: "var(--accent-color)", fontSize: "0.8rem", marginTop: "4px", display: "block" }}>
                ⚠️ Số tiền nạp tối thiểu là 10.000đ
              </span>
            )}
          </div>

          <button
            type="button"
            className="btn-primary"
            style={{ width: "100%", padding: "12px 24px", fontSize: "1rem", fontWeight: "600", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            onClick={() => {
              if (depositAmount < 10000) {
                alert("Số tiền nạp tối thiểu là 10.000đ");
                return;
              }
              setIsQrModalOpen(true);
            }}
          >
            <QrCode size={18} /> Tạo mã nạp tiền
          </button>

          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", alignItems: "flex-start", gap: "6px", margin: 0 }}>
            <Info size={14} style={{ flexShrink: 0, marginTop: "2px", color: "var(--gold-color)" }} />
            <span>
              <strong>Chú ý:</strong> Phải ghi đúng nội dung chuyển khoản là <code>NAPTIEN {user.username}</code> để hệ thống tự động cộng tiền. Nếu ghi sai nội dung vui lòng liên hệ Admin để được hỗ trợ thủ công.
            </span>
          </p>
        </div>
      </div>

      {/* QR Code Modal Popup */}
      <Modal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title="QUÉT MÃ QR THANH TOÁN"
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "10px" }}>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", textAlign: "center", margin: 0 }}>
            Mở App ngân hàng/ví của bạn để quét mã QR dưới đây. Thông tin số tài khoản, số tiền và nội dung chuyển khoản sẽ được tự động điền chính xác.
          </p>

          {activeBank ? (
            <img 
              src={qrUrl} 
              alt="VietQR code" 
              style={{ 
                maxWidth: "160px", 
                height: "auto", 
                display: "block", 
                margin: "4px auto", 
                borderRadius: "12px", 
                border: "1px solid var(--border-color)",
                background: "white",
                padding: "8px"
              }} 
            />
          ) : (
            <p style={{ color: "var(--text-secondary)" }}>Không tìm thấy mã QR</p>
          )}

          <div style={{ width: "100%", background: "var(--bg-primary)", border: "1px solid var(--border-color)", padding: "16px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>Ngân hàng:</span>
              <strong style={{ color: "var(--text-primary)", fontSize: "0.8rem" }}>{activeBank?.name}</strong>
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>Số tài khoản:</span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <strong style={{ color: "var(--gold-color)", fontSize: "0.82rem" }}>{activeBank?.account_no}</strong>
                <button 
                  onClick={() => handleCopy(activeBank?.account_no, "modal_accno")} 
                  className="copy-badge"
                >
                  {copiedField === "modal_accno" ? <Check size={10} /> : <Copy size={10} />}
                </button>
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>Chủ tài khoản:</span>
              <strong style={{ color: "var(--text-primary)", fontSize: "0.8rem" }}>{activeBank?.account_name}</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>Số tiền nạp:</span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <strong style={{ color: "var(--gold-color)", fontSize: "0.82rem" }}>{Number(depositAmount).toLocaleString()}đ</strong>
                <button 
                  onClick={() => handleCopy(depositAmount.toString(), "modal_amount")} 
                  className="copy-badge"
                >
                  {copiedField === "modal_amount" ? <Check size={10} /> : <Copy size={10} />}
                </button>
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>Nội dung CK:</span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <strong style={{ color: "var(--accent-color)", fontSize: "0.82rem" }}>{`NAPTIEN ${user.username}`}</strong>
                <button 
                  onClick={() => handleCopy(`NAPTIEN ${user.username}`, "modal_syntax")} 
                  className="copy-badge"
                >
                  {copiedField === "modal_syntax" ? <Check size={10} /> : <Copy size={10} />}
                </button>
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsQrModalOpen(false)}
            className="btn-outline"
            style={{ width: "100%", padding: "10px", marginTop: "4px", fontWeight: "600" }}
          >
            Đóng cửa sổ
          </button>
        </div>
      </Modal>
    </div>
  );
}
