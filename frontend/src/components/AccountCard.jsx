import { Link } from "react-router-dom";
import { Eye } from "lucide-react";

export default function AccountCard({ acc }) {
  const isSold = Number(acc.status) === 1;

  // Render spec tags if thong_tin has text
  const specs = (() => {
    if (!acc.thong_tin) return [];
    // Split by comma or pipe if present, otherwise split by newline
    const delimiter = acc.thong_tin.includes("|") 
      ? "|" 
      : acc.thong_tin.includes(",") 
        ? "," 
        : "\n";
    return acc.thong_tin
      .split(delimiter)
      .map(s => s.trim())
      .filter(s => s.length > 0 && s.length < 30) // Filter out very long descriptions
      .slice(0, 3); // Max 3 tags
  })();

  const formatPrice = (price) => {
    return Number(price || 0).toLocaleString() + "đ";
  };

  // Calculate percentage discount if sale exists
  const discountPercent = (() => {
    if (acc.is_sale && acc.original_price && acc.final_price) {
      const orig = Number(acc.original_price);
      const final = Number(acc.final_price);
      if (orig > final) {
        return Math.round(((orig - final) / orig) * 100);
      }
    }
    return 0;
  })();

  return (
    <Link 
      to={`/account/${acc.id}`} 
      className={`account-card-premium ${isSold ? "sold" : ""}`}
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      {isSold && (
        <div className="badge-sold">
          <span>ĐÃ BÁN</span>
        </div>
      )}

      <div className="account-thumb-wrapper">
        <span className="badge-id">MS #{acc.id}</span>
        {discountPercent > 0 && !isSold && (
          <span className="badge-sale">-{discountPercent}%</span>
        )}
        <img src={acc.img || "https://placehold.co/400x250/111827/ffffff?text=Lien+Quan"} alt={`Account ${acc.id}`} />
      </div>

      <div className="account-body-premium">
        <h3>Acc Liên Quân #{acc.id}</h3>
        <p className="account-desc">{acc.thong_tin || "Tài khoản Liên Quân chất lượng cao, giá tốt nhất thị trường."}</p>
        
        {specs.length > 0 && (
          <div className="account-tags">
            {specs.map((spec, index) => (
              <span key={index} className="tag-spec">{spec}</span>
            ))}
          </div>
        )}

        <div className="account-footer-price">
          <div className="price-box">
            {acc.is_sale ? (
              <>
                <del>{formatPrice(acc.original_price)}</del>
                <strong>{formatPrice(acc.final_price)}</strong>
              </>
            ) : (
              <strong>{formatPrice(acc.gia)}</strong>
            )}
          </div>

          <span className="btn-outline" style={{ padding: "6px 12px", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <Eye size={14} /> Chi tiết
          </span>
        </div>
      </div>
    </Link>
  );
}
