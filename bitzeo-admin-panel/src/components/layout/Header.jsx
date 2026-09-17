import { Bell, Sun, Moon, ChevronDown, User, LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentRole, getRoleMeta } from "../../config/roleConfig";
import { getAdminDisplayName, getInitials, getAdminPhoto } from "../../utils/helpers";
import { useTheme } from "../../context/ThemeContext";
import { clearAdminState } from "../../utils/session";
import API from "../../api";

export default function Header() {
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
    try { await API.post("/admin/logout", {}).catch(() => {}); } catch (_) {}
    clearAdminState();
    navigate("/login");
  };

  const goTo = (path) => {
    setShowUserMenu(false);
    navigate(path);
  };

  const roleMeta = getRoleMeta(role);
  const isLight = theme === "light";

  const roundBtn = isLight
    ? "relative w-9 h-9 rounded-full bg-bp-elevated border border-bp-border flex items-center justify-center text-bp-text-secondary hover:text-bp-text hover:bg-bp-hover transition-all duration-150"
    : "relative w-9 h-9 rounded-full bg-white/[0.07] border border-white/[0.08] flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.12] transition-all duration-150";

  return (
    <header className="header-glass sticky top-0 z-20">
      <div className="flex items-center justify-between h-[64px] px-4 sm:px-6">
        {/* Right: Controls */}
        <div className="flex items-center justify-end w-full gap-2 sm:gap-3">
          {/* Role badge */}
          <div className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-full border ${isLight ? "bg-bp-elevated text-bp-text-secondary border-bp-border" : "bg-white/[0.08] text-white/80 border-white/[0.06]"}`}>
            {roleMeta.icon && <roleMeta.icon className="w-3 h-3" />}
            {roleMeta.label}
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className={roundBtn}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          </button>

          {/* Notifications */}
          <button
            onClick={() => navigate("/notifications")}
            className={roundBtn}
            aria-label="Notifications"
          >
            <Bell className="w-[18px] h-[18px]" />
            <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-alert ring-2 ring-bp-card" />
          </button>

          {/* Separator */}
          <div className={`w-px h-6 mx-1 hidden sm:block ${isLight ? "bg-bp-border" : "bg-white/[0.1]"}`} />

          {/* User + dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-haspopup="menu"
              aria-expanded={showUserMenu}
              className={`flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors ${isLight ? "hover:bg-bp-hover" : "hover:bg-white/[0.06]"}`}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                {avatar ? (
                  <img src={avatar} alt={userName} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-bp-navy text-white flex items-center justify-center text-[11px] font-bold font-display">
                    {getInitials(userName)}
                  </div>
                )}
              </div>
              <span className={`hidden sm:inline text-[13px] font-semibold truncate max-w-[140px] ${isLight ? "text-bp-text" : "text-white/90"}`}>
                {userName}
              </span>
              <ChevronDown size={14} className={`hidden sm:block transition-transform duration-200 ${showUserMenu ? "rotate-180" : ""} ${isLight ? "text-bp-text-muted" : "text-white/40"}`} />
            </button>
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-bp-card border border-bp-border rounded-xl shadow-lg z-50 p-1.5">
                <button
                  onClick={() => goTo("/profile")}
                  className="w-full text-left px-3 py-2 text-sm rounded-lg flex items-center gap-2.5 text-bp-text hover:bg-bp-elevated transition-colors duration-150"
                >
                  <User size={15} className="text-bp-text-secondary" />
                  <span className="font-medium">Profile</span>
                </button>
                <button
                  onClick={() => goTo("/notifications")}
                  className="w-full text-left px-3 py-2 text-sm rounded-lg flex items-center gap-2.5 text-bp-text hover:bg-bp-elevated transition-colors duration-150"
                >
                  <Bell size={15} className="text-bp-text-secondary" />
                  <span className="font-medium">Notifications</span>
                </button>
                <div className="my-1.5 h-px bg-bp-border" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm rounded-lg flex items-center gap-2.5 text-alert hover:bg-red-500/10 transition-colors duration-150"
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