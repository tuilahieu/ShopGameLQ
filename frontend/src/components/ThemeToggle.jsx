import { useTheme } from "../context/ThemeContext";
import { Sun, Moon, Monitor } from "lucide-react";

export default function ThemeToggle({ compact = false }) {
  const { theme, resolved, setTheme } = useTheme();

  // Cycle: system → light → dark → system
  function cycle() {
    if (theme === "system") setTheme("light");
    else if (theme === "light") setTheme("dark");
    else setTheme("system");
  }

  const icon = theme === "light"
    ? <Sun size={compact ? 15 : 16} />
    : theme === "dark"
      ? <Moon size={compact ? 15 : 16} />
      : <Monitor size={compact ? 15 : 16} />;

  const label = theme === "light" ? "Sáng" : theme === "dark" ? "Tối" : "Hệ thống";

  return (
    <button
      onClick={cycle}
      title={`Chủ đề: ${label} — bấm để đổi`}
      className="theme-toggle-btn"
      data-compact={compact}
    >
      {icon}
      {!compact && <span>{label}</span>}
    </button>
  );
}
