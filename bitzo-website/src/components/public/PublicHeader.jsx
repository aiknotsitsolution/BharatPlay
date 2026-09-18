import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, ArrowRight } from "lucide-react";
import { NAV_LINKS, SITE } from "../../config/site";
import { useTheme } from "../../context/ThemeContext";
import SiteLogo from "./SiteLogo";

export default function PublicHeader() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const check = () => setIsLoggedIn(Boolean(localStorage.getItem("token")));
    check();
    window.addEventListener("storage", check);
    window.addEventListener("auth-change", check);
    return () => {
      window.removeEventListener("storage", check);
      window.removeEventListener("auth-change", check);
    };
  }, []);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  const handleAction = () => {
    navigate(isLoggedIn ? SITE.appPath : "/login");
    closeMenu();
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? isDark
            ? "border-zinc-800/80 bg-[#0f0f0f]/90 backdrop-blur-xl"
            : "border-gray-200/80 bg-white/90 backdrop-blur-xl"
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className={`rounded-lg p-2 transition-colors md:hidden ${
              isDark
                ? "text-zinc-300 hover:bg-[#272727] hover:text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
            aria-expanded={menuOpen}
            aria-controls="public-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <SiteLogo to="/" className="[&_span]:text-lg [&_img]:h-7 [&_img]:w-7" />
        </div>

        <nav aria-label="Primary" className="hidden items-center gap-0.5 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === "/"}
              className={({ isActive }) =>
                `rounded-lg px-7 py-2.5 text-[13px] font-medium transition-colors ${
                  isActive
                    ? isDark
                      ? "text-white bg-white/5"
                      : "text-gray-900 bg-gray-100"
                    : isDark
                      ? "text-zinc-400 hover:text-white hover:bg-white/5"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
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
          className="hidden items-center gap-1.5 rounded-full bg-red-600 px-4 py-1.5 text-[13px] font-medium text-white transition-all hover:bg-red-500 hover:shadow-[0_0_12px_rgba(220,38,38,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 sm:inline-flex"
        >
          {isLoggedIn ? "Open App" : "Sign in"}
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav
          id="public-nav"
          aria-label="Mobile"
          className={`border-t backdrop-blur-xl md:hidden ${
            isDark
              ? "border-zinc-800/80 bg-[#0f0f0f]/95"
              : "border-gray-200/80 bg-white/95"
          }`}
        >
          <div className="flex flex-col px-5 py-3">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === "/"}
                onClick={closeMenu}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? isDark
                        ? "text-white bg-white/5"
                        : "text-gray-900 bg-gray-100"
                      : isDark
                        ? "text-zinc-400 hover:text-white hover:bg-white/5"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
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
