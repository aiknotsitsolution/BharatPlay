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
import { getAdminDisplayName, getInitials } from "../../utils/helpers";

const ICON_MAP = {
  LayoutDashboard, Users, ShoppingBag, Package, FolderOpen, Video, Box,
  Clapperboard, Shield, DollarSign, Headphones, Eye,
};

export default function Sidebar() {
  const [userName, setUserName] = useState(getAdminDisplayName());
  const [role, setRole] = useState(getCurrentRole());

  useEffect(() => {
    const syncUser = () => {
      setUserName(getAdminDisplayName());
      setRole(getCurrentRole());
    };
    syncUser();
    window.addEventListener("auth-change", syncUser);
    return () => window.removeEventListener("auth-change", syncUser);
  }, []);

  const roleMeta = getRoleMeta(role);
  const navItems = getNavItems();

  return (
    <aside className="hidden md:flex md:flex-col md:w-[260px] sidebar-gradient md:fixed md:inset-y-0 z-30">
      {/* Logo / Branding */}
      <div className="h-[76px] flex items-center px-5 shrink-0 gap-3">
        <img src="/Logo-image.jpg" alt="BharatPlay" className="w-10 h-10 rounded-lg object-cover shadow-md ring-1 ring-white/10" />
        <span className="text-[19px] font-bold tracking-tight text-bp-text">
          Bharat<span style={{ background: "linear-gradient(135deg, #FF6A00, #FFC400, #00D9FF, #008CFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>play</span>
        </span>
      </div>

      {/* Divider below branding */}
      <div className="sidebar-divider" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const Icon = typeof item.icon === "string" ? ICON_MAP[item.icon] : item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `sidebar-nav-item relative ${isActive ? "active" : ""}`
              }
            >
              {Icon && <Icon className="w-[18px] h-[18px] shrink-0" />}
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Divider above profile */}
      <div className="sidebar-divider" />

      {/* Admin Profile */}
      <div className="px-3 py-2">
        <div className="p-3 rounded-xl bg-bp-surface border border-bp-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-bp-blue to-bp-cyan flex items-center justify-center text-white text-[11px] font-bold shrink-0">
              {getInitials(userName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-bp-text truncate">{userName}</p>
              <p className={`text-[11px] font-medium ${roleMeta.color}`}>{roleMeta.displayName}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
