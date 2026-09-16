import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getCurrentRole, getDashboardRoute, canAccessRoute, hasFeature } from "../config/roleConfig";
import { ShieldOff } from "lucide-react";

export default function RoleGuard({ requiredFeature }) {
  const role = getCurrentRole();
  const location = useLocation();

  if (requiredFeature) {
    if (!hasFeature(requiredFeature)) {
      return <UnauthorizedPage role={role} message="You don't have permission to access this feature." />;
    }
  }

  if (!canAccessRoute(location.pathname)) {
    return <UnauthorizedPage role={role} />;
  }

  return <Outlet />;
}

function UnauthorizedPage({ role, message }) {
  const dashboardRoute = getDashboardRoute(role);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4 max-w-md">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
          <ShieldOff className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white">Access Denied</h2>
        <p className="text-bp-text-secondary">
          {message || "You don't have permission to access this page."}
        </p>
        <p className="text-sm text-bp-text-muted">
          Your role: <span className="text-white font-medium capitalize">{role}</span>
        </p>
        <a
          href={dashboardRoute}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-bp-blue hover:bg-bp-cyan text-white text-sm font-medium rounded-xl transition-colors"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}
