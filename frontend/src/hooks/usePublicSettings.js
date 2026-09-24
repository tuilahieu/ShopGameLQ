import { useEffect, useState } from "react";
import api from "../api/api";
import { readStoredJson } from "../utils/storage";

export default function usePublicSettings() {
  const [setting, setSetting] = useState(() => readStoredJson("setting", {}));

  useEffect(() => {
    let active = true;

    api.get("/home").then((response) => {
      const nextSetting = response.data?.data?.setting;
      if (!active || !nextSetting) return;
      setSetting(nextSetting);
      localStorage.setItem("setting", JSON.stringify(nextSetting));
    }).catch((error) => {
      console.error("Failed to sync settings:", error);
    });

    return () => {
      active = false;
    };
  }, []);

  return setting;
}
