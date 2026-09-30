import { useEffect, useMemo, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { formatVnd } from "../utils/formatters";

function formatRelativeTime(dateInput, now) {
  if (!dateInput) return "vừa xong";
  const timestamp = new Date(dateInput).getTime();
  if (!Number.isFinite(timestamp)) return "vừa xong";
  const diffSec = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (diffSec < 60) return "vừa xong";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} ngày trước`;
}

export default function RecentPurchases({ items = [], simulated = false, compact = false, reverse = false, ariaHidden = false }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const displayItems = useMemo(() => {
    const mapped = items.map((order) => ({
      id: order.id,
      maskedUser: order.masked_user || "kh*****ch",
      typeName: order.account_type_name || "Tài khoản game",
      priceStr: Number(order.price) > 0 ? formatVnd(order.price) : "",
      timeStr: formatRelativeTime(order.created_at, now),
    }));

    if (mapped.length === 0) return [];

    let filled = [...mapped];
    while (filled.length < 8) {
      filled = [...filled, ...mapped];
    }
    return filled;
  }, [items, now]);

  if (displayItems.length === 0) return null;

  return (
    <div
      className={`storefront-purchase-feed${compact ? " is-compact" : ""}${reverse ? " is-reverse" : ""}`}
      aria-label={ariaHidden ? undefined : simulated ? "Hoạt động mua tài khoản mô phỏng" : "Hoạt động mua tài khoản gần đây"}
      aria-hidden={ariaHidden || undefined}
      data-simulated={simulated || undefined}
    >
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
              {item.priceStr && <span className="purchase-price">{item.priceStr}</span>}
              <span className="purchase-dot">·</span>
              <span className="purchase-time">{item.timeStr}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
