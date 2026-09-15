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

/**
 * Role configuration for the admin panel.
 * Defines which nav items, dashboard routes, and features each role can access.
 */

// ─── NAV ITEMS ────────────────────────────────────────────────
const ALL_NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", roles: ["admin", "finance", "support", "read-only"] },
  { to: "/category", icon: FolderOpen, label: "Category", roles: ["admin"] },
  { to: "/create-employee", icon: Package, label: "Add Employee", roles: ["admin"] },
  { to: "/alluser", icon: Users, label: "Users", roles: ["admin", "finance", "support", "read-only"] },
  { to: "/deleted-users", icon: Users, label: "Deleted Users", roles: ["admin"] },
  { to: "/video", icon: Video, label: "Video", roles: ["admin", "support", "read-only"] },
  { to: "/shorts", icon: Clapperboard, label: "Shorts", roles: ["admin", "support", "read-only"] },
  { to: "/copyright", icon: Shield, label: "Copyright", roles: ["admin", "finance", "support", "read-only"] },
  // { to: "/orders", icon: ShoppingBag, label: "Orders", roles: ["admin"] },
  // { to: "/products", icon: Box, label: "Products", roles: ["admin"] },
];

// ─── ROUTE OVERRIDES ──────────────────────────────────────────
// Maps URL path prefixes to allowed roles for routes whose URL
// does NOT share a prefix with any ALL_NAV_ITEMS entry.
// Checked before the nav-items prefix fallback in canAccessRoute.
const ROUTE_OVERRIDES = [
  // User sub-routes: sidebar nav path is /alluser, but detail/edit use /users/
  { prefix: "/users/", roles: ["admin", "finance", "support", "read-only"] },
  // Uploads: has no sidebar nav item but is a valid content viewing route
  { prefix: "/uploads", roles: ["admin", "finance", "support", "read-only"] },
];

// ─── DASHBOARD ROUTES ─────────────────────────────────────────
const DASHBOARD_ROUTES = {
  admin: "/",
  finance: "/finance-dashboard",
  support: "/support-dashboard",
  "read-only": "/read-only-dashboard",
};

// ─── ROLE METADATA ────────────────────────────────────────────
const ROLE_META = {
  admin: {
    label: "Admin",
    displayName: "Admin",
    color: "text-indigo-400",
    bg: "bg-indigo-500/15",
    borderColor: "border-indigo-500/30",
    icon: Shield,
    description: "Full access to all platform features",
  },
  finance: {
    label: "Finance",
    displayName: "Finance Admin",
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
    borderColor: "border-emerald-500/30",
    icon: DollarSign,
    description: "Financial data and transaction management",
  },
  support: {
    label: "Support",
    displayName: "Support Admin",
    color: "text-blue-400",
    bg: "bg-blue-500/15",
    borderColor: "border-blue-500/30",
    icon: Headphones,
    description: "User assistance and content moderation",
  },
  "read-only": {
    label: "Read-Only",
    displayName: "Viewer",
    color: "text-gray-400",
    bg: "bg-gray-500/15",
    borderColor: "border-gray-500/30",
    icon: Eye,
    description: "View-only access — no modifications",
  },
};

// ─── FEATURE FLAGS ────────────────────────────────────────────
// Controls which action buttons / capabilities are available per role.
const FEATURE_FLAGS = {
  admin: {
    canEditUsers: true,
    canDeleteUsers: true,
    canHardDeleteUsers: true,
    canSuspendUsers: true,
    canBanUsers: true,
    canCreateEmployee: true,
    canManageCategory: true,
    canUploadVideo: true,
    canModerateContent: true,
    // canManageOrders: true,
    // canManageProducts: true,
    canCreateCopyrightCase: true,
    canUpdateCopyrightStatus: true,
    canDeleteCopyright: true,
    canManageSettings: true,
    showActionButtons: true,
    showQuickActions: true,
  },
  finance: {
    canEditUsers: false,
    canDeleteUsers: false,
    canSuspendUsers: false,
    canBanUsers: false,
    canCreateEmployee: false,
    canManageCategory: false,
    canUploadVideo: false,
    canModerateContent: false,
    // canManageOrders: false,
    // canManageProducts: false,
    canCreateCopyrightCase: false,
    canUpdateCopyrightStatus: false,
    canDeleteCopyright: false,
    canManageSettings: false,
    showActionButtons: false,
    showQuickActions: false,
  },
  support: {
    canEditUsers: false,
    canDeleteUsers: false,
    canSuspendUsers: false,
    canBanUsers: false,
    canCreateEmployee: false,
    canManageCategory: false,
    canUploadVideo: false,
    canModerateContent: true,
        // canManageOrders: false,
        // canManageProducts: false,
    canCreateCopyrightCase: true,
    canUpdateCopyrightStatus: true,
    canDeleteCopyright: false,
    canManageSettings: false,
    showActionButtons: true,
    showQuickActions: true,
  },
  "read-only": {
    canEditUsers: false,
    canDeleteUsers: false,
    canSuspendUsers: false,
    canBanUsers: false,
    canCreateEmployee: false,
    canManageCategory: false,
    canUploadVideo: false,
    canModerateContent: false,
    // canManageOrders: false,
    // canManageProducts: false,
    canCreateCopyrightCase: false,
    canUpdateCopyrightStatus: false,
    canDeleteCopyright: false,
    canManageSettings: false,
    showActionButtons: false,
    showQuickActions: false,
  },
};

// ─── HELPER FUNCTIONS ─────────────────────────────────────────

/**
 * Get the current role from localStorage.
 */
export const getCurrentRole = () => {
  try {
    return localStorage.getItem("adminRole") || "admin";
  } catch {
    return "admin";
  }
};

/**
 * Get nav items filtered for the current role.
 */
export const getNavItems = () => {
  const role = getCurrentRole();
  return ALL_NAV_ITEMS.filter((item) => item.roles.includes(role));
};

/**
 * Get the dashboard route for a given role.
 */
export const getDashboardRoute = (role) => {
  return DASHBOARD_ROUTES[role] || DASHBOARD_ROUTES.admin;
};

/**
 * Get role metadata (label, color, icon, etc.).
 */
export const getRoleMeta = (role) => {
  return ROLE_META[role] || ROLE_META.admin;
};

/**
 * Get feature flags for the current role.
 */
export const getFeatureFlags = () => {
  const role = getCurrentRole();
  return FEATURE_FLAGS[role] || FEATURE_FLAGS["read-only"];
};

/**
 * Check if the current role has a specific feature.
 */
export const hasFeature = (featureName) => {
  const flags = getFeatureFlags();
  return flags[featureName] === true;
};

/**
 * Check if the current role can access a given route path.
 */
export const canAccessRoute = (path) => {
  const role = getCurrentRole();

  // Check explicit route overrides first (for paths whose URL prefix
  // differs from the sidebar nav path, e.g. /users/ vs /alluser).
  const override = ROUTE_OVERRIDES.find((o) => path.startsWith(o.prefix));
  if (override) {
    return override.roles.includes(role);
  }

  // Fall back to nav-item prefix matching.
  const item = ALL_NAV_ITEMS.find((nav) => {
    if (nav.to === "/") return path === "/";
    return path.startsWith(nav.to);
  });
  return item ? item.roles.includes(role) : false;
};
