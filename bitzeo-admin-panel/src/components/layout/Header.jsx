import { Bell, Menu, Sun, Moon, ChevronDown, User, LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentRole, getRoleMeta } from "../../config/roleConfig";
import { getAdminDisplayName, getInitials, getAdminPhoto } from "../../utils/helpers";
import { useTheme } from "../../context/ThemeContext";
import { clearAdminState } from "../../utils/session";
import API from "../../api";

export default function Header({ toggleSidebar }) {
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

  return (
    <header className="header-glass sticky top-0 z-20">
      <div className="flex items-center justify-between h-[64px] px-6">
        {/* Left: Mobile menu button */}
        <div className="flex items-center">
          <button
            className="md:hidden p-2 rounded-lg text-bp-text-muted hover:text-bp-text hover:bg-bp-hover transition-colors"
            onClick={toggleSidebar}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-1.5">
          {/* Role badge */}
          <div className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-md border ${roleMeta.bg} ${roleMeta.color} ${roleMeta.borderColor}`}>
            {roleMeta.icon && <roleMeta.icon className="w-3 h-3" />}
            {roleMeta.label}
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-bp-text-muted hover:text-bp-text hover:bg-bp-hover transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          </button>

          {/* Notifications */}
          <button onClick={() => navigate("/notifications")} className="relative p-2 rounded-lg text-bp-text-muted hover:text-bp-text hover:bg-bp-hover transition-colors" aria-label="Notifications">
            <Bell className="w-[18px] h-[18px]" />
            <span className="absolute top-[7px] right-[7px] w-2 h-2 rounded-full bg-bp-orange ring-2 ring-bp-card" />
          </button>

          {/* Separator */}
          <div className="w-px h-6 bg-bp-border mx-1 hidden sm:block" />

          {/* User + dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 hover:bg-bp-hover rounded-lg px-2 py-1.5 transition-colors"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                {avatar ? (
                  <img src={avatar} alt={userName} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-bp-blue to-bp-cyan flex items-center justify-center text-white text-[11px] font-bold">
                    {getInitials(userName)}
                  </div>
                )}
              </div>
              <span className="hidden sm:inline text-[13px] font-medium text-bp-text truncate max-w-[140px]">
                {userName}
              </span>
              <ChevronDown size={14} className={`hidden sm:block text-bp-text-muted transition-transform duration-200 ${showUserMenu ? "rotate-180" : ""}`} />
            </button>
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-bp-card border border-bp-border/60 rounded-xl shadow-2xl z-50 p-1.5">
                <button
                  onClick={() => goTo("/profile")}
                  className="w-full text-left px-3 py-2 text-sm rounded-lg flex items-center gap-2.5 text-bp-text hover:bg-bp-hover transition-colors duration-150"
                >
                  <User size={15} className="text-bp-text-secondary" />
                  <span className="font-medium">Profile</span>
                </button>
                <button
                  onClick={() => goTo("/notifications")}
                  className="w-full text-left px-3 py-2 text-sm rounded-lg flex items-center gap-2.5 text-bp-text hover:bg-bp-hover transition-colors duration-150"
                >
                  <Bell size={15} className="text-bp-text-secondary" />
                  <span className="font-medium">Notifications</span>
                </button>
                <div className="my-1.5 h-px bg-bp-border/60" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm rounded-lg flex items-center gap-2.5 text-red-400 hover:bg-red-500/10 transition-colors duration-150"
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
