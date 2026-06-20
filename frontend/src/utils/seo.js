/**
 * Dynamically updates document SEO metadata in the head (Title, Meta Description, Meta Keywords, OpenGraph).
 * @param {Object} seoOptions
 * @param {string} seoOptions.title - The page title
 * @param {string} seoOptions.description - Compelling meta description
 * @param {string} seoOptions.keywords - SEO meta keywords
 */
export function updateSEO({ title, description, keywords }) {
  // 1. Get Web Config Settings
  let siteName = "Shopgameliqi";
  try {
    const setting = JSON.parse(localStorage.getItem("setting") || "{}");
    if (setting.ten_web) {
      siteName = setting.ten_web;
    }
  } catch (e) {
    console.error("Failed to parse settings for SEO:", e);
  }

  // 2. Update Document Title
  document.title = title ? `${title} | ${siteName}` : siteName;

  // 3. Update Meta Description
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    document.head.appendChild(metaDesc);
  }
  metaDesc.setAttribute('content', description || `Hệ thống cung cấp nick game chất lượng cao, an toàn và uy tín hàng đầu.`);

  // 4. Update Meta Keywords
  let metaKeywords = document.querySelector('meta[name="keywords"]');
  if (!metaKeywords) {
    metaKeywords = document.createElement('meta');
    metaKeywords.setAttribute('name', 'keywords');
    document.head.appendChild(metaKeywords);
  }
  metaKeywords.setAttribute('content', keywords || 'shop acc, mua ban acc game, nick gia re, shop acc uy tin');

  // 5. Update OpenGraph (OG) Title
  let ogTitle = document.querySelector('meta[property="og:title"]');
  if (!ogTitle) {
    ogTitle = document.createElement('meta');
    ogTitle.setAttribute('property', 'og:title');
    document.head.appendChild(ogTitle);
  }
  ogTitle.setAttribute('content', title ? `${title} | ${siteName}` : siteName);

  // 6. Update OpenGraph (OG) Description
  let ogDesc = document.querySelector('meta[property="og:description"]');
  if (!ogDesc) {
    ogDesc = document.createElement('meta');
    ogDesc.setAttribute('property', 'og:description');
    document.head.appendChild(ogDesc);
  }
  ogDesc.setAttribute('content', description || `Hệ thống bán tài khoản game giá rẻ, giao dịch tự động 24/7.`);
}
