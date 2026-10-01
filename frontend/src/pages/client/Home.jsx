import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/api";
import { ArrowRight, ArrowUpRight, Bell, ChevronLeft, ChevronRight, Clock, Flame, Gamepad2, Headphones, Megaphone, ShieldCheck, Zap } from "lucide-react";
import AccountCard from "../../components/AccountCard";
import SafeImage from "../../components/SafeImage";
import Modal from "../../components/Modal";
import RecentPurchases from "../../components/RecentPurchases";
import SkeletonLoading from "../../components/SkeletonLoading";
import { resolveAccountTypeImage, resolveStorefrontHero } from "../../utils/storefrontAssets";
import usePageSeo from "../../hooks/usePageSeo";
import { formatNumber } from "../../utils/formatters";
import { getApiErrorMessage } from "../../utils/apiError";

function parseStoreNotice(rawText) {
  if (!rawText || typeof rawText !== "string") {
    return { textLines: [], zaloLinks: [] };
  }

  const lines = rawText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const textLines = [];
  const rawZaloEntries = [];
  const zaloUrlRegex = /(https?:\/\/)?(zalo\.me\/(?:g\/)?[a-zA-Z0-9_\-./]+)/i;

  for (const line of lines) {
    const match = line.match(zaloUrlRegex);
    if (match) {
      const matchedUrl = match[0];
      const fullUrl = matchedUrl.startsWith("http") ? matchedUrl : `https://${matchedUrl}`;
      const isGroup = matchedUrl.includes("zalo.me/g/");
      const label = line.replace(zaloUrlRegex, "").replace(/^[->:\s|]+|[->:\s|]+$/g, "").trim();
      rawZaloEntries.push({ matchedUrl, fullUrl, isGroup, label });
    } else {
      textLines.push(line);
    }
  }

  const totalGroups = rawZaloEntries.filter((e) => e.isGroup).length;
  let groupCounter = 0;
  let contactCounter = 0;

  const zaloLinks = rawZaloEntries.map((entry) => {
    if (entry.isGroup) {
      groupCounter += 1;
      const defaultTitle = totalGroups > 1 ? `Tham gia cộng đồng ${groupCounter}` : "Tham gia cộng đồng";
      return {
        id: `zalo-${entry.matchedUrl}-${groupCounter}`,
        url: entry.fullUrl,
        title: entry.label || defaultTitle,
        isGroup: true,
      };
    }

    contactCounter += 1;
    const defaultTitle = contactCounter > 1 ? `Liên hệ Zalo ${contactCounter}` : "Liên hệ Zalo";
    return {
      id: `zalo-${entry.matchedUrl}-${contactCounter}`,
      url: entry.fullUrl,
      title: entry.label || defaultTitle,
      isGroup: false,
    };
  });

  return { textLines, zaloLinks };
}

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

  return <div className="flash-sale-timer">Kết thúc sau <span>{timeLeft || "--:--:--"}</span></div>;
}

function StorefrontCategorySection({ category, accountCountByType }) {
  const railRef = useRef(null);
  const frameRef = useRef(null);
  const dragRef = useRef({ active: false, moved: false, startX: 0, scrollLeft: 0, pointerId: null });
  const [railState, setRailState] = useState({ atStart: true, atEnd: true });

  const updateRailState = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;

    const maxScrollLeft = Math.max(0, rail.scrollWidth - rail.clientWidth);
    const currentScrollLeft = Math.max(0, rail.scrollLeft);
    setRailState({
      atStart: currentScrollLeft <= 2,
      atEnd: currentScrollLeft >= maxScrollLeft - 2,
    });
  }, []);

  useEffect(() => {
    updateRailState();
    const rail = railRef.current;
    if (!rail || typeof ResizeObserver === "undefined") return undefined;

    const resizeObserver = new ResizeObserver(updateRailState);
    resizeObserver.observe(rail);
    Array.from(rail.children).forEach((card) => resizeObserver.observe(card));
    return () => resizeObserver.disconnect();
  }, [category.types.length, updateRailState]);

  const handleRailScroll = useCallback(() => {
    if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    frameRef.current = window.requestAnimationFrame(updateRailState);
  }, [updateRailState]);

  useEffect(() => () => {
    if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
  }, []);

  function scrollRail(direction) {
    const rail = railRef.current;
    if (!rail) return;
    const firstCard = rail.querySelector(".storefront-category-card");
    const gap = Number.parseFloat(window.getComputedStyle(rail).columnGap) || 0;
    const distance = direction * Math.max((firstCard?.getBoundingClientRect().width || rail.clientWidth) + gap, 280);

    try {
      rail.scrollBy({ left: distance, behavior: "smooth" });
    } catch {
      rail.scrollLeft += distance;
    }
  }

  function handlePointerDown(event) {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    const rail = railRef.current;
    if (!rail) return;

    dragRef.current = {
      active: true,
      moved: false,
      startX: event.clientX,
      scrollLeft: rail.scrollLeft,
      pointerId: event.pointerId,
    };
  }

  function handlePointerMove(event) {
    const rail = railRef.current;
    const drag = dragRef.current;
    if (!rail || !drag.active) return;

    const distance = event.clientX - drag.startX;
    if (!drag.moved && Math.abs(distance) > 6) {
      drag.moved = true;
      rail.classList.add("is-dragging");
      rail.setPointerCapture?.(drag.pointerId);
    }
    if (!drag.moved) return;
    rail.scrollLeft = drag.scrollLeft - distance;
  }

  function finishPointerDrag() {
    const rail = railRef.current;
    if (!rail || !dragRef.current.active) return;
    dragRef.current.active = false;
    rail.classList.remove("is-dragging");
    if (rail.hasPointerCapture?.(dragRef.current.pointerId)) rail.releasePointerCapture(dragRef.current.pointerId);
    dragRef.current.pointerId = null;
    updateRailState();
  }

  function preventClickAfterDrag(event) {
    if (!dragRef.current.moved) return;
    event.preventDefault();
    event.stopPropagation();
    dragRef.current.moved = false;
  }

  return (
    <section className="storefront-section storefront-game-section" id={`game-category-${category.id}`} aria-labelledby={`game-category-title-${category.id}`}>
      <div className="storefront-game-heading">
        <div>
          <h2
            id={`game-category-title-${category.id}`}
            className={category.name?.trim().toLocaleUpperCase("vi-VN") === "ACC GIÁ RẺ" ? "storefront-gradient-title" : undefined}
          >
            <Flame size={25} aria-hidden="true" /> <span>{category.name}</span>
          </h2>
          <p>{category.noidung?.trim() || `${category.types.length} loại tài khoản đang được giới thiệu`}</p>
        </div>
        {category.types.length > 0 && (
          <div className="storefront-game-heading-actions">
            <div className="storefront-rail-controls" aria-label={`Điều hướng danh mục ${category.name}`}>
              <button type="button" onClick={() => scrollRail(-1)} disabled={railState.atStart} aria-label={`Xem mục trước trong ${category.name}`}>
                <ChevronLeft size={28} aria-hidden="true" />
              </button>
              <button type="button" onClick={() => scrollRail(1)} disabled={railState.atEnd} aria-label={`Xem mục tiếp theo trong ${category.name}`}>
                <ChevronRight size={28} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>

      {category.types.length > 0 ? (
        <div
          className="storefront-category-grid"
          ref={railRef}
          onScroll={handleRailScroll}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishPointerDrag}
          onPointerCancel={finishPointerDrag}
          onClickCapture={preventClickAfterDrag}
          onDragStart={(event) => event.preventDefault()}
        >
          {category.types.map((type) => {
            const count = Number(accountCountByType?.[type.id] ?? 0);
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
                  <div className="storefront-category-footer">
                    <strong>{count > 0 ? `Còn ${count.toLocaleString("vi-VN")} tài khoản` : "Tạm hết hàng"}</strong>
                    <small>{count > 0 ? "Chọn để xem danh sách tài khoản" : "Danh mục đang được cập nhật"}</small>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="storefront-game-empty">Danh mục đang được cập nhật tài khoản.</p>
      )}

    </section>
  );
}

export default function Home() {
  const [data, setData] = useState({
    categories: [],
    accountTypes: [],
    latestAccounts: [],
    totalAccounts: 0,
    flashSaleAccounts: [],
    recentPurchases: { simulated: false, items: [] },
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
      setLoadError(getApiErrorMessage(error, "Không thể tải dữ liệu cửa hàng."));
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
  }, []);

  usePageSeo({
    title: "Trang chủ - Mua Bán Acc Game Uy Tín, Giá Rẻ",
    description: "Hệ thống cung cấp nick Liên Quân Mobile chất lượng cao, an toàn, giao thông tin tự động ngay lập tức sau 2 giây giao dịch.",
    keywords: "shop acc, mua acc game, shop lien quan, acc lien quan tu chon, shop acc gia re",
  });

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
  const shopName = data.setting?.ten_web?.trim() || "Shop Game";

  if (loading) {
    return (
      <div className="page-container home storefront-home storefront-home-loading"><SkeletonLoading variant="home" label="Đang tải cửa hàng" /></div>
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
        <section className="storefront-hero" aria-label="Banner cửa hàng và thao tác nhanh">
          <div className="storefront-hero-copy">
            <span className="storefront-eyebrow"><i aria-hidden="true" /> UY TÍN · GIÁ RẺ · BẢO HÀNH</span>
            <h1 className="storefront-hero-title">{shopName} -<br /><span>Shop Liên Quân rẻ nhất Việt Nam</span></h1>
            <p>Tìm tài khoản theo tướng, trang phục và mức giá. Thông tin đăng nhập được giao ngay sau khi thanh toán thành công.</p>
            <div className="storefront-hero-actions">
              <Link to="/accounts" className="btn-primary storefront-primary-cta">
                Xem kho acc <ArrowRight size={19} aria-hidden="true" />
              </Link>
            </div>
            <div className="storefront-hero-footnote" aria-label="Lợi ích mua hàng">
              <span><ShieldCheck size={17} aria-hidden="true" /> Thông tin rõ ràng</span>
              <span><Zap size={17} aria-hidden="true" /> Giao acc tự động</span>
            </div>
          </div>

          <div className="storefront-hero-media">
            <div className="storefront-banner-frame">
              <div className="storefront-banner-frame-top">
                <RecentPurchases
                  compact
                  items={data.recentPurchases?.items}
                  simulated={data.recentPurchases?.simulated}
                />
              </div>
              <div className="storefront-banner-screen">
                {heroImage ? (
                  <SafeImage
                    src={heroImage}
                    alt={`Banner ${data.setting?.ten_web || "cửa hàng tài khoản game"}`}
                    width={1600}
                    height={900}
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    fallbackLabel="Ảnh giới thiệu cửa hàng"
                  />
                ) : (
                  <div className="home-banner-placeholder">
                    <Gamepad2 size={44} aria-hidden="true" />
                    <p>{data.setting?.ten_web || "Shop Game"}</p>
                    <small>Chọn nhân vật. Chọn cuộc chơi.</small>
                  </div>
                )}
                <span className="storefront-banner-count"><strong>{formatNumber(data.totalAccounts || 0)}</strong> acc đang bán</span>
              </div>
              <div className="storefront-banner-frame-bottom">
                <RecentPurchases
                  compact
                  reverse
                  ariaHidden
                  items={data.recentPurchases?.items}
                  simulated={data.recentPurchases?.simulated}
                />
              </div>
            </div>
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

      </div>

      {/* Store Notice Popup Modal */}
      {data.setting?.thongbao && (() => {
        const parsedNotice = parseStoreNotice(data.setting.thongbao);
        return (
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
              {parsedNotice.textLines.length > 0 && (
                <div className="notice-popup-highlight-banner">
                  <div className="notice-highlight-icon" aria-hidden="true">
                    <Megaphone size={20} />
                  </div>
                  <div className="notice-highlight-content">
                    {parsedNotice.textLines.map((line, index) => (
                      <p key={index} className="notice-highlight-text">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {parsedNotice.zaloLinks.length > 0 && (
                <div className="notice-zalo-section">
                  <div className="notice-zalo-cards">
                    {parsedNotice.zaloLinks.map((item) => (
                      <a
                        key={item.id}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="notice-zalo-card"
                      >
                        <div className="notice-zalo-logo">
                          <img
                            src="/storefront/zalo-contact.webp"
                            alt="Logo Zalo"
                            width="38"
                            height="38"
                            loading="lazy"
                          />
                        </div>
                        <div className="notice-zalo-info">
                          <strong className="notice-zalo-title">{item.title}</strong>
                        </div>
                        <div className="notice-zalo-action" aria-hidden="true">
                          <span>Tham gia</span>
                          <ArrowUpRight size={14} />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Modal>
        );
      })()}

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
        <StorefrontCategorySection
          category={category}
          accountCountByType={data.accountCountByType}
          key={category.id}
        />
      ))}

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
