import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/api";
import { Flame } from "lucide-react";
import { updateSEO } from "../../utils/seo";
import AccountCard from "../../components/AccountCard";
import SafeImage from "../../components/SafeImage";

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
    recentOrders: [],
    flashSaleAccounts: [],
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeCat, setActiveCat] = useState("all");

  async function loadHome() {
    setLoadError("");
    try {
      const res = await api.get("/home");
      setData(res.data.data);
    } catch (error) {
      console.error(error);
      setLoadError(error.response?.data?.message || "Không thể tải dữ liệu cửa hàng.");
    } finally {
      setLoading(false);
    }
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

  const displayedCategories = activeCat === "all"
    ? data.categories?.filter((cat) => Number(cat.status) === 1) || []
    : data.categories?.filter((cat) => Number(cat.status) === 1 && cat.id.toString() === activeCat) || [];

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
    <div className="page-container home" style={{ gap: "24px" }}>
      {/* Top Banner and Announcement Row */}
      <div className="home-top-section">
        {/* Banner Card (Left side) */}
        <div className="home-banner-card">
          {data.setting?.banner ? (
            <SafeImage
              src={data.setting.banner}
              alt="Banner cửa hàng"
              width={1180}
              height={460}
              decoding="async"
              fallbackLabel="Banner chưa sẵn sàng"
            />
          ) : (
            <div className="home-banner-placeholder">
              <p>{data.setting?.ten_web || "Shop Game"}</p>
              <small>Kho tài khoản game được cập nhật thường xuyên.</small>
            </div>
          )}
        </div>

        {/* Announcement Box (Right side) */}
        <div className="home-announcement-box">
          {/* Header */}
          <div className="announcement-header">
            Thông báo Tin tức
          </div>

          {/* Content body */}
          <div className="announcement-body">
            {data.setting?.thongbao ? (
              data.setting.thongbao.split("\n").map((line, index) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={index} style={{ height: "4px" }} />;
                return (
                  <div 
                    key={index} 
                    style={{ 
                      color: trimmed.startsWith("🔥") || trimmed.startsWith("🍀") || trimmed.startsWith("⚠️") || trimmed.startsWith("❌")
                        ? "var(--gold-color)" 
                        : "var(--text-primary)",
                      fontWeight: trimmed.startsWith("🔥") || trimmed.startsWith("★") ? "bold" : "normal"
                    }}
                  >
                    {trimmed}
                  </div>
                );
              })
            ) : (
              <div style={{ color: "var(--text-muted)", textAlign: "center", marginTop: "20px" }}>
                Chưa có thông báo.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FLASH SALE BLOCK */}
      {data.flashSaleAccounts && data.flashSaleAccounts.length > 0 && (
        <div className="flash-sale-section">
          <div className="flash-sale-header">
            <h2 className="flash-sale-title">
              <Flame size={28} style={{ color: "var(--accent-color)", fill: "var(--accent-color)" }} />
              FLASH SALE
            </h2>
            <SaleCountdown endTimes={saleEndTimes} onExpired={loadHome} />
          </div>
          <div className="account-grid">
            {data.flashSaleAccounts.map((acc, index) => (
              <AccountCard key={acc.id} acc={acc} priority={index < 2} />
            ))}
          </div>
        </div>
      )}



      {/* Category Tabs Filter */}
      {!loading && data.categories?.length > 0 && (
        <div className="category-tabs-container">
          <button 
            className={`category-tab-btn ${activeCat === "all" ? "active" : ""}`}
            onClick={() => setActiveCat("all")}
          >
            Tất cả danh mục
          </button>
          {data.categories
            .filter((cat) => Number(cat.status) === 1)
            .map((cat) => (
              <button 
                key={cat.id}
                className={`category-tab-btn ${activeCat === cat.id.toString() ? "active" : ""}`}
                onClick={() => setActiveCat(cat.id.toString())}
              >
                {cat.name}
              </button>
            ))}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "100px 0", color: "var(--text-secondary)" }}>
          <div style={{ display: "inline-block", border: "4px solid rgba(255,255,255,0.1)", borderTop: "4px solid var(--accent-color)", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite", marginBottom: "16px" }}></div>
          <div>Đang tải danh mục cửa hàng...</div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      ) : displayedCategories.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 24px", background: "var(--bg-secondary)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem" }}>Không tìm thấy danh mục nào khớp.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
          {displayedCategories.map((cat) => {
              // Get accountTypes belonging to this category
              const relatedTypes = data.accountTypes?.filter(
                (type) => Number(type.danhmuc_id) === Number(cat.id) && Number(type.status) === 1
              ) || [];

              return (
                <section key={cat.id} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div className="section-header" style={{ marginBottom: "4px" }}>
                    <h2 style={{ textTransform: "uppercase", fontSize: "1.4rem", letterSpacing: "0.5px" }}>
                      {cat.name}
                    </h2>
                    {cat.noidung && (
                      <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontStyle: "italic" }}>
                        {cat.noidung}
                      </span>
                    )}
                  </div>

                  {relatedTypes.length > 0 ? (
                    <div className="category-grid">
                      {relatedTypes.map((type) => {
                        const count = data.accountCountByType?.[type.id] ?? 0;
                        return (
                          <Link to={`/accounts?loai_id=${type.id}`} className="category-card" key={type.id}>
                            <div className="category-thumb-wrapper" style={{ height: "180px" }}>
                              <SafeImage
                                src={type.img}
                                alt={`Ảnh danh mục ${type.name}`}
                                width={500}
                                height={260}
                                loading="lazy"
                                decoding="async"
                                fallbackLabel="Chưa có ảnh danh mục"
                              />
                            </div>
                            <div className="category-info">
                              <h3>{type.name}</h3>
                              <div className="category-explore">
                                <span className="explore-count">Còn <strong>{count}</strong> acc</span>
                                <span className="explore-cta">Xem ngay &rarr;</span>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ padding: "32px", background: "var(--bg-secondary)", borderRadius: "12px", border: "1px dashed rgba(255,255,255,0.08)", textAlign: "center", color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                      Đang cập nhật các gói tài khoản trong danh mục này...
                    </div>
                  )}
                </section>
              );
            })}
        </div>
      )}
    </div>
  );
}
