import { Bell, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { getCurrentRole, getRoleMeta } from "../../config/roleConfig";

const getAdminDisplayName = () => {
  try {
    const savedUser = JSON.parse(localStorage.getItem("adminUser") || "null");
    return savedUser?.name || "Admin";
  } catch {
    return "Admin";
  }
};

const getInitials = (name) => {
  if (!name) return "A";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() || "").join("") || "A";
};

export default function Header({ toggleSidebar }) {
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

  return (
    <header className="bg-gray-950 border-b border-gray-800 sticky top-0 z-20">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        <button
          className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          onClick={toggleSidebar}
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 ml-auto">
          {/* Role Badge */}
          <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border ${roleMeta.bg} ${roleMeta.color} ${roleMeta.borderColor}`}>
            {roleMeta.icon && <roleMeta.icon className="w-3.5 h-3.5" />}
            {roleMeta.label}
          </div>

          <button
            className="relative p-2 rounded-full text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
          </button>

          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-indigo-500/20">
            {getInitials(userName)}
          </div>
          <span className="hidden sm:inline font-medium text-gray-200 truncate max-w-[160px]">
            {userName}
          </span>
        </div>
      </div>
    </header>
  );
}
