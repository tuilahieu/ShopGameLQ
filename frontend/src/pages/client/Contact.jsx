import { Link } from "react-router-dom";
import { Headphones, MessageCircle, Phone } from "lucide-react";
import { getSupportContacts } from "../../utils/supportContacts";
import usePublicSettings from "../../hooks/usePublicSettings";
import CustomerPageHeading from "../../components/client/CustomerPageHeading";
import usePageSeo from "../../hooks/usePageSeo";

export default function Contact() {
  const setting = usePublicSettings();

  usePageSeo({
    title: "Liên Hệ Hỗ Trợ Khách Hàng 24/7",
    description: "Liên hệ ngay với ban quản trị website qua Hotline, Zalo, Facebook Messenger để được hỗ trợ giải quyết thắc mắc về đơn hàng, nạp tiền ví.",
    keywords: "lien he cskh, hotline ho tro, zalo ho tro, facebook admin, shop acc lien quan",
  });

  const { zaloLink, phoneDisplay, facebookLink, hasAnyContact } = getSupportContacts(setting);

  return (
    <div className="page-container support-page">
      <CustomerPageHeading
        eyebrow={<><Headphones size={15} aria-hidden="true" /> Hỗ trợ khách hàng</>}
        eyebrowClassName="customer-page-eyebrow"
        title="Liên hệ với shop"
        description="Cần hỗ trợ đơn hàng, nạp tiền hoặc bảo hành? Chọn kênh thuận tiện nhất bên dưới."
      />

      <section className="support-card" aria-labelledby="support-channels-title">
        <h2 id="support-channels-title">Kênh hỗ trợ trực tuyến</h2>
        <div className="support-channel-list">
          {zaloLink && (
            <article className="support-channel">
              <div className="support-channel-mark support-channel-mark--zalo" aria-hidden="true">Zalo</div>
              <div className="support-channel-copy">
                <span>Chat Zalo hỗ trợ</span>
                <strong>{phoneDisplay}</strong>
              </div>
              <a href={zaloLink} target="_blank" rel="noreferrer" className="btn-primary support-channel-action">
                Chat Zalo
              </a>
            </article>
          )}

          {facebookLink && (
            <article className="support-channel">
              <div className="support-channel-mark support-channel-mark--facebook" aria-hidden="true">
                <MessageCircle size={19} />
              </div>
              <div className="support-channel-copy">
                <span>Facebook Messenger</span>
                <strong>Messenger CSKH</strong>
              </div>
              <a href={facebookLink} target="_blank" rel="noreferrer" className="btn-outline support-channel-action">
                Gửi tin nhắn
              </a>
            </article>
          )}

          {phoneDisplay && (
            <article className="support-channel">
              <div className="support-channel-mark" aria-hidden="true"><Phone size={19} /></div>
              <div className="support-channel-copy">
                <span>Hotline hỗ trợ gấp</span>
                <strong className="support-phone">{phoneDisplay}</strong>
              </div>
            </article>
          )}

          {!hasAnyContact && (
            <article className="support-channel support-channel--unavailable" role="status">
              <div className="support-channel-mark" aria-hidden="true"><Headphones size={19} /></div>
              <div className="support-channel-copy">
                <span>Kênh hỗ trợ</span>
                <strong>Thông tin liên hệ đang được cập nhật</strong>
              </div>
            </article>
          )}
        </div>

        <Link to="/" className="btn-outline support-home-link">Quay về trang chủ</Link>
      </section>
    </div>
  );
}
