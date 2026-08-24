import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../../api/api";
import AccountCard from "../../components/AccountCard";
import SafeImage from "../../components/SafeImage";
import { SlidersHorizontal, ChevronLeft, ChevronRight, ArrowLeft, Layers } from "lucide-react";
import { updateSEO } from "../../utils/seo";
import { resolveAccountTypeImage } from "../../utils/storefrontAssets";

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
    <div className="page-container catalogue-page">
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
        <div className="catalogue-category-view">
          <div className="catalogue-heading">
            <span className="storefront-section-kicker"><Layers size={17} aria-hidden="true" /> Kho tài khoản</span>
            <h1 className="page-title">Chọn loại tài khoản</h1>
            <p>Chọn đúng gói bạn quan tâm để xem acc và giá đang có.</p>
          </div>
          
          <div className="catalogue-category-grid">
            {types.map((type) => {
              const count = counts[type.id] ?? 0;
              return (
                <Link
                  to={`/accounts?loai_id=${type.id}`}
                  className="catalogue-category-card"
                  key={type.id}
                >
                  <div className="catalogue-category-media">
                    <SafeImage
                      src={resolveAccountTypeImage(type)}
                      alt={`Ảnh loại tài khoản ${type.name}`}
                      width={960}
                      height={600}
                      loading="lazy"
                      decoding="async"
                      fallbackLabel="Chưa có ảnh loại tài khoản"
                    />
                  </div>
                  <div className="catalogue-category-info">
                    <h3>{type.name}</h3>
                    <span className={count > 0 ? "catalogue-stock available" : "catalogue-stock unavailable"}>
                      {count > 0 ? `${count} tài khoản` : "Tạm hết hàng"}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        /* Render Filtered Accounts Grid when type is selected */
        <>
          <div className="catalogue-results-heading">
            <div>
              <Link to="/accounts" className="catalogue-back-link"><ArrowLeft size={17} aria-hidden="true" /> Đổi loại tài khoản</Link>
              <h1 className="page-title">{selectedType ? selectedType.name : "Kho tài khoản game"}</h1>
            </div>
            <span className="catalogue-result-count"><strong>{pagination.total}</strong> acc đang có</span>
          </div>

          {/* Type Info Banner - shown when a specific type is selected */}
          {selectedType && (
            <div className="type-info-banner" style={{ marginBottom: "32px" }}>
              <div className="type-info-banner-img">
                <SafeImage
                  src={resolveAccountTypeImage(selectedType)}
                  alt={`Ảnh loại tài khoản ${selectedType.name}`}
                  width={960}
                  height={600}
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

          <div className="catalogue-sort-bar">
            <label htmlFor="account-sort"><SlidersHorizontal size={17} aria-hidden="true" /> Sắp xếp</label>
            <select
              id="account-sort"
              name="sort"
              className="filter-input"
              value={sort}
              onChange={(e) => updateFilter("sort", e.target.value)}
            >
              <option value="">Mới cập nhật</option>
              <option value="price_asc">Giá thấp đến cao</option>
              <option value="price_desc">Giá cao đến thấp</option>
            </select>
          </div>

          {accounts.length === 0 ? (
            <div className="empty-state catalogue-empty-state">
              <h2>Tạm hết hàng</h2>
              <p>Gói này chưa có tài khoản sẵn sàng. Bạn có thể chọn loại khác.</p>
              <button onClick={resetFilters} className="btn-primary">Chọn loại khác</button>
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
                <nav className="catalogue-pagination" aria-label="Phân trang kho tài khoản">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="btn-outline"
                  >
                    <ChevronLeft size={16} /> Trước
                  </button>

                  <span>
                    Trang <strong>{pagination.page}</strong> / {pagination.totalPage}
                  </span>

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPage}
                    className="btn-outline"
                  >
                    Sau <ChevronRight size={16} />
                  </button>
                </nav>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
