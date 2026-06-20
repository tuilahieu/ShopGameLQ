import { useEffect, useState } from "react";
import { ShoppingCart, CheckCircle, Zap } from "lucide-react";
import api from "../api/api";

export default function RecentPurchases() {
  const [items, setItems] = useState([]);

  const maskUsername = (username) => {
    if (!username) return "Khách***";
    if (username.length <= 4) return username.slice(0, 1) + "***" + username.slice(-1);
    return username.slice(0, 3) + "***" + username.slice(-1);
  };

  async function loadActivities() {
    try {
      const res = await api.get("/home");
      const recent = res.data?.data?.recentActivities || [];
      if (recent.length > 0) {
        const formatted = recent.map((tx) => {
          const user = maskUsername(tx.user?.username);
          const amountStr = Number(tx.amount || 0).toLocaleString() + "đ";
          let text;
          if (tx.type === "deposit" || tx.type === "admin_add") {
            text = `Thành viên ${user} vừa nạp thành công ${amountStr} vào tài khoản`;
          } else if (tx.type === "buy_acc") {
            text = `Khách hàng ${user} vừa mua tài khoản #${tx.reference_id || tx.id} trị giá ${amountStr}`;
          } else if (tx.type === "refund") {
            text = `Khách hàng ${user} được hoàn trả ${amountStr} vào ví`;
          } else {
            text = `Tài khoản ${user} giao dịch ${amountStr} thành công`;
          }
          return { id: tx.id, text, type: tx.type };
        });
        setItems(formatted);
      }
    } catch (err) {
      console.error("Failed to load ticker activities:", err);
    }
  }

  useEffect(() => {
    loadActivities();
    // Auto-refresh real transactions every 20 seconds to keep it live
    const interval = setInterval(loadActivities, 20000);
    return () => clearInterval(interval);
  }, []);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="recent-purchases-ticker">
      <div className="ticker-label">
        <Zap size={12} style={{ display: "inline-block", marginRight: "3px" }} /> HOẠT ĐỘNG
      </div>
      <div className="ticker-content-wrapper">
        <div className="ticker-content">
          {items.concat(items).map((item, index) => (
            <div className="ticker-item" key={index}>
              {item.type === "buy_acc" ? (
                <ShoppingCart size={13} className="amount-sub" />
              ) : (
                <CheckCircle size={13} className="amount-add" />
              )}
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
