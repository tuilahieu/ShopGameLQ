import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/api";
import { ArrowRight, Bell, Clock, CreditCard, Flame, Gamepad2, Headphones, ShieldCheck, Zap } from "lucide-react";
import { updateSEO } from "../../utils/seo";
import AccountCard from "../../components/AccountCard";
import SafeImage from "../../components/SafeImage";
import Modal from "../../components/Modal";
import RecentPurchases from "../../components/RecentPurchases";
import { resolveAccountTypeImage, resolveStorefrontHero } from "../../utils/storefrontAssets";

function SaleCountdown({ endTimes, onExpired }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const endTime = Math.min(...endTimes.filter((value) => value > Date.now()));
    if (!Number.isFinite(endTime)) {
      setTimeLeft("Đã kết thúc");
      return undefined;
    }

    let hasExpired = false;
    const updateTimer = () => {
      const diff = endTime - Date.now();
      if (diff <= 0) {
        setTimeLeft("Đã kết thúc");
        if (!hasExpired) {
          hasExpired = true;
          onExpired();
        }
        return true;
      }

      const hours = Math.floor(diff / 3_600_000);
      const minutes = Math.floor((diff % 3_600_000) / 60_000);
      const seconds = Math.floor((diff % 60_000) / 1_000);
      setTimeLeft(`${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`);
      return false;
    };

    if (updateTimer()) return undefined;
    const intervalId = window.setInterval(() => {
      if (updateTimer()) window.clearInterval(intervalId);
    }, 1_000);
    return () => window.clearInterval(intervalId);
  }, [endTimes, onExpired]);

  return <div className="flash-sale-timer" aria-live="polite">Kết thúc sau <span>{timeLeft || "--:--:--"}</span></div>;
}

export default function Home() {
  const [data, setData] = useState({
    categories: [],
    accountTypes: [],
    latestAccounts: [],
    totalAccounts: 0,
    flashSaleAccounts: [],
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showNoticeModal, setShowNoticeModal] = useState(false);

  async function loadHome() {
    setLoadError("");
    try {
      const res = await api.get("/home");
      setData(res.data.data);
      if (res.data.data?.setting?.thongbao) {
        const hideUntil = Number(localStorage.getItem("hide_notice_until") || 0);
        if (Date.now() >= hideUntil) {
          setShowNoticeModal(true);
        }
      }
    } catch (error) {
      console.error(error);
      setLoadError(error.response?.data?.message || "Không thể tải dữ liệu cửa hàng.");
    } finally {
      setLoading(false);
    }
  }

  function handleCloseNotice() {
    setShowNoticeModal(false);
  }

  function handleHideNotice1Hour() {
    localStorage.setItem("hide_notice_until", String(Date.now() + 60 * 60 * 1000));
    setShowNoticeModal(false);
  }

  useEffect(() => {
    loadHome();
    updateSEO({
      title: "Trang chủ - Mua Bán Acc Game Uy Tín, Giá Rẻ",
      description: "Hệ thống cung cấp nick Liên Quân Mobile chất lượng cao, an toàn, giao thông tin tự động ngay lập tức sau 2 giây giao dịch.",
      keywords: "shop acc, mua acc game, shop lien quan, acc lien quan tu chon, shop acc gia re"
    });
  }, []);

  const saleEndTimes = (data.flashSaleAccounts || [])
      .map((account) => new Date(account.sale_detail?.ketthuc).getTime())
      .filter((endTime) => Number.isFinite(endTime));

  const categorySections = (data.categories || [])
    .filter((category) => Number(category.status) === 1)
    .map((category) => ({
      ...category,
      types: (data.accountTypes || []).filter((type) =>
        Number(type.status) === 1 && Number(type.danhmuc_id) === Number(category.id)),
    }));
  const heroImage = resolveStorefrontHero(data.setting?.banner);

  if (loading) {
    return (
      <div className="page-container catalogue-skeleton" aria-busy="true" aria-label="Đang tải cửa hàng">
        <div className="skeleton-banner" />
        <div className="skeleton-heading" />
        <div className="skeleton-grid">{Array.from({ length: 6 }, (_, index) => <div className="skeleton-card" key={index} />)}</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="page-container empty-state">
        <h1 className="page-title">Không thể tải cửa hàng</h1>
        <p>{loadError}</p>
        <button className="btn-primary" onClick={loadHome}>Tải lại</button>
      </div>
    );
  }

  return (
    <div className="page-container home storefront-home">
      <div className="storefront-hero-stack">
        <section className="storefront-hero" aria-labelledby="home-hero-title">
          <div className="storefront-hero-copy">
            <span className="storefront-eyebrow">
              <Gamepad2 size={17} aria-hidden="true" />
              {Number(data.totalAccounts || 0).toLocaleString()} tài khoản đang bán
            </span>
            <h1 id="home-hero-title">
              <span className="storefront-title-mobile">
                Còn {Number(data.totalAccounts || 0).toLocaleString()} tài khoản đang bán
              </span>
              <span className="storefront-title-desktop">Chọn acc hợp gu, nhận thông tin ngay</span>
            </h1>
            <p>Xem rõ hình ảnh, thông tin và giá trước khi mua. Thao tác gọn trên điện thoại.</p>
            <div className="storefront-hero-actions">
              <Link to="/accounts" className="btn-primary storefront-primary-cta">
                Chọn tài khoản <ArrowRight size={19} aria-hidden="true" />
              </Link>
              <Link to="/nap-tien" className="btn-outline storefront-secondary-cta">
                <CreditCard size={18} aria-hidden="true" /> Nạp tiền
              </Link>
            </div>
          </div>

          <div className="storefront-hero-media">
            {heroImage ? (
              <SafeImage
                src={heroImage}
                alt={`Banner ${data.setting?.ten_web || "cửa hàng tài khoản game"}`}
                width={1600}
                height={900}
                fetchPriority="high"
                decoding="async"
                fallbackLabel="Ảnh giới thiệu cửa hàng"
              />
            ) : (
              <div className="home-banner-placeholder">
                <Gamepad2 size={42} aria-hidden="true" />
                <p>{data.setting?.ten_web || "Shop Game"}</p>
                <small>Kho tài khoản được cập nhật thường xuyên.</small>
              </div>
            )}
          </div>
        </section>

        {data.setting?.thongbao && (
          <button
            type="button"
            className="storefront-notice-trigger"
            onClick={() => setShowNoticeModal(true)}
          >
            <div className="storefront-notice-trigger-left">
              <Bell size={16} aria-hidden="true" />
              <span>Thông báo cửa hàng</span>
            </div>
            <span className="storefront-notice-trigger-right">
              Xem chi tiết &gt;
            </span>
          </button>
        )}

        {/* Simulated recent-purchase feed; it deliberately does not query order records. */}
        <RecentPurchases />
      </div>

      {/* Store Notice Popup Modal */}
      {data.setting?.thongbao && (
        <Modal
          isOpen={showNoticeModal}
          onClose={handleCloseNotice}
          title="Thông báo cửa hàng"
          className="notice-popup-modal"
          footer={
            <div className="notice-popup-footer">
              <button
                type="button"
                className="btn-outline notice-snooze-btn"
                onClick={handleHideNotice1Hour}
              >
                <Clock size={15} />
                <span>Tắt trong 1h</span>
              </button>
              <button
                type="button"
                className="btn-primary notice-dismiss-btn"
                onClick={handleCloseNotice}
              >
                Đã hiểu
              </button>
            </div>
          }
        >
          <div className="notice-popup-body">
            <div className="notice-popup-badge">
              <Bell size={26} />
            </div>
            <div className="notice-popup-lines">
              {data.setting.thongbao.split("\n").filter((line) => line.trim()).map((line, index) => (
                <p key={index}>{line.trim()}</p>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {data.flashSaleAccounts && data.flashSaleAccounts.length > 0 && (
        <section className="flash-sale-section storefront-section" aria-labelledby="flash-sale-title">
          <div className="flash-sale-header">
            <h2 className="flash-sale-title" id="flash-sale-title">
              <Flame size={28} style={{ color: "var(--accent-color)", fill: "var(--accent-color)" }} />
              Flash sale đang diễn ra
            </h2>
            <SaleCountdown endTimes={saleEndTimes} onExpired={loadHome} />
          </div>
          <div className={`account-grid flash-sale-account-grid ${data.flashSaleAccounts.length === 1 ? "is-single" : "is-multiple"}`}>
            {data.flashSaleAccounts.map((acc, index) => (
              <AccountCard key={acc.id} acc={acc} priority={index < 2} className="flash-sale-account-card" />
            ))}
          </div>
        </section>
      )}

      {categorySections.map((category) => (
        <section className="storefront-section storefront-game-section" id={`game-category-${category.id}`} aria-labelledby={`game-category-title-${category.id}`} key={category.id}>
          <div className="storefront-game-heading">
            <div>
              <h2 id={`game-category-title-${category.id}`}><Flame size={25} aria-hidden="true" /> {category.name}</h2>
              <p>{category.noidung?.trim() || `${category.types.length} loại tài khoản đang được giới thiệu`}</p>
            </div>
            <Link to={`/accounts?danhmuc_id=${category.id}`} className="storefront-game-explore">
              Khám phá <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>

          {category.types.length > 0 ? (
            <div className="storefront-category-grid">
              {category.types.map((type) => {
                const count = Number(data.accountCountByType?.[type.id] ?? 0);
                return (
                  <Link to={`/accounts?loai_id=${type.id}`} className="storefront-category-card" key={type.id}>
                    <div className="storefront-category-media">
                      <SafeImage
                        src={resolveAccountTypeImage(type)}
                        alt={`Ảnh ${type.name}`}
                        width={960}
                        height={600}
                        loading="lazy"
                        decoding="async"
                        fallbackLabel="Ảnh danh mục"
                      />
                    </div>
                    <div className="storefront-category-copy">
                      <h3>{type.name}</h3>
                      <p>Tài khoản hiện có: <strong>{count.toLocaleString("vi-VN")}</strong></p>
                      <span className="storefront-category-action">Xem tài khoản <ArrowRight size={16} aria-hidden="true" /></span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="storefront-game-empty">Danh mục đang được cập nhật tài khoản.</p>
          )}
        </section>
      ))}

      {(data.latestAccounts || []).length > 0 && (
        <section className="storefront-section" aria-labelledby="latest-accounts-title">
          <div className="storefront-section-heading">
            <div>
              <span className="storefront-section-kicker">Vừa lên kho</span>
              <h2 id="latest-accounts-title">Acc mới cập nhật</h2>
            </div>
            <Link to="/accounts" className="storefront-text-link">Xem toàn bộ <ArrowRight size={17} aria-hidden="true" /></Link>
          </div>
          <div className="account-grid storefront-latest-grid">
            {data.latestAccounts.map((acc, index) => (
              <AccountCard key={acc.id} acc={acc} priority={index < 2} />
            ))}
          </div>
        </section>
      )}

      <section className="storefront-trust" aria-label="Cam kết mua hàng">
        <Link to="/terms" className="storefront-trust-item">
          <ShieldCheck size={22} aria-hidden="true" />
          <span><strong>Thông tin rõ ràng</strong><small>Xem kỹ ảnh và mô tả trước khi mua</small></span>
        </Link>
        <Link to="/my-orders" className="storefront-trust-item">
          <Zap size={22} aria-hidden="true" />
          <span><strong>Giao tự động</strong><small>Nhận acc sau khi thanh toán thành công</small></span>
        </Link>
        <Link to="/contact" className="storefront-trust-item">
          <Headphones size={22} aria-hidden="true" />
          <span><strong>Cần hỗ trợ?</strong><small>Liên hệ shop khi gặp vấn đề</small></span>
        </Link>
      </section>
    </div>
  );
}
