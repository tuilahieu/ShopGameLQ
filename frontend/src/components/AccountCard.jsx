import { Link } from "react-router-dom";
import SafeImage from "./SafeImage";
import { getAccountPricing } from "../utils/accountPricing";

export default function AccountCard({ acc, priority = false, className = "" }) {
  const isSold = Number(acc.status) === 1;
  const pricing = getAccountPricing(acc);

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

  return (
    <Link 
      to={`/account/${acc.id}`} 
      className={`account-card-premium ${isSold ? "sold" : ""} ${className}`.trim()}
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      {isSold && (
        <div className="badge-sold">
          <span>HẾT TÀI KHOẢN</span>
        </div>
      )}

      <div className="account-thumb-wrapper">
        <span className="badge-id">MS #{acc.id}</span>
        {pricing.hasSale && !isSold && (
          <span className="badge-sale">GIẢM {pricing.discountLabel}</span>
        )}
        <SafeImage
          src={acc.img}
          alt={`Ảnh tài khoản Liên Quân mã số ${acc.id}`}
          width={400}
          height={250}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "low"}
          fallbackLabel="Chưa có ảnh tài khoản"
        />
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
            {pricing.hasSale ? (
              <>
                <del>{formatPrice(pricing.originalPrice)}</del>
                <strong>{formatPrice(pricing.currentPrice)}</strong>
              </>
            ) : (
              <strong>{formatPrice(pricing.currentPrice)}</strong>
            )}
          </div>

          <span className={`account-availability ${isSold ? "unavailable" : "available"}`}>
            {isSold ? "Đã bán" : "Mua được ngay"}
          </span>
        </div>
      </div>
    </Link>
  );
}
