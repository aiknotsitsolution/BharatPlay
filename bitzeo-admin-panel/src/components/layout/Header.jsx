

import { Bell, Sun, Moon, ChevronDown, User, LogOut, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentRole, getRoleMeta } from "../../config/roleConfig";
import { getAdminDisplayName, getInitials, getAdminPhoto } from "../../utils/helpers";
import { useTheme } from "../../context/ThemeContext";
import { clearAdminState } from "../../utils/session";
import API from "../../api";

export default function Header({ sidebarOpen, toggleSidebar }) {
  const navigate = useNavigate();
  const [userName, setUserName] = useState(getAdminDisplayName());
  const [avatar, setAvatar] = useState(getAdminPhoto());
  const [role, setRole] = useState(getCurrentRole());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const syncUser = () => {
      setUserName(getAdminDisplayName());
      setAvatar(getAdminPhoto());
      setRole(getCurrentRole());
    };
    syncUser();
    window.addEventListener("auth-change", syncUser);
    return () => window.removeEventListener("auth-change", syncUser);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setShowUserMenu(false);
    try {
      await API.post("/admin/logout", {}).catch(() => {});
    } catch (_) {}
    clearAdminState();
    navigate("/login");
  };

  const goTo = (path) => {
    setShowUserMenu(false);
    navigate(path);
  };

  const roleMeta = getRoleMeta(role);

  return (
    <header className="sticky top-0 z-20 bg-bp-card/85 backdrop-blur-md border-b border-bp-border/60">
      <div className="flex h-14 items-center justify-between gap-2 px-3 sm:h-16 sm:px-6">
  {/* Mobile menu button – left side */}
  <button
    type="button"
    onClick={toggleSidebar}
    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-bp-text-secondary transition-colors hover:bg-bp-hover md:hidden"
    aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
    aria-expanded={sidebarOpen}
    aria-controls="mobile-navigation"
  >
    {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
  </button>

  {/* Right side controls – always pushed to the right */}
  <div className="ml-auto flex min-w-0 items-center justify-end gap-1.5 sm:gap-3">
    {/* Role badge */}
    <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-semibold rounded-full bg-bp-elevated text-bp-text-secondary border border-bp-border/60">
      {roleMeta.icon && <roleMeta.icon className="w-3 h-3" />}
      {roleMeta.label}
    </div>

    {/* Theme toggle */}
    <button
      onClick={toggleTheme}
      className="relative w-9 h-9 rounded-full bg-bp-elevated border border-bp-border/60 flex items-center justify-center text-bp-text-secondary hover:text-bp-blue hover:bg-bp-hover transition-all duration-150"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="w-[17px] h-[17px]" />
      ) : (
        <Moon className="w-[17px] h-[17px]" />
      )}
    </button>

    {/* Notifications */}
    <button
      onClick={() => navigate("/notifications")}
      className="relative w-9 h-9 rounded-full bg-bp-elevated border border-bp-border/60 flex items-center justify-center text-bp-text-secondary hover:text-bp-blue hover:bg-bp-hover transition-all duration-150"
      aria-label="Notifications"
    >
      <Bell className="w-[17px] h-[17px]" />
      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-bp-card" />
    </button>

    {/* Separator */}
    <div className="w-px h-6 mx-0.5 hidden sm:block bg-bp-border/60" />

    {/* User + dropdown */}
    <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={showUserMenu}
            className="flex min-w-0 items-center gap-1.5 rounded-xl px-1 sm:gap-2.5 sm:px-2 py-1.5 hover:bg-bp-hover transition-colors duration-150"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-bp-border/60 shadow-sm">
              {avatar ? (
                <img
                  src={avatar}
                  alt={userName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold">
                  {getInitials(userName)}
                </div>
              )}
            </div>

            <span className="inline max-w-[72px] truncate text-[11px] font-semibold text-bp-text sm:max-w-[140px] sm:text-[13px]">
              {userName}
            </span>

            <ChevronDown
              size={14}
              className={`hidden sm:block text-bp-text-muted transition-transform duration-200 ${
                showUserMenu ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-bp-card border border-bp-border/60 rounded-xl shadow-lg z-50 p-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
              <button
                onClick={() => goTo("/profile")}
                className="w-full text-left px-3 py-2.5 text-[13px] rounded-lg flex items-center gap-2.5 text-bp-text-secondary hover:bg-bp-hover transition-colors"
              >
                <User size={15} className="text-bp-text-muted" />
                <span className="font-medium">Profile</span>
              </button>

              <button
                onClick={() => goTo("/notifications")}
                className="w-full text-left px-3 py-2.5 text-[13px] rounded-lg flex items-center gap-2.5 text-bp-text-secondary hover:bg-bp-hover transition-colors"
              >
                <Bell size={15} className="text-bp-text-muted" />
                <span className="font-medium">Notifications</span>
              </button>

              <div className="my-1.5 h-px bg-bp-border/60" />

              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2.5 text-[13px] rounded-lg flex items-center gap-2.5 text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={15} />
                <span className="font-medium">Log out</span>
              </button>
            </div>
          )}
        </div>
        </div>
      </div>
    </header>
  );
}