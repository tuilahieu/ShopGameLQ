import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, LogIn, LogOut, User, Wallet, Home, ListFilter, CreditCard, History, Menu, X, Shield, ShieldCheck, Briefcase, FileText, Phone, ChevronDown, ChevronRight, MessageCircle, Flame } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import api from "../api/api";
import ThemeToggle from "../components/ThemeToggle";
import SafeImage from "../components/SafeImage";
import { resolveMediaUrl } from "../utils/mediaUrl";

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
  const [gameCategories, setGameCategories] = useState([]);
  const [flashSaleCount, setFlashSaleCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const drawerRef = useRef(null);
  const drawerTriggerRef = useRef(null);
  const profileMenuRef = useRef(null);
  const profileTriggerRef = useRef(null);
  const categoryMenuRef = useRef(null);

  // Sync favicon if set
  useEffect(() => {
    if (setting.favicon) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = resolveMediaUrl(setting.favicon);
    }
  }, [setting.favicon]);

  // Close drawer upon navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
    if (categoryMenuRef.current) categoryMenuRef.current.open = false;
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement;
    const drawer = drawerRef.current;
    const drawerTrigger = drawerTriggerRef.current;
    const focusableSelector = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";

    document.body.style.overflow = "hidden";
    drawer?.querySelector(focusableSelector)?.focus();

    function handleDrawerKeyDown(event) {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
        return;
      }

      if (event.key !== "Tab" || !drawer) return;
      const focusable = [...drawer.querySelectorAll(focusableSelector)];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleDrawerKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleDrawerKeyDown);
      if (
        previouslyFocused instanceof HTMLElement
        && previouslyFocused !== document.body
        && document.contains(previouslyFocused)
      ) {
        previouslyFocused.focus();
      } else {
        drawerTrigger?.focus();
      }
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isProfileMenuOpen) return undefined;

    function closeProfileMenu(event) {
      if (event.key === "Escape") {
        setIsProfileMenuOpen(false);
        profileTriggerRef.current?.focus();
      }
    }

    function closeOnOutsideClick(event) {
      if (!profileMenuRef.current?.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    }

    document.addEventListener("keydown", closeProfileMenu);
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => {
      document.removeEventListener("keydown", closeProfileMenu);
      document.removeEventListener("pointerdown", closeOnOutsideClick);
    };
  }, [isProfileMenuOpen]);

  useEffect(() => {
    function closeCategoryMenu(event) {
      const menu = categoryMenuRef.current;
      if (!menu?.open) return;
      if (event.type === "keydown" && event.key === "Escape") {
        menu.open = false;
        menu.querySelector("summary")?.focus();
      } else if (event.type === "pointerdown" && !menu.contains(event.target)) {
        menu.open = false;
      }
    }

    document.addEventListener("pointerdown", closeCategoryMenu);
    document.addEventListener("keydown", closeCategoryMenu);
    return () => {
      document.removeEventListener("pointerdown", closeCategoryMenu);
      document.removeEventListener("keydown", closeCategoryMenu);
    };
  }, []);

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
      setFlashSaleCount(Array.isArray(res.data?.data?.flashSaleAccounts) ? res.data.data.flashSaleAccounts.length : 0);
      setGameCategories(Array.isArray(res.data?.data?.categories) ? res.data.data.categories : []);
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
    sessionStorage.removeItem("adminSession");
    navigate("/");
    window.location.reload();
  }

  const zaloLink = setting.sdt_admin ? `https://zalo.me/${setting.sdt_admin.replace(/\D/g, "")}` : "https://zalo.me/0999999999";
  const phoneDisplay = setting.sdt_admin || "099.999.9999";
  const fbLink = setting.fb_admin || "https://m.me/shopgameliqi";

  return (
    <div className="client-page">
      <a className="skip-link" href="#noi-dung-chinh">Bỏ qua điều hướng</a>
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

        <nav className="client-nav" aria-label="Điều hướng chính">
          <NavLink to="/" end className={({ isActive }) => isActive ? "client-nav-link active" : "client-nav-link"}>
            <span>Trang chủ</span>
          </NavLink>
          <details className="client-category-menu" ref={categoryMenuRef}>
            <summary className="client-nav-link">
              <span>Danh mục game</span>
              <ChevronDown size={16} aria-hidden="true" />
            </summary>
            <div className="client-category-popover">
              <Link to="/accounts" onClick={() => { categoryMenuRef.current.open = false; }}>Tất cả tài khoản <ArrowRight size={15} aria-hidden="true" /></Link>
              {gameCategories.map((category) => (
                <Link to={`/accounts?danhmuc_id=${category.id}`} key={category.id} onClick={() => { categoryMenuRef.current.open = false; }}>
                  {category.name}<ChevronRight size={15} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </details>

          {token && (
            <NavLink to="/my-orders" className={({ isActive }) => isActive ? "client-nav-link active" : "client-nav-link"}>
              <History size={15} />
              <span>Đã mua</span>
            </NavLink>
          )}
          <NavLink to="/contact" className={({ isActive }) => isActive ? "client-nav-link active" : "client-nav-link"}>
            <span>Liên hệ</span>
          </NavLink>
        </nav>

        <div className={`client-actions ${token ? "logged-in" : "logged-out"}`}>
          <Link to="/nap-tien" className="client-recharge-button"><span className="client-recharge-icon">₫</span> Nạp tiền</Link>
          {token ? (
            <>
              <Link
                to="/profile"
                className="wallet-display"
                title="Mở hồ sơ cá nhân"
                aria-label={`Mở hồ sơ cá nhân, số dư ${Number(user.money || 0).toLocaleString()} đồng`}
              >
                <Wallet size={14} style={{ color: "var(--gold-color)", flexShrink: 0 }} />
                <span>Hồ sơ · Số dư:</span>
                <strong>{Number(user.money || 0).toLocaleString()}đ</strong>
              </Link>

              <div className="client-profile-menu" ref={profileMenuRef}>
                <button
                  type="button"
                  ref={profileTriggerRef}
                  className="user-badge client-profile-trigger"
                  aria-expanded={isProfileMenuOpen}
                  aria-controls="desktop-profile-menu"
                  onClick={() => setIsProfileMenuOpen((open) => !open)}
                >
                  <User size={15} aria-hidden="true" />
                  <span>{user.username || "Tài khoản"}</span>
                  <ChevronDown size={14} aria-hidden="true" />
                </button>
                {isProfileMenuOpen && (
                  <div id="desktop-profile-menu" className="client-profile-popover">
                    <nav aria-label="Tài khoản và quản trị">
                      <Link to="/profile"><User size={17} aria-hidden="true" /> Hồ sơ cá nhân</Link>
                      {Number(user.level) === 99 && (
                        <Link to="/admin" className="role-link"><Shield size={17} aria-hidden="true" /> Quản trị hệ thống</Link>
                      )}
                      {Number(user.level) === 1 && (
                        <Link to="/ctv" className="role-link"><Briefcase size={17} aria-hidden="true" /> Khu vực CTV</Link>
                      )}
                    </nav>
                    <div className="client-profile-theme">
                      <span>Giao diện</span>
                      <ThemeToggle />
                    </div>
                    <button type="button" className="client-profile-logout" onClick={logout}>
                      <LogOut size={17} aria-hidden="true" /> Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <ThemeToggle compact={true} />
              <Link to="/login" className="client-auth-link"><User size={19} aria-hidden="true" /><span>Đăng nhập / Đăng ký</span></Link>
            </>
          )}
        </div>
      </header>

      {/* Mobile Top Bar (sticky on mobile) */}
      <div className="mobile-topbar">
        <div className="mobile-topbar-left">
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
            <Link
              to="/profile"
              className="mobile-topbar-account"
              aria-label={`Mở hồ sơ cá nhân, số dư ${Number(user.money || 0).toLocaleString()} đồng`}
            >
              <User size={18} aria-hidden="true" />
              <span className="mobile-topbar-account-copy">
                <small>Hồ sơ của tôi</small>
                <strong>{Number(user.money || 0).toLocaleString()}đ</strong>
              </span>
              <ChevronRight size={16} aria-hidden="true" />
            </Link>
          ) : (
            <div className="mobile-topbar-guest">
              <ThemeToggle compact={true} />
              <Link to="/login" className="mobile-topbar-login-btn">
                <LogIn size={14} />
                <span>Đăng nhập</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {flashSaleCount > 0 && (
        <Link
          to={{ pathname: "/", hash: "#flash-sale-title" }}
          className="flash-sale-ticker"
          aria-label={`Flash Sale đang diễn ra với ${flashSaleCount} tài khoản giảm giá. Xem ngay.`}
        >
          <span className="flash-sale-ticker-viewport">
            <span className="flash-sale-ticker-track">
              <span className="flash-sale-ticker-message">
                <Flame size={16} aria-hidden="true" />
                FLASH SALE: CÓ {flashSaleCount} TÀI KHOẢN ĐANG GIẢM GIÁ · XEM NGAY
              </span>
              <span className="flash-sale-ticker-message" aria-hidden="true">
                <Flame size={16} />
                FLASH SALE: CÓ {flashSaleCount} TÀI KHOẢN ĐANG GIẢM GIÁ · XEM NGAY
              </span>
            </span>
          </span>
        </Link>
      )}

      {/* Mobile Slide-Out Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setIsMobileMenuOpen(false)}>
          <aside
            id="mobile-account-drawer"
            ref={drawerRef}
            className="mobile-drawer-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-drawer-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-drawer-header">
              <strong id="mobile-drawer-title">Menu & Tài khoản</strong>
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
                  <h4>{user.username || "Tài khoản"}</h4>
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
                <Link to="/login" className="btn-outline">
                  Đăng nhập
                </Link>
                <Link to="/register" className="btn-primary">
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
              {gameCategories.map((category) => (
                <NavLink to={`/accounts?danhmuc_id=${category.id}`} className="mobile-drawer-link mobile-drawer-category" key={category.id} onClick={() => setIsMobileMenuOpen(false)}>
                  <ChevronRight size={17} aria-hidden="true" />
                  <span>{category.name}</span>
                </NavLink>
              ))}

              <NavLink to="/nap-tien" className={({ isActive }) => isActive ? "mobile-drawer-link active" : "mobile-drawer-link"}>
                <CreditCard size={18} />
                <span>Nạp tiền ví</span>
              </NavLink>

              {token && (
                <>
                  <NavLink to="/my-orders" className={({ isActive }) => isActive ? "mobile-drawer-link active" : "mobile-drawer-link"}>
                    <History size={18} />
                    <span>Đơn hàng đã mua</span>
                  </NavLink>

                  <NavLink to="/profile" className={({ isActive }) => isActive ? "mobile-drawer-link active" : "mobile-drawer-link"}>
                    <User size={18} />
                    <span>Hồ sơ cá nhân</span>
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

              {token && (
                <button type="button" className="mobile-drawer-link logout" onClick={logout}>
                  <LogOut size={18} />
                  <span>Đăng xuất</span>
                </button>
              )}
            </div>

            <div className="mobile-drawer-footer">
              <div className="mobile-drawer-theme-box">
                <span>Chủ đề hiển thị</span>
                <ThemeToggle />
              </div>
              {token && (
                <button type="button" className="mobile-drawer-logout-btn" onClick={logout}>
                  <LogOut size={18} />
                  <span>Đăng xuất tài khoản</span>
                </button>
              )}
            </div>
          </aside>
        </div>
      )}

      <main id="noi-dung-chinh" tabIndex={-1} style={{ flexGrow: 1 }}>
        <Outlet />
      </main>

      <footer className="client-footer">
        <div className="footer-mobile">
          <div className="footer-mobile-intro">
            <h2>Cần hỗ trợ mua acc?</h2>
            <p>Nhắn shop khi cần tư vấn hoặc hỗ trợ đơn hàng.</p>
          </div>

          <div className="footer-mobile-actions">
            <a className="footer-mobile-action is-primary" href={zaloLink} target="_blank" rel="noreferrer">
              <MessageCircle size={19} aria-hidden="true" />
              <span>
                <strong>Chat Zalo</strong>
                <small>{phoneDisplay}</small>
              </span>
            </a>
            <Link className="footer-mobile-action" to="/contact">
              <Phone size={19} aria-hidden="true" />
              <span>
                <strong>Liên hệ shop</strong>
                <small>Hỗ trợ đơn hàng</small>
              </span>
            </Link>
          </div>

          <div className="footer-mobile-assurance">
            <ShieldCheck size={18} aria-hidden="true" />
            <span><strong>MUA ACC MINH BẠCH</strong> · Nhận thông tin sau khi thanh toán thành công.</span>
          </div>

          <Link className="footer-mobile-policy" to="/terms">
            <FileText size={18} aria-hidden="true" />
            <span>Điều khoản &amp; bảo hành</span>
            <ChevronRight size={17} aria-hidden="true" />
          </Link>
        </div>

        <div className="footer-grid footer-desktop">
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
          <div className="footer-links footer-assurance">
            <h4>MUA ACC MINH BẠCH</h4>
            <p>Thông tin tài khoản chỉ hiển thị sau khi thanh toán thành công.</p>
            <Link to="/terms">Xem điều khoản &amp; bảo hành</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <div>© {new Date().getFullYear()} {setting.ten_web || "Shopgameliqi"}</div>
          <div className="footer-bottom-rights">Hệ thống bán tài khoản game tự động · All rights reserved.</div>
        </div>
      </footer>

      {/* Floating Mobile Bottom Navigation Dock (Luôn luôn nổi lên trên cùng) */}
      <nav className="mobile-bottom-nav" aria-label="Điều hướng chính trên di động">
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
          ref={drawerTriggerRef}
          className={`mobile-nav-item ${isMobileMenuOpen ? "active" : ""}`}
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label={token ? "Mở tài khoản và hỗ trợ" : "Mở menu"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-account-drawer"
        >
          {token ? <User size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          <span>{token ? "Tôi" : "Menu"}</span>
        </button>
      </nav>
    </div>
  );
}
