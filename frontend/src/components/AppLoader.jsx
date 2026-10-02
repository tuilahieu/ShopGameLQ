import { useLocation } from "react-router-dom";

function getRouteLoadingLabel(pathname) {
  if (pathname === "/") return "Đang tải cửa hàng";
  if (pathname === "/accounts") return "Đang tải kho tài khoản";
  if (pathname.startsWith("/account/")) return "Đang tải chi tiết tài khoản";
  if (pathname === "/my-orders") return "Đang tải tài khoản đã mua";
  if (pathname === "/nap-tien") return "Đang tải trang nạp tiền";
  if (pathname === "/profile") return "Đang tải hồ sơ";
  if (pathname === "/login" || pathname === "/register") return "Đang tải biểu mẫu tài khoản";
  if (pathname === "/contact") return "Đang tải trang liên hệ";
  if (pathname === "/terms") return "Đang tải điều khoản";
  if (pathname.startsWith("/admin") || pathname.startsWith("/ctv")) return "Đang tải khu vực quản lý";
  return "Đang tải trang";
}

function BundleLoadingOverlay({ label }) {
  return (
    <div className="bundle-loading-overlay" role="status" aria-live="polite" aria-label={label}>
      <div className="bundle-loading-card">
        <div className="bundle-loading-mark" aria-hidden="true">
          <span className="bundle-loading-logo"><strong>Shop</strong><b>Game</b><i /></span>
          <span className="bundle-loading-orbit"><i /><i /><i /></span>
        </div>
        <span className="bundle-loading-track" aria-hidden="true"><i /></span>
      </div>
    </div>
  );
}

export default function AppLoader({ inline = false }) {
  const location = useLocation();
  const label = getRouteLoadingLabel(location.pathname);
  return (
    <div className={`app-loader${inline ? " app-loader--inline" : ""}`}>
      <BundleLoadingOverlay label={label} />
    </div>
  );
}
