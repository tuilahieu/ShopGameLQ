import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../api/api";
import AccountCard from "../../components/AccountCard";
import { Filter, SlidersHorizontal, ChevronLeft, ChevronRight, RefreshCw, Layers, Gamepad2 } from "lucide-react";
import { updateSEO } from "../../utils/seo";

export default function Accounts() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [accounts, setAccounts] = useState([]);
  const [types, setTypes] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Pagination State
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPage: 1
  });

  const loaiId = searchParams.get("loai_id") || "";
  const sort = searchParams.get("sort") || "";
  const page = Number(searchParams.get("page") || "1");

  // Find the selected type object for showing its info banner
  const selectedType = loaiId ? types.find((t) => t.id.toString() === loaiId) : null;

  async function loadData() {
    setLoading(true);
    try {
      if (loaiId) {
        // Fetch accounts, types and count map
        const [accRes, homeRes] = await Promise.all([
          api.get("/accounts", {
            params: {
              loai_id: loaiId,
              sort: sort || undefined,
              page: page,
              limit: 12
            },
          }),
          api.get("/home"),
        ]);

        setAccounts(accRes.data?.data?.accounts || []);
        if (accRes.data?.data?.pagination) {
          setPagination(accRes.data.data.pagination);
        }
        setTypes(homeRes.data?.data?.accountTypes || []);
        setCounts(homeRes.data?.data?.accountCountByType || {});
      } else {
        // If no loai_id, only fetch types & counts to let users choose
        const homeRes = await api.get("/home");
        setTypes(homeRes.data?.data?.accountTypes || []);
        setCounts(homeRes.data?.data?.accountCountByType || {});
        setAccounts([]);
        setPagination({
          page: 1,
          limit: 12,
          total: 0,
          totalPage: 1
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function updateFilter(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    // Reset page to 1 on filter change
    if (key !== "page") {
      next.set("page", "1");
    }
    setSearchParams(next);
  }

  function handlePageChange(newPage) {
    if (newPage < 1 || newPage > pagination.totalPage) return;
    updateFilter("page", newPage.toString());
  }

  function resetFilters() {
    setSearchParams(new URLSearchParams());
  }

  useEffect(() => {
    loadData();
  }, [loaiId, sort, page]);

  useEffect(() => {
    if (loaiId && selectedType) {
      updateSEO({
        title: `${selectedType.name} - Kho Tài Khoản Game`,
        description: selectedType.noidung || `Mua ngay tài khoản thuộc danh mục ${selectedType.name} tại shop. Cam kết: ${selectedType.camket || 'uy tín, an toàn 100%.'}`,
        keywords: `${selectedType.name.toLowerCase()}, mua acc ${selectedType.name.toLowerCase()}, shop acc game`
      });
    } else if (!loaiId) {
      updateSEO({
        title: "Chọn Danh Mục Acc Game - Kho Tài Khoản",
        description: "Khám phá kho tài khoản game cực chất tại hệ thống. Đa dạng thể loại, giá rẻ bất ngờ, cam kết uy tín 100%.",
        keywords: "danh muc acc game, kho acc, acc lien quan, acc gia re"
      });
    }
  }, [loaiId, selectedType]);

  return (
    <div className="page-container">
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "100px 0", gap: "16px" }}>
          <div className="premium-loader-container-small">
            <div className="loader-ring-small"></div>
            <div className="loader-icon-box-small">
              <Gamepad2 className="loader-gamepad-small" size={20} />
            </div>
          </div>
          <style>{`
            .premium-loader-container-small {
              position: relative;
              width: 50px;
              height: 50px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .loader-ring-small {
              position: absolute;
              width: 44px;
              height: 44px;
              border-radius: 50%;
              border: 2px solid transparent;
              border-top-color: var(--accent-color);
              border-bottom-color: var(--cyan-color);
              animation: loader-spin 1.2s linear infinite;
            }
            .loader-icon-box-small {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 30px;
              height: 30px;
              background: var(--bg-secondary);
              border-radius: 50%;
              border: 1px solid var(--border-color);
            }
            .loader-gamepad-small {
              color: var(--accent-color);
              animation: pulse-glow-small 1.5s ease-in-out infinite;
            }
            @keyframes pulse-glow-small {
              0%, 100% { opacity: 0.7; transform: scale(0.95); }
              50% { opacity: 1; transform: scale(1.05); }
            }
          `}</style>
        </div>
      ) : !loaiId ? (
        /* Render Category Types Selection List when no specific type selected */
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          <div className="section-header" style={{ marginBottom: "12px", justifyContent: "center", textAlign: "center" }}>
            <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "1.8rem" }}>
              <Layers size={28} style={{ color: "var(--accent-color)" }} />
              CHỌN DANH MỤC ACC GAME
            </h1>
          </div>
          
          <div className="category-grid">
            {types.map((type) => {
              const count = counts[type.id] ?? 0;
              return (
                <div
                  className="category-card"
                  key={type.id}
                  onClick={() => updateFilter("loai_id", type.id.toString())}
                  style={{ cursor: "pointer", transition: "transform 0.2s" }}
                >
                  <div className="category-thumb-wrapper" style={{ height: "180px" }}>
                    <img src={type.img || "https://placehold.co/500x260/111827/ffffff?text=Lien+Quan"} alt={type.name} />
                  </div>
                  <div className="category-info">
                    <h3>{type.name}</h3>
                    <div className="category-explore">
                      <span className="explore-count">Còn <strong>{count}</strong> acc</span>
                      <span className="explore-cta">Xem ngay &rarr;</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Render Filtered Accounts Grid when type is selected */
        <>
          <div className="section-header" style={{ marginBottom: "32px" }}>
            <h1 className="page-title" style={{ textTransform: "uppercase" }}>{selectedType ? selectedType.name : "KHO TÀI KHOẢN GAME"}</h1>
            <button onClick={resetFilters} className="btn-outline" style={{ padding: "8px 12px", fontSize: "0.85rem" }}>
              <RefreshCw size={14} style={{ marginRight: "4px" }} /> Chọn loại khác
            </button>
          </div>

          {/* Filter and Sorting Bar */}
          <div className="filter-wrapper">
            <div className="filter-grid">
              <div className="filter-item">
                <label><Filter size={12} style={{ display: "inline", marginRight: "4px" }} /> Gói tài khoản</label>
                <select
                  className="filter-input"
                  value={loaiId}
                  onChange={(e) => updateFilter("loai_id", e.target.value)}
                >
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-item">
                <label><SlidersHorizontal size={12} style={{ display: "inline", marginRight: "4px" }} /> Sắp xếp theo giá</label>
                <select
                  className="filter-input"
                  value={sort}
                  onChange={(e) => updateFilter("sort", e.target.value)}
                >
                  <option value="">Acc mới cập nhật</option>
                  <option value="price_asc">Giá từ thấp đến cao</option>
                  <option value="price_desc">Giá từ cao đến thấp</option>
                </select>
              </div>

              <div className="filter-item" style={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-end" }}>
                <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "12px" }}>
                  Tìm thấy: <strong>{pagination.total}</strong> nick
                </span>
              </div>
            </div>
          </div>

          {/* Type Info Banner - shown when a specific type is selected */}
          {selectedType && (
            <div className="type-info-banner" style={{ marginBottom: "32px" }}>
              {selectedType.img && (
                <div className="type-info-banner-img">
                  <img src={selectedType.img} alt={selectedType.name} />
                </div>
              )}
              <div className="type-info-banner-body">
                <h2 className="type-info-banner-title">{selectedType.name}</h2>
                {selectedType.noidung && (
                  <p className="type-info-banner-desc" style={{ whiteSpace: "pre-line" }}>{selectedType.noidung}</p>
                )}
                {selectedType.camket && (
                  <div className="type-info-banner-warranty">
                    <span className="warranty-icon">🛡️</span>
                    <span>{selectedType.camket}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {accounts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 24px", background: "var(--bg-secondary)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
              <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>Hiện tại gói tài khoản này đang hết hàng. Vui lòng quay lại sau!</p>
              <button onClick={resetFilters} className="btn-primary" style={{ marginTop: "16px" }}>
                Quay lại chọn loại khác
              </button>
            </div>
          ) : (
            <>
              <div className="account-grid">
                {accounts.map((acc) => (
                  <AccountCard acc={acc} key={acc.id} />
                ))}
              </div>

              {/* Premium Pagination Controls */}
              {pagination.totalPage > 1 && (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginTop: "48px" }}>
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="btn-outline"
                    style={{ padding: "8px 16px", opacity: pagination.page === 1 ? 0.5 : 1, cursor: pagination.page === 1 ? "not-allowed" : "pointer" }}
                  >
                    <ChevronLeft size={16} /> Trước
                  </button>

                  <span style={{ fontSize: "0.95rem", color: "var(--text-secondary)" }}>
                    Trang <strong>{pagination.page}</strong> / {pagination.totalPage}
                  </span>

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPage}
                    className="btn-outline"
                    style={{ padding: "8px 16px", opacity: pagination.page === pagination.totalPage ? 0.5 : 1, cursor: pagination.page === pagination.totalPage ? "not-allowed" : "pointer" }}
                  >
                    Sau <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Loading Spin Animation Definition */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
