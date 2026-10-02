import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, LogIn, LogOut, User, Wallet, Home, ListFilter, CreditCard, History, Menu, X, Shield, Briefcase, FileText, Phone, Mail, ChevronDown, ChevronRight, Flame, Gamepad2 } from "lucide-react";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import api from "../api/api";
import ThemeToggle from "../components/ThemeToggle";
import SafeImage from "../components/SafeImage";
import AppLoader from "../components/AppLoader";
import { resolveMediaUrl } from "../utils/mediaUrl";
import { getSupportContacts } from "../utils/supportContacts";
import { readStoredJson } from "../utils/storage";
import { formatNumber, formatVnd } from "../utils/formatters";
import useMotionReveal from "../hooks/useMotionReveal";
import ShopAssistant from "../components/ShopAssistant";
import SiteBrand, { BrandWordmark } from "../components/client/SiteBrand";

export default function ClientLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem("accessToken");
  const [user, setUser] = useState(() => readStoredJson("user", {}));
  const [setting, setSetting] = useState(() => readStoredJson("setting", {}));
  const [gameCategories, setGameCategories] = useState([]);
  const [accountTypes, setAccountTypes] = useState([]);
  const [flashSaleCount, setFlashSaleCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileMenuRendered, setIsMobileMenuRendered] = useState(false);
  const [isMobileMenuClosing, setIsMobileMenuClosing] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isDemoNoticeVisible, setIsDemoNoticeVisible] = useState(true);
  const drawerRef = useRef(null);
  const drawerTriggerRef = useRef(null);
  const profileMenuRef = useRef(null);
  const profileTriggerRef = useRef(null);
  const categoryMenuRef = useRef(null);
  const mainRef = useRef(null);
  const routeKey = `${location.pathname}${location.search}`;

  useMotionReveal(mainRef, routeKey);

  useEffect(() => {
    if (isMobileMenuOpen) {
      setIsMobileMenuRendered(true);
      setIsMobileMenuClosing(false);
      return undefined;
    }
    if (!isMobileMenuRendered) return undefined;
    setIsMobileMenuClosing(true);
    const timer = window.setTimeout(() => {
      setIsMobileMenuRendered(false);
      setIsMobileMenuClosing(false);
    }, 190);
    return () => window.clearTimeout(timer);
  }, [isMobileMenuOpen, isMobileMenuRendered]);

  useEffect(() => {
    if (!location.hash) return undefined;
    const timer = window.setTimeout(() => {
      document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [location.hash, location.pathname]);

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
  const fetchProfile = useCallback(async () => {
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
  }, [token]);

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
      setAccountTypes(Array.isArray(res.data?.data?.accountTypes) ? res.data.data.accountTypes : []);
    } catch (err) {
      console.error("Failed to sync settings:", err);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, [location.pathname, fetchProfile]);

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

  const { zaloLink, phoneDisplay, facebookLink } = getSupportContacts(setting);
  const isHome = location.pathname === "/";
  const cheapAccountsCategory = gameCategories.find((category) => (
    category.name?.trim().toLocaleUpperCase("vi-VN") === "ACC GIÁ RẺ"
  ));
  const cheapAccountsCategoryId = String(cheapAccountsCategory?.id || 1);
  const cheapAccountsHref = `/accounts?danhmuc_id=${cheapAccountsCategoryId}`;
  const isSaleActive = location.pathname === "/accounts"
    && new URLSearchParams(location.search).get("danhmuc_id") === cheapAccountsCategoryId;
  const isCatalogActive = location.pathname === "/accounts" && !isSaleActive;

  return (
    <div className={`client-page${isHome ? " is-home" : ""}`}>
      <a className="skip-link" href="#noi-dung-chinh">Bỏ qua điều hướng</a>
      {isHome && isDemoNoticeVisible && (
        <aside className="client-demo-notice" aria-label="Thông báo website demo">
          <span className="client-demo-notice-dot" aria-hidden="true" />
          <strong>Đây chỉ là sản phẩm demo, không phải nơi bán tài khoản / vật phẩm ảo.</strong>
          <button type="button" onClick={() => setIsDemoNoticeVisible(false)} aria-label="Đóng thông báo demo">
            <X size={19} aria-hidden="true" />
          </button>
        </aside>
      )}
      <header className="client-header">
        <Link to="/" className="client-logo">
          <SiteBrand setting={setting} />
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
          <NavLink to="/nap-tien" className={({ isActive }) => isActive ? "client-nav-link active" : "client-nav-link"}>
            <CreditCard size={15} aria-hidden="true" />
            <span>Nạp tiền</span>
          </NavLink>
        </nav>

        <div className={`client-actions ${token ? "logged-in" : "logged-out"}`}>
          {token ? (
            <>
              <Link
                to="/profile"
                className="wallet-display"
                title="Mở hồ sơ cá nhân"
                aria-label={`Mở hồ sơ cá nhân, số dư ${formatNumber(user.money || 0)} đồng`}
              >
                <Wallet size={14} style={{ color: "var(--gold-color)", flexShrink: 0 }} />
                <span>Hồ sơ · Số dư:</span>
                <strong>{formatVnd(user.money || 0)}</strong>
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
                    <div className="client-profile-summary">
                      <span className="client-profile-avatar" aria-hidden="true">{String(user.username || "T").charAt(0).toUpperCase()}</span>
                      <span className="client-profile-identity">
                        <strong>{user.username || "Tài khoản"}</strong>
                        <small>{Number(user.level) === 99 ? "Quản trị viên" : Number(user.level) === 1 ? "Cộng tác viên" : "Khách hàng"}</small>
                      </span>
                      <span className="client-profile-balance"><Wallet size={14} aria-hidden="true" /><strong>{formatVnd(user.money || 0)}</strong></span>
                    </div>
                    <nav aria-label="Tài khoản và quản trị">
                      <Link to="/profile"><span className="client-profile-link-icon"><User size={17} aria-hidden="true" /></span><span className="client-profile-link-copy"><strong>Hồ sơ cá nhân</strong><small>Thông tin, số dư và bảo mật</small></span><ChevronRight size={16} aria-hidden="true" /></Link>
                      {Number(user.level) === 99 && (
                        <Link to="/admin" className="role-link"><span className="client-profile-link-icon"><Shield size={17} aria-hidden="true" /></span><span className="client-profile-link-copy"><strong>Quản trị hệ thống</strong><small>Vận hành cửa hàng</small></span><ChevronRight size={16} aria-hidden="true" /></Link>
                      )}
                      {Number(user.level) === 1 && (
                        <Link to="/ctv" className="role-link"><span className="client-profile-link-icon"><Briefcase size={17} aria-hidden="true" /></span><span className="client-profile-link-copy"><strong>Khu vực CTV</strong><small>Quản lý tài khoản đăng bán</small></span><ChevronRight size={16} aria-hidden="true" /></Link>
                      )}
                    </nav>
                    <div className="client-profile-theme">
                      <span><strong>Giao diện</strong><small>Đổi chế độ hiển thị</small></span>
                      <ThemeToggle />
                    </div>
                    <button type="button" className="client-profile-logout" onClick={logout}>
                      <LogOut size={17} aria-hidden="true" /><span>Đăng xuất</span>
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
                loading="eager"
                style={{ maxHeight: "30px" }}
                fallbackLabel={setting.ten_web || "Cửa hàng"}
              />
            ) : (
              <BrandWordmark name={setting.ten_web} />
            )}
          </Link>
        </div>

        <div className="mobile-topbar-right">
          {token ? (
            <Link
              to="/profile"
              className="mobile-topbar-account"
              aria-label={`Mở hồ sơ cá nhân, số dư ${formatNumber(user.money || 0)} đồng`}
            >
              <span className="mobile-topbar-avatar" aria-hidden="true">
                <User size={16} />
              </span>
              <span className="mobile-topbar-account-copy">
                <strong>{user.username || "Tài khoản"}</strong>
                <small>Số dư · {formatVnd(user.money || 0)}</small>
              </span>
              <span className="mobile-topbar-account-arrow" aria-hidden="true">
                <ChevronRight size={14} />
              </span>
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
      {isMobileMenuRendered && (
        <div className={`mobile-drawer-backdrop${isMobileMenuClosing ? " is-closing" : ""}`} onClick={() => setIsMobileMenuOpen(false)}>
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
                    <span>Số dư: <strong>{formatVnd(user.money || 0)}</strong></span>
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

            <div
              className="mobile-drawer-nav"
              onClick={(event) => {
                if (event.target.closest("a[href]")) setIsMobileMenuOpen(false);
              }}
            >
              <NavLink to="/" end className={({ isActive }) => isActive ? "mobile-drawer-link active" : "mobile-drawer-link"}>
                <Home size={18} />
                <span>Trang chủ</span>
              </NavLink>

              <NavLink to="/accounts" className={({ isActive }) => isActive ? "mobile-drawer-link active" : "mobile-drawer-link"}>
                <ListFilter size={18} />
                <span>Kho tài khoản</span>
              </NavLink>
              {gameCategories.length > 0 && (
                <details className="mobile-drawer-categories">
                  <summary className="mobile-drawer-link">
                    <Gamepad2 size={18} aria-hidden="true" />
                    <span>Danh mục game</span>
                    <small>{gameCategories.length}</small>
                    <ChevronDown size={17} aria-hidden="true" />
                  </summary>
                  <div className="mobile-drawer-category-list">
                    {gameCategories.map((category) => (
                      <NavLink to={`/accounts?danhmuc_id=${category.id}`} className="mobile-drawer-link mobile-drawer-category" key={category.id} onClick={() => setIsMobileMenuOpen(false)}>
                        <ChevronRight size={17} aria-hidden="true" />
                        <span>{category.name}</span>
                      </NavLink>
                    ))}
                  </div>
                </details>
              )}

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

            </div>

            <div className="mobile-drawer-footer">
              <div className="mobile-drawer-theme-box">
                <span>Chủ đề hiển thị</span>
                <ThemeToggle />
              </div>
              {token && (
                <button type="button" className="mobile-drawer-logout-btn" onClick={logout}>
                  <LogOut size={18} />
                  <span>Đăng xuất</span>
                </button>
              )}
            </div>
          </aside>
        </div>
      )}

      <main ref={mainRef} id="noi-dung-chinh" tabIndex={-1} style={{ flexGrow: 1 }}>
        <div className="client-route-stage" key={routeKey}>
          <Suspense fallback={<AppLoader inline />}><Outlet /></Suspense>
        </div>
      </main>

      <footer className="client-footer">
        <div className="client-footer-inner">
          <div className="client-footer-grid">
            <section className="client-footer-brand" aria-label="Giới thiệu cửa hàng">
              <Link to="/" className="client-footer-logo" aria-label={`Về trang chủ ${setting.ten_web || "Shop Game"}`}>
                {setting.logo ? (
                  <SafeImage src={setting.logo} alt={`Logo ${setting.ten_web || "Shop Game"}`} width={176} height={52} loading="lazy" fallbackLabel={setting.ten_web || "Shop Game"} />
                ) : (
                  <BrandWordmark name={setting.ten_web} />
                )}
              </Link>
              <p>Shop nick game tự động – Kho tài khoản đa dạng, giá tốt mỗi ngày, giao dịch nhanh chóng, an toàn và hỗ trợ khách hàng 24/7.</p>
            </section>

            <nav className="client-footer-column client-footer-about" aria-label="Về chúng tôi">
              <h2>Về Chúng Tôi</h2>
              <ul>
                <li><Link to="/">Trang chủ</Link></li>
                <li><Link to="/accounts">Kho tài khoản</Link></li>
                <li><Link to="/terms">Điều khoản &amp; bảo hành</Link></li>
                <li><Link to="/contact">Liên hệ hỗ trợ</Link></li>
              </ul>
            </nav>

            <nav className="client-footer-column client-footer-services" aria-label="Dịch vụ khác">
              <h2>Dịch Vụ Khác</h2>
              <ul>
                {accountTypes.slice(0, 5).map((type) => (
                  <li key={type.id}><Link to={`/accounts?loai_id=${type.id}`}>{type.name}</Link></li>
                ))}
                {accountTypes.length === 0 && <li><Link to="/accounts">Xem toàn bộ tài khoản</Link></li>}
              </ul>
            </nav>

            <section className="client-footer-column client-footer-contact" aria-label="Liên hệ và kết nối">
              <h2>Liên Hệ &amp; Kết Nối</h2>
              <div className="client-footer-contact-list">
                {phoneDisplay && <a href={`tel:${phoneDisplay.replace(/\D/g, "")}`}><Phone size={17} aria-hidden="true" /><span>Hotline: {phoneDisplay}</span></a>}
                {setting.email && <a href={`mailto:${setting.email}`}><Mail size={17} aria-hidden="true" /><span>Email: {setting.email}</span></a>}
                {!phoneDisplay && !setting.email && <Link to="/contact">Thông tin liên hệ đang được cập nhật</Link>}
              </div>
              <a className="client-footer-zalo" href={zaloLink || "/contact"} target={zaloLink ? "_blank" : undefined} rel={zaloLink ? "noreferrer" : undefined}>
                <img src="/storefront/zalo-contact.webp" alt="" width="36" height="36" loading="lazy" />
                <span>ZALO</span>
              </a>
              {facebookLink && <a className="client-footer-facebook" href={facebookLink} target="_blank" rel="noreferrer">Facebook Messenger</a>}
            </section>
          </div>

          <div className="client-footer-bottom">
            © {new Date().getFullYear()} {setting.ten_web || "Shop Nick Game"}. All rights reserved.
          </div>
        </div>
      </footer>

      <ShopAssistant profile={{ name: setting.assistant_name, avatar: setting.assistant_avatar }} />

      {/* Floating Mobile Bottom Navigation Dock (Luôn luôn nổi lên trên cùng) */}
      <nav className="mobile-bottom-nav" aria-label="Điều hướng chính trên di động">
        <NavLink to="/" end className={({ isActive }) => isActive ? "mobile-nav-item active" : "mobile-nav-item"}>
          <Home size={20} />
          <span>Trang chủ</span>
        </NavLink>
        
        <Link
          to="/accounts"
          className={`mobile-nav-item${isCatalogActive ? " active" : ""}`}
          aria-current={isCatalogActive ? "page" : undefined}
        >
          <ListFilter size={20} />
          <span>Kho acc</span>
        </Link>
        
        <Link
          to={cheapAccountsHref}
          className={`mobile-nav-item mobile-sale-item${isSaleActive ? " active" : ""}`}
          aria-current={isSaleActive ? "page" : undefined}
          aria-label="Xem danh mục tài khoản giá rẻ"
        >
          <span className="mobile-sale-icon">
            <Flame size={21} aria-hidden="true" />
            {flashSaleCount > 0 && <b>{flashSaleCount > 9 ? "9+" : flashSaleCount}</b>}
          </span>
          <span>Sale</span>
        </Link>

        <NavLink to="/nap-tien" className={({ isActive }) => isActive ? "mobile-nav-item active" : "mobile-nav-item"}>
          <CreditCard size={20} />
          <span>Nạp tiền</span>
        </NavLink>

        <button
          type="button"
          ref={drawerTriggerRef}
          className={`mobile-nav-item ${isMobileMenuOpen ? "active" : ""}`}
          onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
          aria-label={token ? "Mở tài khoản và hỗ trợ" : "Mở menu"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-account-drawer"
        >
          {token ? <User size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          <span>{token ? "Tài khoản" : "Menu"}</span>
        </button>
      </nav>
    </div>
  );
}
