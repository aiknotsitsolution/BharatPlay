
// import { useEffect, useState } from "react";
// import { NavLink } from "react-router-dom";
// import {
//   LayoutDashboard,
//   Users,
//   ShoppingBag,
//   Package,
//   FolderOpen,
//   Video,
//   Box,
//   Clapperboard,
//   Shield,
//   DollarSign,
//   Headphones,
//   Eye,
// } from "lucide-react";
// import { getNavItems, getRoleMeta, getCurrentRole } from "../../config/roleConfig";
// import { getAdminDisplayName, getAdminPhoto, getInitials } from "../../utils/helpers";

// const ICON_MAP = {
//   LayoutDashboard,
//   Users,
//   ShoppingBag,
//   Package,
//   FolderOpen,
//   Video,
//   Box,
//   Clapperboard,
//   Shield,
//   DollarSign,
//   Headphones,
//   Eye,
// };

// export default function Sidebar({ mobile = false, onNavigate }) {
//   const [userName, setUserName] = useState(getAdminDisplayName());
//   const [photo, setPhoto] = useState(getAdminPhoto());
//   const [role, setRole] = useState(getCurrentRole());

//   useEffect(() => {
//     const syncUser = () => {
//       setUserName(getAdminDisplayName());
//       setPhoto(getAdminPhoto());
//       setRole(getCurrentRole());
//     };
//     syncUser();
//     window.addEventListener("auth-change", syncUser);
//     return () => window.removeEventListener("auth-change", syncUser);
//   }, []);

//   const roleMeta = getRoleMeta(role);
//   const navItems = getNavItems();

//   return (
//     <aside
//       className={`flex h-full w-full flex-col bg-white border-r border-slate-100 ${
//         mobile ? "" : "hidden md:fixed md:inset-y-0 md:z-30 md:w-[260px] md:flex"
//       }`}
//     >
//       {/* Logo / Branding */}
//       <div className="h-[68px] flex items-center px-5 shrink-0 gap-3 border-b border-slate-100">
//         <img
//           src="/Logo-image.jpg"
//           alt="BharatPlay"
//           className="w-9 h-9 rounded-xl object-cover shadow-sm ring-1 ring-slate-100"
//         />
//         <span className="text-[20px] font-bold tracking-tight text-slate-800 font-display">
//           Bharatplay
//         </span>
//       </div>

//       {/* Navigation */}
//       <nav
//         aria-label="Main navigation"
//         className="flex-1 px-3 py-5 space-y-1 overflow-y-auto scrollbar-thin"
//       >
//         {navItems.map((item) => {
//           const Icon = typeof item.icon === "string" ? ICON_MAP[item.icon] : item.icon;
//           return (
//             <NavLink
//               key={item.to}
//               to={item.to}
//               end={item.to === "/"}
//               aria-label={item.label}
//               onClick={onNavigate}
//               className={({ isActive }) =>
//                 `group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-200 ${
//                   isActive
//                     ? "bg-blue-50 text-blue-700 shadow-sm"
//                     : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
//                 }`
//               }
//             >
//               {({ isActive }) => (
//                 <>
//                   {Icon && (
//                     <Icon
//                       className={`w-[18px] h-[18px] shrink-0 transition-colors ${
//                         isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
//                       }`}
//                       strokeWidth={isActive ? 2.2 : 1.8}
//                     />
//                   )}
//                   <span className="truncate">{item.label}</span>
//                 </>
//               )}
//             </NavLink>
//           );
//         })}
//       </nav>

//       {/* Admin Profile */}
//       <div className="px-3 pt-3 pb-5 border-t border-slate-100">
//         <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
//           {photo ? (
//             <img
//               src={photo}
//               alt={userName}
//               className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-white shadow-sm"
//             />
//           ) : (
//             <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-[12px] font-bold shrink-0 shadow-sm">
//               {getInitials(userName)}
//             </div>
//           )}
//           <div className="min-w-0 flex-1">
//             <p className="text-[13.5px] font-semibold text-slate-800 truncate">
//               {userName}
//             </p>
//             <p className="text-[11.5px] font-medium text-slate-400 truncate">
//               {roleMeta.displayName}
//             </p>
//           </div>
//         </div>
//       </div>
//     </aside>
//   );
// }

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
};

export default function Sidebar({ mobile = false, onNavigate }) {
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
    <aside
      className={`
        flex h-full flex-col bg-white border-r border-slate-100
        ${
          mobile
            ? "w-full"
            : "hidden md:flex md:fixed md:inset-y-0 md:left-0 md:z-30 md:w-[260px]"
        }
      `}
    >
      {/* Logo / Branding */}
      <div className="h-[68px] flex items-center px-4 sm:px-5 shrink-0 gap-3 border-b border-slate-100">
        <img
          src="/Logo-image.jpg"
          alt="BharatPlay"
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover shadow-sm ring-1 ring-slate-100"
        />
        <span className="text-[18px] sm:text-[20px] font-bold tracking-tight text-slate-800 font-display">
          Bharatplay
        </span>
      </div>

      {/* Navigation */}
      <nav
        aria-label="Main navigation"
        className="flex-1 px-2 sm:px-3 py-4 sm:py-5 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-thin"
      >
        {navItems.map((item) => {
          const Icon = typeof item.icon === "string" ? ICON_MAP[item.icon] : item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              aria-label={item.label}
              onClick={onNavigate}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] sm:text-[13.5px] font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-blue-50 text-blue-700 shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {Icon && (
                    <Icon
                      className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                        isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                      }`}
                      strokeWidth={isActive ? 2.2 : 1.8}
                    />
                  )}
                  <span className="truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Admin Profile */}
      <div className="px-2 sm:px-3 pt-3 pb-4 sm:pb-5 border-t border-slate-100 shrink-0">
        <div className="flex items-center gap-3 px-2.5 sm:px-3 py-2.5 sm:py-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
          {photo ? (
            <img
              src={photo}
              alt={userName}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shrink-0 ring-2 ring-white shadow-sm"
            />
          ) : (
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] sm:text-[12px] font-bold shrink-0 shadow-sm">
              {getInitials(userName)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[13px] sm:text-[13.5px] font-semibold text-slate-800 truncate">
              {userName}
            </p>
            <p className="text-[11px] sm:text-[11.5px] font-medium text-slate-400 truncate">
              {roleMeta.displayName}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}