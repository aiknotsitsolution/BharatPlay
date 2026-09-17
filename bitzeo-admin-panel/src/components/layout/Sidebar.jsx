import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Package,
  FolderOpen,
  Video,
  Box,
  Clapperboard,
  Shield,
  DollarSign,
  Headphones,
  Eye,
} from "lucide-react";
import { getNavItems, getRoleMeta, getCurrentRole } from "../../config/roleConfig";
import { getAdminDisplayName, getAdminPhoto, getInitials } from "../../utils/helpers";

const ICON_MAP = {
  LayoutDashboard, Users, ShoppingBag, Package, FolderOpen, Video, Box,
  Clapperboard, Shield, DollarSign, Headphones, Eye,
};

export default function Sidebar() {
  const [userName, setUserName] = useState(getAdminDisplayName());
  const [photo, setPhoto] = useState(getAdminPhoto());
  const [role, setRole] = useState(getCurrentRole());

  useEffect(() => {
    const syncUser = () => {
      setUserName(getAdminDisplayName());
      setPhoto(getAdminPhoto());
      setRole(getCurrentRole());
    };
    syncUser();
    window.addEventListener("auth-change", syncUser);
    return () => window.removeEventListener("auth-change", syncUser);
  }, []);

  const roleMeta = getRoleMeta(role);
  const navItems = getNavItems();

  return (
    <aside className="hidden md:flex md:flex-col md:w-[264px] sidebar-gradient md:fixed md:inset-y-0 z-30">
      {/* Logo / Branding */}
      <div className="h-[64px] flex items-center px-5 shrink-0 gap-3 border-b border-bp-border">
        <img src="/Logo-image.jpg" alt="BharatPlay" className="w-9 h-9 rounded-lg object-cover ring-1 ring-bp-border bg-bp-elevated" />
        <span className="brand-wordmark text-[21px] font-black tracking-tight font-display">
          Bharatplay
        </span>
      </div>

      {/* Navigation */}
      <nav
        aria-label="Main navigation"
        className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin"
      >
        {navItems.map((item) => {
          const Icon = typeof item.icon === "string" ? ICON_MAP[item.icon] : item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              aria-label={item.label}
              className={({ isActive }) =>
                `sidebar-nav-item ${isActive ? "active" : ""}`
              }
            >
              {Icon && <Icon className="w-[18px] h-[18px] shrink-0" />}
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Admin Profile */}
      <div className="px-3 pt-3 pb-4 border-t border-bp-border">
        <div className="px-2 py-2.5 rounded-xl">
          <div className="flex items-center gap-3">
            {photo ? (
              <img src={photo} alt={userName} className="w-9 h-9 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-bp-navy text-white flex items-center justify-center text-[11px] font-bold font-display shrink-0">
                {getInitials(userName)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-bp-text truncate">{userName}</p>
              <p className="text-[11px] font-medium text-bp-text-muted truncate">{roleMeta.displayName}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}