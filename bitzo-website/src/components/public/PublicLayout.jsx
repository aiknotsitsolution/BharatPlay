import { Outlet } from "react-router-dom";
import { ThemeProvider, useTheme } from "../../context/ThemeContext";
import PublicHeader from "./PublicHeader";
import PublicFooter from "./PublicFooter";

function LayoutInner() {
  const { theme } = useTheme();
  return (
    <div
      className={`flex min-h-screen flex-col font-sans transition-colors duration-300 ${
        theme === "dark"
          ? "bg-[#0f0f0f] text-white"
          : "bg-[#f5f5f5] text-gray-900"
      }`}
    >
      <PublicHeader />
      <main className="flex-1 pt-14">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}

export default function PublicLayout() {
  return (
    <ThemeProvider>
      <LayoutInner />
    </ThemeProvider>
  );
}
