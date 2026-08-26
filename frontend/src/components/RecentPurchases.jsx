import { useMemo } from "react";
import { ShoppingBag } from "lucide-react";

function maskUsername(username) {
  if (!username || typeof username !== "string") return "kh*****ch";
  const clean = username.trim();
  if (clean.length <= 2) {
    return clean[0] + "*****" + (clean[1] || clean[0]);
  }
  if (clean.length === 3) {
    return clean.slice(0, 2) + "*****" + clean.slice(-1);
  }
  return clean.slice(0, 2) + "*****" + clean.slice(-2);
}

function formatRelativeTime(dateInput) {
  if (!dateInput) return "vừa xong";
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(dateInput).getTime()) / 1000));
  if (diffSec < 60) return "vừa xong";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} ngày trước`;
}

const SIMULATED_PURCHASES = [
  { id: 101, username: "admin", account_type_name: "ACC GIÁ RẺ", price: 60000, createdAt: new Date(Date.now() - 2 * 60 * 1000) },
  { id: 102, username: "thanhdat99", account_type_name: "TÚI MÙ 179K", price: 179000, createdAt: new Date(Date.now() - 6 * 60 * 1000) },
  { id: 103, username: "hoanglong_lq", account_type_name: "ACC GIÁ SIÊU RẺ 20K", price: 20000, createdAt: new Date(Date.now() - 14 * 60 * 1000) },
  { id: 104, username: "nguyenduc", account_type_name: "ACC GIÁ RẺ", price: 120000, createdAt: new Date(Date.now() - 25 * 60 * 1000) },
  { id: 105, username: "quocbao2k4", account_type_name: "ACC VIP LIÊN QUÂN", price: 450000, createdAt: new Date(Date.now() - 40 * 60 * 1000) },
];

export default function RecentPurchases() {
  const displayItems = useMemo(() => {
    const mapped = SIMULATED_PURCHASES.map((order) => ({
      id: order.id,
      maskedUser: maskUsername(order.username),
      typeName: order.account_type_name || "Tài khoản game",
      priceStr: Number(order.price || 0).toLocaleString() + "đ",
      timeStr: formatRelativeTime(order.createdAt),
    }));

    let filled = [...mapped];
    while (filled.length < 8) {
      filled = [...filled, ...mapped];
    }
    return filled;
  }, []);

  return (
    <div className="storefront-purchase-feed" aria-label="Hoạt động mua tài khoản gần đây">
      <div className="purchase-feed-badge">
        <span className="live-dot" />
        <ShoppingBag size={13} />
        <span>VỪA MUA</span>
      </div>
      <div className="purchase-feed-viewport">
        <div className="purchase-feed-track">
          {displayItems.concat(displayItems).map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="purchase-feed-item">
              <span className="purchase-user">{item.maskedUser}</span>
              <span className="purchase-action">vừa mua</span>
              <strong className="purchase-type">{item.typeName}</strong>
              <span className="purchase-price">{item.priceStr}</span>
              <span className="purchase-dot">·</span>
              <span className="purchase-time">{item.timeStr}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
