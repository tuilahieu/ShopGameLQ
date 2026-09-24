import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../../api/api";
import AccountCard from "../../components/AccountCard";
import SafeImage from "../../components/SafeImage";
import { SlidersHorizontal, ChevronLeft, ChevronRight, ArrowLeft, Layers, ShieldCheck } from "lucide-react";
import { StatusMessage } from "../../components/Ui";
import SkeletonLoading from "../../components/SkeletonLoading";
import { resolveAccountTypeImage } from "../../utils/storefrontAssets";
import usePageSeo from "../../hooks/usePageSeo";
import { getApiErrorMessage } from "../../utils/apiError";
import useLatestRequest from "../../hooks/useLatestRequest";

export default function Accounts() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [accounts, setAccounts] = useState([]);
  const [types, setTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const catalogueLoaded = useRef(false);
  const { beginRequest, isLatestRequest } = useLatestRequest();
  
  // Pagination State
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPage: 1
  });

  const loaiId = searchParams.get("loai_id") || "";
  const categoryId = searchParams.get("danhmuc_id") || "";
  const sort = searchParams.get("sort") || "";
  const page = Number(searchParams.get("page") || "1");

  // Find the selected type object for showing its info banner
  const selectedType = loaiId ? types.find((t) => t.id.toString() === loaiId) : null;
  const selectedCategory = categoryId ? categories.find((category) => String(category.id) === categoryId) : null;
  const visibleTypes = !loaiId && categoryId
    ? types.filter((type) => String(type.danhmuc_id) === categoryId)
    : types;

  const loadData = useCallback(async () => {
    const sequence = beginRequest();
    setLoading(true);
    setLoadError("");
    try {
      // Account types rarely change during one customer session. Avoid loading
      // the full catalogue again for each pagination/sort interaction.
      const homeRequest = catalogueLoaded.current ? null : api.get("/home");

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
        if (!isLatestRequest(sequence)) return;
        if (homeRes) {
          setTypes(homeRes.data?.data?.accountTypes || []);
          setCategories(homeRes.data?.data?.categories || []);
          setCounts(homeRes.data?.data?.accountCountByType || {});
          catalogueLoaded.current = true;
        }
        setAccounts(accRes.data?.data?.accounts || []);
        if (accRes.data?.data?.pagination) {
          setPagination(accRes.data.data.pagination);
        }
      } else {
        const homeRes = homeRequest ? await homeRequest : null;
        if (!isLatestRequest(sequence)) return;
        if (homeRes) {
          setTypes(homeRes.data?.data?.accountTypes || []);
          setCategories(homeRes.data?.data?.categories || []);
          setCounts(homeRes.data?.data?.accountCountByType || {});
          catalogueLoaded.current = true;
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
      if (isLatestRequest(sequence)) setLoadError(getApiErrorMessage(error, "Không thể tải kho tài khoản."));
    } finally {
      if (isLatestRequest(sequence)) setLoading(false);
    }
  }, [beginRequest, isLatestRequest, loaiId, sort, page]);

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
  }, [loadData]);

  const seo = loaiId && selectedType ? {
    title: `${selectedType.name} - Kho Tài Khoản Game`,
    description: selectedType.noidung || `Mua ngay tài khoản thuộc danh mục ${selectedType.name} tại shop. Cam kết: ${selectedType.camket || 'uy tín, an toàn 100%.'}`,
    keywords: `${selectedType.name.toLowerCase()}, mua acc ${selectedType.name.toLowerCase()}, shop acc game`,
  } : !loaiId ? {
    title: "Chọn Danh Mục Acc Game - Kho Tài Khoản",
    description: "Khám phá kho tài khoản game cực chất tại hệ thống. Đa dạng thể loại, giá rẻ bất ngờ, cam kết uy tín 100%.",
    keywords: "danh muc acc game, kho acc, acc lien quan, acc gia re",
  } : null;
  usePageSeo(seo);

  return (
    <div className="page-container catalogue-page">
      {loading ? (
        <SkeletonLoading variant={loaiId ? "catalogue-results" : "catalogue"} items={loaiId ? 3 : 6} label="Đang tải kho tài khoản" />
      ) : loadError ? (
        <StatusMessage title="Không thể tải kho tài khoản" description={loadError} action={<button className="btn-primary" onClick={loadData}>Tải lại</button>} />
      ) : !loaiId ? (
        /* Render Category Types Selection List when no specific type selected */
        <div className="catalogue-category-view">
          <div className="catalogue-heading">
            <span className="storefront-section-kicker"><Layers size={17} aria-hidden="true" /> Kho tài khoản</span>
            {selectedCategory && <Link to="/accounts" className="catalogue-back-link"><ArrowLeft size={17} aria-hidden="true" /> Tất cả danh mục</Link>}
            <h1 className="page-title">{selectedCategory?.name || "Chọn loại tài khoản"}</h1>
            <p>{selectedCategory?.noidung || "Chọn đúng gói bạn quan tâm để xem acc và giá đang có."}</p>
          </div>
          
          <div className="catalogue-category-grid">
            {visibleTypes.map((type) => {
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
          {visibleTypes.length === 0 && <p className="storefront-game-empty">Danh mục đang được cập nhật tài khoản.</p>}
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
            <div className="type-info-banner">
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
                  <p className="type-info-banner-desc">{selectedType.noidung}</p>
                )}
                {selectedType.camket && (
                  <div className="type-info-banner-warranty">
                    <span className="warranty-icon"><ShieldCheck size={18} aria-hidden="true" /></span>
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
            <StatusMessage className="catalogue-empty-state" title="Tạm hết hàng" description="Gói này chưa có tài khoản sẵn sàng. Bạn có thể chọn loại khác." action={<button onClick={resetFilters} className="btn-primary">Chọn loại khác</button>} />
          ) : (
            <>
              <div className={`account-grid ${accounts.length === 1 ? "is-single" : ""}`}>
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
