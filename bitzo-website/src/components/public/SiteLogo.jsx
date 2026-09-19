import { Link } from "react-router-dom";
const logo = "/Bharatplay-Cb3qGLyP-Cb3qGLyP-DSDLqCtA.png";
import SITE from "../../config/site";
import { useTheme } from "../../context/ThemeContext";

/**
 * BharatPlay brand lockup used across public pages.
 */
export default function SiteLogo({ to = "/", className = "" }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Link
      to={to}
      className={`flex items-center gap-2.5 ${className}`}
      aria-label={`${SITE.brandName} home`}
    >
      <img
        src={logo}
        alt={`${SITE.brandName} logo`}
        className="h-9 w-9 rounded-xl object-contain"
      />
      <span
        className={`text-xl font-bold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}
      >
        {SITE.brandName}
      </span>
    </Link>
  );
}
