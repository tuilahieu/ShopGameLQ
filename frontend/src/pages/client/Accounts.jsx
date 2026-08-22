import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../api/api";
import AccountCard from "../../components/AccountCard";
import SafeImage from "../../components/SafeImage";
import { SlidersHorizontal, ChevronLeft, ChevronRight, RefreshCw, Layers } from "lucide-react";
import { updateSEO } from "../../utils/seo";

export default function Accounts() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [accounts, setAccounts] = useState([]);
  const [types, setTypes] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [catalogueLoaded, setCatalogueLoaded] = useState(false);
  
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
    setLoadError("");
    try {
      // Account types rarely change during one customer session. Avoid loading
      // the full catalogue again for each pagination/sort interaction.
      const homeRequest = catalogueLoaded ? null : api.get("/home");

      if (loaiId) {
        const [homeRes, accRes] = await Promise.all([
          homeRequest,
          api.get("/accounts", {
            params: {
              loai_id: loaiId,
              sort: sort || undefined,
              page,
              limit: 12,
            },
          }),
        ]);
        if (homeRes) {
          setTypes(homeRes.data?.data?.accountTypes || []);
          setCounts(homeRes.data?.data?.accountCountByType || {});
          setCatalogueLoaded(true);
        }
        setAccounts(accRes.data?.data?.accounts || []);
        if (accRes.data?.data?.pagination) {
          setPagination(accRes.data.data.pagination);
        }
      } else {
        const homeRes = homeRequest ? await homeRequest : null;
        if (homeRes) {
          setTypes(homeRes.data?.data?.accountTypes || []);
          setCounts(homeRes.data?.data?.accountCountByType || {});
          setCatalogueLoaded(true);
        }
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
      setLoadError(error.response?.data?.message || "Không thể tải kho tài khoản.");
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
        <div className="catalogue-skeleton" aria-busy="true" aria-label="Đang tải kho tài khoản">
          <div className="skeleton-heading" />
          <div className="skeleton-filter" />
          <div className="skeleton-grid">{Array.from({ length: 6 }, (_, index) => <div className="skeleton-card" key={index} />)}</div>
        </div>
      ) : loadError ? (
        <div className="empty-state">
          <h2>Không thể tải kho tài khoản</h2>
          <p>{loadError}</p>
          <button className="btn-primary" onClick={loadData}>Tải lại</button>
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
                    <SafeImage
                      src={type.img}
                      alt={`Ảnh loại tài khoản ${type.name}`}
                      width={500}
                      height={260}
                      loading="lazy"
                      decoding="async"
                      fallbackLabel="Chưa có ảnh loại tài khoản"
                    />
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
            <div className="filter-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
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
              <div className="type-info-banner-img">
                <SafeImage
                  src={selectedType.img}
                  alt={`Ảnh loại tài khoản ${selectedType.name}`}
                  width={320}
                  height={180}
                  loading="lazy"
                  decoding="async"
                  fallbackLabel="Chưa có ảnh loại tài khoản"
                />
              </div>
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
                {accounts.map((acc, index) => (
                  <AccountCard acc={acc} key={acc.id} priority={index < 2} />
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
    </div>
  );
}
