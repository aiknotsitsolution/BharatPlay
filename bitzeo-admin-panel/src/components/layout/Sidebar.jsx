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
//           alt="VidBuxApp"
//           className="w-9 h-9 rounded-xl object-cover shadow-sm ring-1 ring-slate-100"
//         />
//         <span className="text-[20px] font-bold tracking-tight text-slate-800 font-display">
//           VidBuxApp
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
  LayoutGrid,
  Shapes,
  UserPlus,
  UsersRound,
  UserX,
  MonitorPlay,
  Zap,
  LifeBuoy,
  Copyright,
  MessagesSquare,
  Trash2,
  Inbox,
} from "lucide-react";
import {
  getNavItems,
  getRoleMeta,
  getCurrentRole,
} from "../../config/roleConfig";
import {
  getAdminDisplayName,
  getAdminPhoto,
  getInitials,
} from "../../utils/helpers";

const ICON_MAP = {
  LayoutGrid,
  Shapes,
  UserPlus,
  UsersRound,
  UserX,
  MonitorPlay,
  Zap,
  LifeBuoy,
  Copyright,
  MessagesSquare,
  Trash2,
  Inbox,
};

// MaterialM-style section headings. Items are bucketed by route —
// role filtering still comes from getNavItems(), so hidden items
// simply leave their section empty (empty sections are skipped).
const GROUPS = [
  { title: "Main", routes: ["/"] },
  {
    title: "Management",
    routes: [
      "/category",
      "/create-employee",
      "/alluser",
      "/deleted-users",
    ],
  },
  { title: "Content", routes: ["/video", "/shorts"] },
  {
    title: "Support",
    routes: [
      "/support-dashboard",
      "/my-tickets",
      "/copyright/cases",
      "/support/contact",
      "/support/deletion",
    ],
  },
];

const groupOf = (item) =>
  GROUPS.find((group) => group.routes.includes(item.to))?.title;

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

  // Bucket the role-filtered items into MaterialM-style sections.
  const sections = GROUPS.map((group) => ({
    ...group,
    items: navItems.filter((item) => groupOf(item) === group.title),
  })).filter((group) => group.items.length > 0);

  const ungrouped = navItems.filter((item) => !groupOf(item));
  if (ungrouped.length > 0) {
    sections.push({ title: "More", items: ungrouped });
  }

  const renderItems = (items) =>
    items.map((item) => {
      const Icon =
        typeof item.icon === "string" ? ICON_MAP[item.icon] : item.icon;
      return (
        <NavLink
          key={`${item.to}-${item.label}`}
          to={item.to}
          end={item.to === "/"}
          aria-label={item.label}
          onClick={onNavigate}
          className={({ isActive }) =>
            `group flex items-center gap-3.5 rounded-full px-4 py-3 text-[15px] font-medium transition-all duration-200 ${
              isActive
                ? "bg-bp-primary-soft text-bp-blue shadow-sm"
                : "text-bp-text-secondary hover:bg-bp-hover hover:text-bp-text"
            }`
          }
        >
          {({ isActive }) => (
            <>
              {Icon && (
                <Icon
                  className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                    isActive
                      ? "text-bp-blue"
                      : "text-bp-text-secondary group-hover:text-bp-text"
                  }`}
                  strokeWidth={isActive ? 2.1 : 1.8}
                />
              )}
              <span className="truncate">{item.label}</span>
            </>
          )}
        </NavLink>
      );
    });

  return (
    <aside
      className={`
        flex h-full flex-col bg-bp-card border-r border-bp-border/60
        ${
          mobile
            ? "w-full"
            : "hidden md:flex md:fixed md:inset-y-0 md:left-0 md:z-30 md:w-[280px]"
        }
      `}
    >
      {/* Logo / Branding — height matches the header bar, logo centered */}
      <div className="relative flex h-16 shrink-0 items-center justify-center overflow-hidden border-b border-bp-border/60 px-4 sm:px-5">
        {/* paper artwork — clipped by the bar */}
        <span className="pa pa-fan-tr pa-blue" aria-hidden="true" />
        <span
          className="pa pa-diamond pa-diamond-sm pa-violet"
          style={{ top: -20, left: -20 }}
          aria-hidden="true"
        />
        <img
          src="/VidBuxApp-logo.png"
          alt="VidBuxApp"
          className="relative h-11 w-auto max-w-[165px] object-contain sm:h-12"
        />
      </div>

      {/* Navigation — MaterialM-style grouped sections */}
      <nav
        aria-label="Main navigation"
        className="flex-1 px-4 py-4 overflow-y-auto overflow-x-hidden scrollbar-thin"
      >
        {sections.map((section) => (
          <div key={section.title} className="mb-5 last:mb-1">
            <div className="px-4 pb-2.5 pt-1">
              <span className="text-[15px] font-semibold text-bp-text">
                {section.title}
              </span>
            </div>
            <div className="space-y-1.5">{renderItems(section.items)}</div>
          </div>
        ))}
      </nav>

      {/* Admin Profile — with paper artwork */}
      <div className="relative shrink-0 overflow-hidden border-t border-bp-border/60 px-2 pb-4 pt-3 sm:px-3 sm:pb-5">
        {/* paper artwork — clipped by the bar */}
        <span className="pa pa-fan-br pa-cyan" aria-hidden="true" />
        <span className="pa pa-ribbon pa-ribbon-a pa-pink" aria-hidden="true" />
        <span
          className="pa pa-diamond pa-diamond-sm pa-amber"
          style={{ top: -22, right: -18 }}
          aria-hidden="true"
        />
        <div className="relative flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-bp-hover sm:px-3 sm:py-3">
          {photo ? (
            <img
              src={photo}
              alt={userName}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shrink-0 ring-2 ring-bp-border/60 shadow-sm"
            />
          ) : (
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] sm:text-[12px] font-bold shrink-0 shadow-sm">
              {getInitials(userName)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[13px] sm:text-[13.5px] font-semibold text-bp-text truncate">
              {userName}
            </p>
            <p className="text-[11px] sm:text-[11.5px] font-medium text-bp-text-muted truncate">
              {roleMeta.displayName}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
