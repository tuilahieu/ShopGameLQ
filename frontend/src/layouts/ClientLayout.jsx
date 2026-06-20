import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { LogOut, User, Wallet, Home, ListFilter, CreditCard, History, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../api/api";
import ThemeToggle from "../components/ThemeToggle";
import RecentPurchases from "../components/RecentPurchases";

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
  }, [location.pathname, token]); // Re-fetch on navigate to keep balance accurate

  useEffect(() => {
    fetchSettings();
  }, []);

  // Dynamic script/HTML injection from Admin Settings (js_web)
  useEffect(() => {
    if (setting?.js_web) {
      // 1. Remove previous custom scripts/elements to avoid duplicate runs
      const oldScripts = document.querySelectorAll(".custom-web-js");
      oldScripts.forEach((el) => el.remove());

      // 2. Parse and inject elements
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = setting.js_web.trim();

      const hasScripts = tempDiv.getElementsByTagName("script").length > 0;

      if (hasScripts) {
        // Iterate through parsed nodes to support both script tags and other markup (e.g. style, div, link)
        Array.from(tempDiv.childNodes).forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node;
            if (el.tagName === "SCRIPT") {
              const newScript = document.createElement("script");
              newScript.className = "custom-web-js";
              // Copy all attributes (src, async, defer, etc.)
              Array.from(el.attributes).forEach((attr) => {
                newScript.setAttribute(attr.name, attr.value);
              });
              newScript.textContent = el.textContent;
              document.body.appendChild(newScript);
            } else {
              // Clone and append non-script tags (style, link, custom divs)
              const clone = el.cloneNode(true);
              clone.classList.add("custom-web-js");
              document.body.appendChild(clone);
            }
          } else if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
            const textSpan = document.createElement("span");
            textSpan.className = "custom-web-js";
            textSpan.textContent = node.textContent;
            document.body.appendChild(textSpan);
          }
        });
      } else {
        // No script tags found, treat the setting string as raw JavaScript code
        const newScript = document.createElement("script");
        newScript.className = "custom-web-js";
        newScript.textContent = setting.js_web;
        document.body.appendChild(newScript);
      }
    }
  }, [setting?.js_web]);

  function logout() {
    localStorage.clear();
    navigate("/");
    window.location.reload(); // Hard reload to reset state
  }

  const zaloLink = setting.sdt_admin ? `https://zalo.me/${setting.sdt_admin.replace(/\D/g, "")}` : "https://zalo.me/0999999999";
  const phoneDisplay = setting.sdt_admin || "099.999.9999";
  const fbLink = setting.fb_admin || "https://m.me/shopgameliqi";

  return (
    <div className="client-page">
      <header className="client-header">
        <Link to="/" className="client-logo">
          {setting.logo ? (
            <img src={setting.logo} alt={setting.ten_web || "Logo"} style={{ maxHeight: "45px", width: "auto" }} />
          ) : (
            <>🎮 {setting.ten_web || "Shopgameliqi"}</>
          )}
        </Link>

        <nav className="client-nav">
          <NavLink to="/" end className={({ isActive }) => isActive ? "active" : ""}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <Home size={15} /> Trang chủ
            </span>
          </NavLink>
          
          <NavLink to="/accounts" className={({ isActive }) => isActive ? "active" : ""}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <ListFilter size={15} /> Kho tài khoản
            </span>
          </NavLink>
          
          <NavLink to="/nap-tien" className={({ isActive }) => isActive ? "active" : ""}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <CreditCard size={15} /> Nạp tiền
            </span>
          </NavLink>

          {token && (
            <>
              <NavLink to="/my-orders" className={({ isActive }) => isActive ? "active" : ""}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <History size={15} /> Đã mua
                </span>
              </NavLink>
              <NavLink to="/profile" className={({ isActive }) => isActive ? "active" : ""}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <User size={15} /> Cá nhân
                </span>
              </NavLink>
              {Number(user.level) === 99 && (
                <NavLink to="/admin" className={({ isActive }) => isActive ? "active" : ""}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--accent-color)", fontWeight: "600" }}>
                    Admin
                  </span>
                </NavLink>
              )}
              {Number(user.level) === 1 && (
                <NavLink to="/ctv" className={({ isActive }) => isActive ? "active" : ""}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--cyan-color)", fontWeight: "600" }}>
                    Cộng tác viên
                  </span>
                </NavLink>
              )}
            </>
          )}
        </nav>

        <div className={`client-actions ${token ? "logged-in" : "logged-out"}`}>
          <ThemeToggle />
          {token ? (
            <>
              <Link to="/profile" className="wallet-display">
                <Wallet size={14} style={{ color: "var(--gold-color)" }} />
                <span>Số dư:</span>
                <strong>{Number(user.money || 0).toLocaleString()}đ</strong>
              </Link>

              <Link to="/profile" className="user-badge" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <User size={16} />
                <span>{user.username}</span>
              </Link>

              {Number(user.level) === 99 && (
                <Link to="/admin" className="btn-outline" style={{ padding: "6px 12px", fontSize: "0.85rem" }}>
                  Admin
                </Link>
              )}

              {Number(user.level) === 1 && (
                <Link to="/ctv" className="btn-outline" style={{ padding: "6px 12px", fontSize: "0.85rem" }}>
                  Cộng tác viên
                </Link>
              )}

              <button onClick={logout} className="logout-link" title="Đăng xuất" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-outline" style={{ padding: "8px 16px" }}>
                Đăng nhập
              </Link>
              <Link to="/register" className="btn-primary" style={{ padding: "8px 16px" }}>
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Mobile Top Bar (logo + user info) — only visible on mobile */}
      <div className="mobile-topbar">
        <Link to="/" className="mobile-topbar-logo">
          {setting.logo ? (
            <img src={setting.logo} alt={setting.ten_web || "Logo"} style={{ maxHeight: "36px", width: "auto" }} />
          ) : (
            <span>🎮 {setting.ten_web || "Shopgameliqi"}</span>
          )}
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <ThemeToggle compact={true} />
          <div className="mobile-topbar-right">
          {token ? (
            <>
              <Link to="/profile" className="mobile-topbar-wallet">
                <Wallet size={13} />
                <span>{Number(user.money || 0).toLocaleString()}đ</span>
              </Link>
              <Link to="/profile" className="mobile-topbar-user">
                <User size={13} />
                <span>{user.username}</span>
              </Link>
              <button onClick={logout} className="mobile-topbar-logout" title="Đăng xuất">
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="mobile-topbar-btn outline">Đăng nhập</Link>
              <Link to="/register" className="mobile-topbar-btn primary">Đăng ký</Link>
            </>
          )}
          </div>
        </div>
      </div>

      {/* Recent Activity Ticker */}
      <RecentPurchases />

      <main style={{ flexGrow: 1 }}>
        <Outlet />
      </main>

      <footer className="client-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3>🎮 {setting.ten_web || "Shopgameliqi"}</h3>
            <p>Hệ thống cung cấp nick Liên Quân Mobile chất lượng cao, an toàn, giao thông tin tự động ngay lập tức sau 2 giây giao dịch.</p>
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

      {/* Floating Contact Widgets (Zalo & Facebook) */}
      <div className="floating-contact-widgets">
        <a 
          href={zaloLink} 
          target="_blank" 
          rel="noreferrer" 
          className="contact-widget-btn widget-zalo" 
          title="Chat Zalo hỗ trợ"
        >
          Zalo
        </a>
        <a 
          href={fbLink} 
          target="_blank" 
          rel="noreferrer" 
          className="contact-widget-btn widget-fb" 
          title="Chat Facebook hỗ trợ"
        >
          <MessageCircle size={22} />
        </a>
      </div>

      {/* Mobile Bottom Navigation Bar */}
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
          <>
            <NavLink to="/my-orders" className={({ isActive }) => isActive ? "mobile-nav-item active" : "mobile-nav-item"}>
              <History size={20} />
              <span>Đã mua</span>
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => isActive ? "mobile-nav-item active" : "mobile-nav-item"}>
              <User size={20} />
              <span>Cá nhân</span>
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/login" className={({ isActive }) => isActive ? "mobile-nav-item active" : "mobile-nav-item"}>
              <User size={20} />
              <span>Đăng nhập</span>
            </NavLink>
          </>
        )}
      </nav>
    </div>
  );
}
