import { Link } from "react-router-dom";
import { Gamepad2, Home, ListFilter } from "lucide-react";
import usePageSeo from "../../hooks/usePageSeo";

export default function NotFound() {
  usePageSeo({
    title: "Không tìm thấy trang",
    description: "Trang bạn đang tìm không tồn tại hoặc đã được chuyển đi.",
  });

  return (
    <main className="page-container not-found-page">
      <section className="not-found-card" aria-labelledby="not-found-title">
        <div className="not-found-icon" aria-hidden="true"><Gamepad2 size={32} /></div>
        <p className="not-found-code">404</p>
        <h1 id="not-found-title">KHÔNG TÌM THẤY TRANG</h1>
        <p>Đường dẫn này không còn khả dụng. Bạn có thể quay về trang chủ hoặc tiếp tục chọn tài khoản.</p>
        <div className="not-found-actions">
          <Link to="/" className="btn-primary"><Home size={18} aria-hidden="true" /> VỀ TRANG CHỦ</Link>
          <Link to="/accounts" className="btn-outline"><ListFilter size={18} aria-hidden="true" /> XEM KHO ACC</Link>
        </div>
      </section>
    </main>
  );
}
