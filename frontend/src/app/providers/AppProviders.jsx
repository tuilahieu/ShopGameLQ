import { ThemeProvider } from "@/context/ThemeContext";

export default function AppProviders({ children }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
