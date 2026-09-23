import { useLocation } from "react-router-dom";
import SkeletonLoading, { SkeletonBlock } from "./SkeletonLoading";

function getRouteSkeleton(pathname, search) {
  if (pathname === "/") return { variant: "home", label: "Đang tải cửa hàng" };
  if (pathname === "/accounts") return { variant: new URLSearchParams(search).has("loai_id") ? "catalogue-results" : "catalogue", label: "Đang tải kho tài khoản" };
  if (pathname.startsWith("/account/")) return { variant: "detail", label: "Đang tải chi tiết tài khoản" };
  if (pathname === "/my-orders") return { variant: "orders", label: "Đang tải tài khoản đã mua" };
  if (pathname === "/nap-tien") return { variant: "recharge", label: "Đang tải trang nạp tiền" };
  if (pathname === "/profile") return { variant: "profile", label: "Đang tải hồ sơ" };
  if (pathname === "/login" || pathname === "/register") return { variant: "auth", label: "Đang tải biểu mẫu tài khoản" };
  if (pathname === "/contact") return { variant: "contact", label: "Đang tải trang liên hệ" };
  if (pathname === "/terms") return { variant: "article", label: "Đang tải điều khoản" };
  if (pathname.startsWith("/admin") || pathname.startsWith("/ctv")) {
    const isDashboard = ["/admin", "/admin/", "/ctv", "/ctv/"].includes(pathname);
    return { variant: isDashboard ? "workspace" : "workspace-table", label: "Đang tải khu vực quản lý" };
  }
  return { variant: "article", label: "Đang tải trang" };
}

function ClientShellSkeleton({ children }) {
  return (
    <div className="client-page skeleton-app-shell">
      <header className="skeleton-client-header" aria-hidden="true">
        <SkeletonBlock className="skeleton-brand" />
        <nav><SkeletonBlock /><SkeletonBlock /><SkeletonBlock /><SkeletonBlock /></nav>
        <div><SkeletonBlock className="is-button-small" /><SkeletonBlock className="is-button-small" /></div>
      </header>
      <main className="skeleton-client-main">{children}</main>
      <div className="skeleton-mobile-nav" aria-hidden="true">{Array.from({ length: 5 }, (_, index) => <SkeletonBlock key={index} />)}</div>
    </div>
  );
}

export default function AppLoader({ inline = false }) {
  const location = useLocation();
  const route = getRouteSkeleton(location.pathname, location.search);
  const skeleton = <SkeletonLoading {...route} items={route.variant === "catalogue-results" ? 3 : 6} />;

  if (inline) return <div className="app-loader app-loader--inline">{skeleton}</div>;
  if (location.pathname.startsWith("/admin") || location.pathname.startsWith("/ctv")) return <div className="app-loader app-loader--workspace">{skeleton}</div>;
  return <ClientShellSkeleton>{skeleton}</ClientShellSkeleton>;
}
