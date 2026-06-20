import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/api";
import { Layers, Flame, Gamepad2 } from "lucide-react";
import { updateSEO } from "../../utils/seo";
import AccountCard from "../../components/AccountCard";

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
  const [activeCat, setActiveCat] = useState("all");
  const [timeLeft, setTimeLeft] = useState("");

  async function loadHome() {
    try {
      const res = await api.get("/home");
      setData(res.data.data);
    } catch (error) {
      console.error(error);
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

  useEffect(() => {
    if (!data.flashSaleAccounts || data.flashSaleAccounts.length === 0) {
      return;
    }

    // Find the closest active flash sale that is expiring soonest
    const activeSales = data.flashSaleAccounts
      .map(acc => new Date(acc.sale_detail.ketthuc).getTime())
      .filter(endTime => endTime > Date.now());

    if (activeSales.length === 0) {
      setTimeLeft("ĐÃ KẾT THÚC");
      return;
    }

    const minEndTime = Math.min(...activeSales);

    function updateTimer() {
      const now = Date.now();
      const diff = minEndTime - now;

      if (diff <= 0) {
        setTimeLeft("ĐÃ KẾT THÚC");
        clearInterval(timerInterval);
        loadHome(); // reload data when sale expires
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const formatted = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
      setTimeLeft(formatted);
    }

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);

    return () => clearInterval(timerInterval);
  }, [data.flashSaleAccounts]);

  const displayedCategories = activeCat === "all"
    ? data.categories?.filter((cat) => Number(cat.status) === 1) || []
    : data.categories?.filter((cat) => Number(cat.status) === 1 && cat.id.toString() === activeCat) || [];

  if (loading) {
    return (
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "var(--bg-primary)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div className="premium-loader-container">
          <div className="loader-ring"></div>
          <div className="loader-ring-inner"></div>
          <div className="loader-icon-box">
            <Gamepad2 className="loader-gamepad" size={36} />
          </div>
        </div>
        
        <style>{`
          .premium-loader-container {
            position: relative;
            width: 100px;
            height: 100px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .loader-ring {
            position: absolute;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            border: 3px solid transparent;
            border-top-color: var(--accent-color);
            border-bottom-color: var(--gold-color);
            animation: loader-spin 1.5s cubic-bezier(0.53, 0.21, 0.29, 0.67) infinite;
          }
          .loader-ring-inner {
            position: absolute;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            border: 2px solid transparent;
            border-left-color: var(--cyan-color);
            border-right-color: var(--accent-color);
            animation: loader-spin-reverse 1.2s linear infinite;
            opacity: 0.8;
          }
          .loader-icon-box {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 50px;
            height: 50px;
            background: var(--bg-secondary);
            border-radius: 50%;
            box-shadow: 0 0 20px var(--accent-glow);
            animation: pulse-glow 2s ease-in-out infinite;
            border: 1px solid var(--border-color);
          }
          .loader-gamepad {
            color: var(--accent-color);
            animation: gamepad-bounce 2s ease-in-out infinite;
          }
          @keyframes loader-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes loader-spin-reverse {
            0% { transform: rotate(360deg); }
            100% { transform: rotate(0deg); }
          }
          @keyframes pulse-glow {
            0%, 100% {
              box-shadow: 0 0 15px var(--accent-glow);
              transform: scale(0.95);
            }
            50% {
              box-shadow: 0 0 30px var(--accent-glow);
              transform: scale(1.05);
            }
          }
          @keyframes gamepad-bounce {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            25% { transform: translateY(-2px) rotate(-5deg); }
            75% { transform: translateY(2px) rotate(5deg); }
          }
        `}</style>
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
            <img
              src={data.setting.banner}
              alt="Website Banner"
            />
          ) : (
            <div className="home-banner-placeholder">
              <span>🎮</span>
              <p>{data.setting?.ten_web || "Shop Game"}</p>
              <small>Admin vui lòng cấu hình ảnh banner trong trang quản trị</small>
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
            <div className="flash-sale-timer">
              KẾT THÚC SAU: <span>{timeLeft || "00:00:00"}</span>
            </div>
          </div>
          <div className="account-grid">
            {data.flashSaleAccounts.map((acc) => (
              <AccountCard key={acc.id} acc={acc} />
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
                              <img src={type.img || "https://placehold.co/500x260/111827/ffffff?text=Lien+Quan"} alt={type.name} loading="lazy" />
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
