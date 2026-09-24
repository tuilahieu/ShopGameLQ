import { useEffect } from "react";
import { updateSEO } from "../utils/seo";

export default function usePageSeo(options) {
  const title = options?.title;
  const description = options?.description;
  const keywords = options?.keywords;
  const enabled = Boolean(options);

  useEffect(() => {
    if (!enabled) return;
    updateSEO({ title, description, keywords });
  }, [description, enabled, keywords, title]);
}
