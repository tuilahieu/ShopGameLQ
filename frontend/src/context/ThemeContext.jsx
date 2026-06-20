import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
    return "system";
  });

  // Resolved = actual dark/light (after applying system)
  const [resolved, setResolved] = useState("dark");

  useEffect(() => {
    function apply(t) {
      const root = document.documentElement;
      if (t === "dark") {
        root.setAttribute("data-theme", "dark");
        setResolved("dark");
      } else {
        root.setAttribute("data-theme", "light");
        setResolved("light");
      }
    }

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      apply(mq.matches ? "dark" : "light");
      const handler = (e) => apply(e.matches ? "dark" : "light");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    } else {
      apply(theme);
    }
  }, [theme]);

  function setAndSave(t) {
    setTheme(t);
    localStorage.setItem("theme", t);
  }

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme: setAndSave }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
