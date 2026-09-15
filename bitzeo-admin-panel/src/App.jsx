// src/App.jsx
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Layout from "./components/layout/Layout";
import RoleGuard from "./components/RoleGuard";
import AdminLogin from "./Admin/pages/Auth/AdminLogin";
import EmployeeLogin from "./Admin/pages/Auth/EmployeeLogin";
import ForgotPassword from "./Admin/pages/Auth/ForgotPassword";
import Dashboard from "./Admin/pages/Dashboard";
import FinanceDashboard from "./FinanceAdmin/Pages/FinanceDashboard";
import SupportDashboard from "./Admin/pages/Support/SupportDashboard";
import ReadOnlyDashboard from "./Admin/pages/ReadOnlyDashbaord/ReadOnlyDashboard";
import Orders from "./Admin/pages/Orders";
import Products from "./Admin/pages/Products";
import NotFound from "./Admin/pages/NotFound";
import VideoUpload from "./Admin/pages/LongVideo/VideoUpload";
import Shorts from "./Admin/pages/ShortsVideo/Shorts";
import CategoryManagement from "./Admin/CategoryManagement/Category";
import AllUsers from "./Admin/Users/AllUser";
import DeletedUsers from "./Admin/Users/DeletedUsers";
import EmployeeRegister from "./Admin/pages/Auth/EmployeeRegister";
import Register from "./Admin/pages/Auth/Register";
import User360 from "./Admin/Users/User360";
import EditUser from "./Admin/Users/EditUser";
import AllUploads from "./Admin/pages/AllUploads";
import CopyrightDashboard from "./Admin/pages/Copyright/CopyrightDashboard";
import CopyrightCaseList from "./Admin/pages/Copyright/CopyrightCaseList";
import CopyrightCaseDetail from "./Admin/pages/Copyright/CopyrightCaseDetail";
import CopyrightStrikeList from "./Admin/pages/Copyright/CopyrightStrikeList";
import CopyrightCreateCase from "./Admin/pages/Copyright/CopyrightCreateCase";
import CopyrightStrikeDetail from "./Admin/pages/Copyright/CopyrightStrikeDetail";
import { getCurrentRole, getDashboardRoute } from "./config/roleConfig";

// ====================== AUTH CHECK ======================
const isAuthenticated = () => {
  return !!localStorage.getItem("adminToken");
};

// ====================== PROTECTED ROUTE ======================
function ProtectedRoute() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

// ====================== PUBLIC ONLY ROUTE ======================
function PublicOnlyRoute() {
  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

// ====================== ROLE DASHBOARD REDIRECT ======================
// When a role-based employee hits "/", redirect to their role dashboard.
function RoleDashboard() {
  const role = getCurrentRole();
  const dashboard = getDashboardRoute(role);
  if (dashboard !== "/") {
    return <Navigate to={dashboard} replace />;
  }
  return <Dashboard />;
}

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#1e1b4b",
            color: "#fff",
          },
          success: {
            iconTheme: {
              primary: "#4f46e5",
              secondary: "#fff",
            },
          },
        }}
      />

      <Routes>
        {/* ================= PUBLIC ROUTES ================= */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/employee-login" element={<EmployeeLogin />} />
          <Route path="/Employeelogin" element={<EmployeeLogin />} />
        </Route>

        {/* ================= PROTECTED ADMIN ROUTES ================= */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            {/* Index — redirects to role-specific dashboard */}
            <Route index element={<RoleDashboard />} />
            <Route path="/" element={<RoleDashboard />} />

            {/* Admin Dashboard (role-aware) */}
            <Route path="/finance-dashboard" element={<FinanceDashboard />} />
            <Route path="/support-dashboard" element={<SupportDashboard />} />
            <Route path="/read-only-dashboard" element={<ReadOnlyDashboard />} />

            {/* ── Content Routes ── */}
            <Route element={<RoleGuard />}>
              <Route path="video" element={<VideoUpload />} />
              <Route path="shorts" element={<Shorts />} />
              <Route path="orders" element={<Orders />} />
              <Route path="products" element={<Products />} />
              <Route path="category" element={<CategoryManagement />} />
              <Route path="uploads" element={<AllUploads />} />
            </Route>

            {/* ── User Management Routes ── */}
            <Route element={<RoleGuard />}>
              <Route path="alluser" element={<AllUsers />} />
              <Route path="deleted-users" element={<DeletedUsers />} />
              <Route path="users/:userId" element={<User360 />} />
            </Route>

            {/* ── User Edit (admin only) ── */}
            <Route element={<RoleGuard requiredFeature="canEditUsers" />}>
              <Route path="users/:userId/edit" element={<EditUser />} />
            </Route>

            {/* ── Employee Routes (admin only) ── */}
            <Route element={<RoleGuard requiredFeature="canCreateEmployee" />}>
              <Route path="/create-employee" element={<EmployeeRegister />} />
            </Route>

            {/* ── Copyright Routes (all roles) ── */}
            <Route element={<RoleGuard />}>
              <Route path="copyright" element={<CopyrightDashboard />} />
              <Route path="copyright/cases" element={<CopyrightCaseList />} />
              <Route path="copyright/cases/:id" element={<CopyrightCaseDetail />} />
              <Route path="copyright/strikes" element={<CopyrightStrikeList />} />
              <Route path="copyright/strikes/:id" element={<CopyrightStrikeDetail />} />
            </Route>

            {/* ── Copyright Create (admin + support only) ── */}
            <Route element={<RoleGuard requiredFeature="canCreateCopyrightCase" />}>
              <Route path="copyright/cases/new" element={<CopyrightCreateCase />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>

        {/* ================= 404 NOT FOUND ================= */}
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
