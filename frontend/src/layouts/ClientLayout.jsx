import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { LogOut, User, Wallet, Home, ListFilter, CreditCard, History, Menu, X, Shield, Briefcase, FileText, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../api/api";
import ThemeToggle from "../components/ThemeToggle";
import SafeImage from "../components/SafeImage";

export default function ClientLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem("accessToken");
  const [user, setUser] = useState(() => {
    return JSON.parse(localStorage.getItem("user") || "{}");
  });
  const [setting, setSetting] = useState(() => {
    return JSON.parse(localStorage.getItem("setting") || "{}");
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close drawer upon navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Periodically refresh profile data to sync wallet balance and details
  async function fetchProfile() {
    if (!token) return;
    try {
      const res = await api.get("/profile");
      if (res.data?.data?.user) {
        const updatedUser = res.data.data.user;
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error("Failed to sync profile:", err);
    }
  }

  // Fetch public website setting configurations
  async function fetchSettings() {
    try {
      const res = await api.get("/home");
      if (res.data?.data?.setting) {
        const updatedSetting = res.data.data.setting;
        setSetting(updatedSetting);
        localStorage.setItem("setting", JSON.stringify(updatedSetting));
        if (updatedSetting.ten_web) {
          document.title = updatedSetting.ten_web;
        }
      }
    } catch (err) {
      console.error("Failed to sync settings:", err);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, [location.pathname, token]);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch {
      // The local session must still be cleared when its token is already invalid.
    }
    localStorage.clear();
    navigate("/");
    window.location.reload();
  }

  const zaloLink = setting.sdt_admin ? `https://zalo.me/${setting.sdt_admin.replace(/\D/g, "")}` : "https://zalo.me/0999999999";
  const phoneDisplay = setting.sdt_admin || "099.999.9999";
  const fbLink = setting.fb_admin || "https://m.me/shopgameliqi";

  return (
    <div className="client-page">
      <header className="client-header">
        <Link to="/" className="client-logo">
          {setting.logo ? (
            <SafeImage
              src={setting.logo}
              alt={`Logo ${setting.ten_web || "cửa hàng"}`}
              width={132}
              height={32}
              style={{ maxHeight: "45px" }}
              fallbackLabel={setting.ten_web || "Cửa hàng game"}
            />
          ) : (
            <>{setting.ten_web || "Shopgameliqi"}</>
          )}
        </Link>

        <nav className="client-nav">
          <NavLink to="/" end className={({ isActive }) => isActive ? "client-nav-link active" : "client-nav-link"}>
            <Home size={15} />
            <span>Trang chủ</span>
          </NavLink>
          
          <NavLink to="/accounts" className={({ isActive }) => isActive ? "client-nav-link active" : "client-nav-link"}>
            <ListFilter size={15} />
            <span>Kho tài khoản</span>
          </NavLink>
          
          <NavLink to="/nap-tien" className={({ isActive }) => isActive ? "client-nav-link active" : "client-nav-link"}>
            <CreditCard size={15} />
            <span>Nạp tiền</span>
          </NavLink>

          {token && (
            <>
              <NavLink to="/my-orders" className={({ isActive }) => isActive ? "client-nav-link active" : "client-nav-link"}>
                <History size={15} />
                <span>Đã mua</span>
              </NavLink>
              <NavLink to="/profile" className={({ isActive }) => isActive ? "client-nav-link active" : "client-nav-link"}>
                <User size={15} />
                <span>Cá nhân</span>
              </NavLink>
              {Number(user.level) === 99 && (
                <NavLink to="/admin" className={({ isActive }) => isActive ? "client-nav-link admin-nav-badge active" : "client-nav-link admin-nav-badge"}>
                  <span>Admin</span>
                </NavLink>
              )}
              {Number(user.level) === 1 && (
                <NavLink to="/ctv" className={({ isActive }) => isActive ? "client-nav-link ctv-nav-badge active" : "client-nav-link ctv-nav-badge"}>
                  <span>CTV</span>
                </NavLink>
              )}
            </>
          )}
        </nav>

        <div className={`client-actions ${token ? "logged-in" : "logged-out"}`}>
          <ThemeToggle />
          {token ? (
            <>
              <Link to="/profile" className="wallet-display" title="Số dư tài khoản">
                <Wallet size={14} style={{ color: "var(--gold-color)", flexShrink: 0 }} />
                <span>Số dư:</span>
                <strong>{Number(user.money || 0).toLocaleString()}đ</strong>
              </Link>

              <Link to="/profile" className="user-badge" title="Tài khoản của bạn">
                <User size={15} style={{ flexShrink: 0 }} />
                <span>{user.username}</span>
              </Link>

              <button onClick={logout} className="logout-link" title="Đăng xuất">
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-outline" style={{ padding: "7px 14px", minHeight: "36px", fontSize: "0.85rem" }}>
                Đăng nhập
              </Link>
              <Link to="/register" className="btn-primary" style={{ padding: "7px 14px", minHeight: "36px", fontSize: "0.85rem" }}>
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Mobile Top Bar (sticky on mobile) */}
      <div className="mobile-topbar">
        <div className="mobile-topbar-left">
          <button
            type="button"
            className="mobile-menu-trigger-btn"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Mở menu điều hướng"
          >
            <Menu size={22} />
          </button>
          <Link to="/" className="mobile-topbar-logo">
            {setting.logo ? (
              <SafeImage
                src={setting.logo}
                alt={`Logo ${setting.ten_web || "cửa hàng"}`}
                width={116}
                height={30}
                style={{ maxHeight: "30px" }}
                fallbackLabel={setting.ten_web || "Cửa hàng"}
              />
            ) : (
              <span>{setting.ten_web || "ShopGameLiQi"}</span>
            )}
          </Link>
        </div>

        <div className="mobile-topbar-right">
          {token ? (
            <>
              <Link to="/profile" className="mobile-topbar-wallet">
                <Wallet size={13} />
                <span>{Number(user.money || 0).toLocaleString()}đ</span>
              </Link>
              <ThemeToggle compact={true} />
            </>
          ) : (
            <>
              <Link to="/login" className="mobile-topbar-btn primary">Đăng nhập</Link>
              <ThemeToggle compact={true} />
            </>
          )}
        </div>
      </div>

      {/* Mobile Slide-Out Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="mobile-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <div className="mobile-drawer-brand">
                {setting.logo ? (
                  <SafeImage
                    src={setting.logo}
                    alt={`Logo ${setting.ten_web || "cửa hàng"}`}
                    width={120}
                    height={32}
                    style={{ maxHeight: "32px" }}
                    fallbackLabel={setting.ten_web || "ShopGameLiQi"}
                  />
                ) : (
                  <strong>{setting.ten_web || "ShopGameLiQi"}</strong>
                )}
              </div>
              <button
                type="button"
                className="mobile-drawer-close-btn"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Đóng menu"
              >
                <X size={20} />
              </button>
            </div>

            {token ? (
              <div className="mobile-drawer-usercard">
                <div className="mobile-drawer-avatar">
                  <User size={22} />
                </div>
                <div className="mobile-drawer-userinfo">
                  <h4>{user.username}</h4>
                  <div className="mobile-drawer-balance">
                    <Wallet size={13} style={{ color: "var(--gold-color)" }} />
                    <span>Số dư: <strong>{Number(user.money || 0).toLocaleString()}đ</strong></span>
                  </div>
                </div>
                {Number(user.level) === 99 && <span className="badge-role admin">Admin</span>}
                {Number(user.level) === 1 && <span className="badge-role ctv">CTV</span>}
              </div>
            ) : (
              <div className="mobile-drawer-guest-actions">
                <Link to="/login" className="btn-outline" style={{ flex: 1, minHeight: "38px" }}>
                  Đăng nhập
                </Link>
                <Link to="/register" className="btn-primary" style={{ flex: 1, minHeight: "38px" }}>
                  Đăng ký
                </Link>
              </div>
            )}

            <div className="mobile-drawer-nav">
              <NavLink to="/" end className={({ isActive }) => isActive ? "mobile-drawer-link active" : "mobile-drawer-link"}>
                <Home size={18} />
                <span>Trang chủ</span>
              </NavLink>
              
              <NavLink to="/accounts" className={({ isActive }) => isActive ? "mobile-drawer-link active" : "mobile-drawer-link"}>
                <ListFilter size={18} />
                <span>Kho tài khoản</span>
              </NavLink>
              
              <NavLink to="/nap-tien" className={({ isActive }) => isActive ? "mobile-drawer-link active" : "mobile-drawer-link"}>
                <CreditCard size={18} />
                <span>Nạp tiền tự động</span>
              </NavLink>

              {token && (
                <>
                  <NavLink to="/my-orders" className={({ isActive }) => isActive ? "mobile-drawer-link active" : "mobile-drawer-link"}>
                    <History size={18} />
                    <span>Lịch sử đã mua</span>
                  </NavLink>
                  
                  <NavLink to="/profile" className={({ isActive }) => isActive ? "mobile-drawer-link active" : "mobile-drawer-link"}>
                    <User size={18} />
                    <span>Thông tin cá nhân</span>
                  </NavLink>

                  {Number(user.level) === 99 && (
                    <NavLink to="/admin" className={({ isActive }) => isActive ? "mobile-drawer-link admin active" : "mobile-drawer-link admin"}>
                      <Shield size={18} />
                      <span>Trang quản trị (Admin)</span>
                    </NavLink>
                  )}

                  {Number(user.level) === 1 && (
                    <NavLink to="/ctv" className={({ isActive }) => isActive ? "mobile-drawer-link ctv active" : "mobile-drawer-link ctv"}>
                      <Briefcase size={18} />
                      <span>Trang CTV</span>
                    </NavLink>
                  )}
                </>
              )}

              <hr className="mobile-drawer-divider" />

              <NavLink to="/terms" className={({ isActive }) => isActive ? "mobile-drawer-link active" : "mobile-drawer-link"}>
                <FileText size={18} />
                <span>Chính sách & Bảo hành</span>
              </NavLink>
              
              <NavLink to="/contact" className={({ isActive }) => isActive ? "mobile-drawer-link active" : "mobile-drawer-link"}>
                <Phone size={18} />
                <span>Liên hệ hỗ trợ</span>
              </NavLink>
            </div>

            <div className="mobile-drawer-footer">
              <div className="mobile-drawer-theme-box">
                <span>Chủ đề hiển thị</span>
                <ThemeToggle />
              </div>
              {token && (
                <button type="button" className="mobile-drawer-logout-btn" onClick={logout}>
                  <LogOut size={16} />
                  <span>Đăng xuất</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <main style={{ flexGrow: 1 }}>
        <Outlet />
      </main>

      <footer className="client-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3>{setting.ten_web || "Shopgameliqi"}</h3>
            <p>Kho tài khoản game với thông tin rõ ràng và hỗ trợ khi cần thiết.</p>
          </div>
          <div className="footer-links">
            <h4>HỆ THỐNG</h4>
            <ul>
              <li><Link to="/">Trang chủ</Link></li>
              <li><Link to="/accounts">Kho tài khoản</Link></li>
              <li><Link to="/nap-tien">Nạp ATM / MoMo</Link></li>
              <li><Link to="/terms">Điều khoản bảo hành</Link></li>
              <li><Link to="/contact">Liên hệ hỗ trợ</Link></li>
            </ul>
          </div>
          <div className="footer-links">
            <h4>HỖ TRỢ CHĂM SÓC KHÁCH HÀNG</h4>
            <ul>
              <li>
                <a href={zaloLink} target="_blank" rel="noreferrer">
                  Hotline/Zalo: {phoneDisplay}
                </a>
              </li>
              <li>
                <a href={fbLink} target="_blank" rel="noreferrer">
                  Facebook Messenger
                </a>
              </li>
              <li>
                <a href={zaloLink} target="_blank" rel="noreferrer">
                  Zalo Chat Hỗ Trợ
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <div>© {new Date().getFullYear()} {setting.ten_web || "Shopgameliqi"} - Hệ thống bán tài khoản game tự động uy tín.</div>
          <div>All rights reserved.</div>
        </div>
      </footer>

      {/* Floating Mobile Bottom Navigation Dock (Luôn luôn nổi lên trên cùng) */}
      <nav className="mobile-bottom-nav">
        <NavLink to="/" end className={({ isActive }) => isActive ? "mobile-nav-item active" : "mobile-nav-item"}>
          <Home size={20} />
          <span>Trang chủ</span>
        </NavLink>
        
        <NavLink to="/accounts" className={({ isActive }) => isActive ? "mobile-nav-item active" : "mobile-nav-item"}>
          <ListFilter size={20} />
          <span>Kho acc</span>
        </NavLink>
        
        <NavLink to="/nap-tien" className={({ isActive }) => isActive ? "mobile-nav-item active" : "mobile-nav-item"}>
          <CreditCard size={20} />
          <span>Nạp tiền</span>
        </NavLink>

        {token ? (
          <NavLink to="/my-orders" className={({ isActive }) => isActive ? "mobile-nav-item active" : "mobile-nav-item"}>
            <History size={20} />
            <span>Đã mua</span>
          </NavLink>
        ) : (
          <NavLink to="/login" className={({ isActive }) => isActive ? "mobile-nav-item active" : "mobile-nav-item"}>
            <User size={20} />
            <span>Đăng nhập</span>
          </NavLink>
        )}

        <button
          type="button"
          className={`mobile-nav-item ${isMobileMenuOpen ? "active" : ""}`}
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Mở Menu"
        >
          <Menu size={20} />
          <span>Menu</span>
        </button>
      </nav>
    </div>
  );
}
