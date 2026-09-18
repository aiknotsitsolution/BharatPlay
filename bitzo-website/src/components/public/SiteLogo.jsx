import { Link } from "react-router-dom";
import logo from "../../../public/Bharatplay-Cb3qGLyP-Cb3qGLyP-DSDLqCtA.png";
import SITE from "../../config/site";

/**
 * BharatPlay brand lockup used across public pages.
 */
export default function SiteLogo({ to = "/", className = "" }) {
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
      <span className="text-xl font-bold tracking-tight text-white">
        {SITE.brandName}
      </span>
    </Link>
  );
}