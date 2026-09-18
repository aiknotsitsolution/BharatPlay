import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, ArrowRight } from "lucide-react";
import { NAV_LINKS, SITE } from "../../config/site";
import SiteLogo from "./SiteLogo";

/**
 * Public marketing header. Lightweight, does not depend on the app's navbar,
 * search or notifications. Shows a Sign in / Open App action depending on
 * whether the visitor is authenticated in the web app.
 */
export default function PublicHeader() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const check = () =>
      setIsLoggedIn(Boolean(localStorage.getItem("token")));
    check();
    window.addEventListener("storage", check);
    window.addEventListener("auth-change", check);
    return () => {
      window.removeEventListener("storage", check);
      window.removeEventListener("auth-change", check);
    };
  }, []);

  const closeMenu = () => setMenuOpen(false);

  const handleAction = () => {
    navigate(isLoggedIn ? SITE.appPath : "/login");
    closeMenu();
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0f0f0f]/90 backdrop-blur-xl border-b border-zinc-800/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-lg p-2 text-zinc-300 transition-colors hover:bg-[#272727] hover:text-white md:hidden"
            aria-expanded={menuOpen}
            aria-controls="public-nav"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <SiteLogo to="/" />
        </div>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === "/"}
              className={({ isActive }) =>
                `rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-white bg-[#272727]"
                    : "text-zinc-400 hover:text-white hover:bg-[#1c1c1c]"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={handleAction}
          className="hidden items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 sm:inline-flex"
        >
          {isLoggedIn ? "Open App" : "Sign in"}
          <ArrowRight size={15} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav
          id="public-nav"
          aria-label="Mobile"
          className="border-t border-zinc-800 bg-[#0f0f0f] px-4 py-3 md:hidden"
        >
          <div className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === "/"}
                onClick={closeMenu}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "text-white bg-[#272727]"
                      : "text-zinc-400 hover:text-white hover:bg-[#1c1c1c]"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={handleAction}
              className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-500"
            >
              {isLoggedIn ? "Open App" : "Sign in"}
              <ArrowRight size={15} />
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}