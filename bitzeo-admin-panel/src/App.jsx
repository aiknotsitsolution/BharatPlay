import { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useSearchParams,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./context/ThemeContext";

import RoleGuard from "./components/RoleGuard";
import IntroScreen from "./components/IntroScreen";
import FlowerCelebration from "./components/FlowerCelebration";
import { getCurrentRole, getDashboardRoute } from "./config/roleConfig";

const Layout = lazy(() => import("./components/layout/Layout"));
const AdminLogin = lazy(() => import("./Admin/pages/Auth/AdminLogin"));
const EmployeeLogin = lazy(() => import("./Admin/pages/Auth/EmployeeLogin"));
const ForgotPassword = lazy(() => import("./Admin/pages/Auth/ForgotPassword"));
const Dashboard = lazy(() => import("./Admin/pages/Dashboard"));
const FinanceDashboard = lazy(() => import("./FinanceAdmin/Pages/FinanceDashboard"));
const SupportDashboard = lazy(() => import("./Admin/pages/Support/SupportDashboard"));
const ReadOnlyDashboard = lazy(() => import("./Admin/pages/ReadOnlyDashbaord/ReadOnlyDashboard"));
const Orders = lazy(() => import("./Admin/pages/Orders"));
const Products = lazy(() => import("./Admin/pages/Products"));
const NotFound = lazy(() => import("./Admin/pages/NotFound"));
const VideoUpload = lazy(() => import("./Admin/pages/LongVideo/VideoUpload"));
const Shorts = lazy(() => import("./Admin/pages/ShortsVideo/Shorts"));
const CategoryManagement = lazy(() => import("./Admin/CategoryManagement/Category"));
const AllUsers = lazy(() => import("./Admin/Users/AllUser"));
const DeletedUsers = lazy(() => import("./Admin/Users/DeletedUsers"));
const EmployeeRegister = lazy(() => import("./Admin/pages/Auth/EmployeeRegister"));
const Register = lazy(() => import("./Admin/pages/Auth/Register"));
const User360 = lazy(() => import("./Admin/Users/User360"));
const EditUser = lazy(() => import("./Admin/Users/EditUser"));
const AllUploads = lazy(() => import("./Admin/pages/AllUploads"));
const Notifications = lazy(() => import("./Admin/pages/Notifications"));
const Profile = lazy(() => import("./Admin/pages/Profile"));
const CopyrightCaseList = lazy(() => import("./Admin/pages/Copyright/CopyrightCaseList"));
const CopyrightCaseReview = lazy(() =>
  import("./Admin/pages/Copyright/CopyrightCaseList").then((module) => ({
    default: module.CopyrightCaseReview,
  })),
);
const CopyrightStrikeList = lazy(() => import("./Admin/pages/Copyright/CopyrightStrikeList"));
const CopyrightCreateCase = lazy(() => import("./Admin/pages/Copyright/CopyrightCreateCase"));
const CopyrightStrikeDetail = lazy(() => import("./Admin/pages/Copyright/CopyrightStrikeDetail"));
const ContactRequestDetail = lazy(() => import("./Admin/pages/Support/ContactRequestDetail"));
const DeletionRequestDetail = lazy(() => import("./Admin/pages/Support/DeletionRequestDetail"));
const ContactRequestList = lazy(() => import("./Admin/pages/Support/ContactRequestList"));
const DeletionRequestList = lazy(() => import("./Admin/pages/Support/DeletionRequestList"));
const MyTickets = lazy(() => import("./Admin/pages/Support/MyTickets"));

const isAuthenticated = () => {
  return !!localStorage.getItem("adminToken");
};

function ProtectedRoute() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

function PublicOnlyRoute() {
  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

function RoleDashboard() {
  const role = getCurrentRole();
  const dashboard = getDashboardRoute(role);
  if (dashboard !== "/") {
    return <Navigate to={dashboard} replace />;
  }
  return <Dashboard />;
}

// Legacy URLs (old sidebar paths) now open the corresponding Support
// Management tab while preserving any existing query params (e.g. status).
function TabRedirect({ tab }) {
  const [searchParams] = useSearchParams();
  const next = new URLSearchParams(searchParams);
  next.set("tab", tab);
  return <Navigate to={`/support-dashboard?${next.toString()}`} replace />;
}

// Support employees get these as full pages (their sidebar links here);
// other roles keep the legacy tab-redirect behaviour.
function SupportContactPage() {
  const role = getCurrentRole();
  if (role === "support" || role === "admin") return <ContactRequestList />;
  return <TabRedirect tab="contact" />;
}

function SupportDeletionPage() {
  const role = getCurrentRole();
  if (role === "support" || role === "admin") return <DeletionRequestList />;
  return <TabRedirect tab="deletion" />;
}

function App() {
  return (
    <BrowserRouter>
      <IntroScreen />
      <FlowerCelebration />
      <ThemeProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "var(--bp-card)",
              color: "var(--bp-text)",
              border: "1px solid var(--bp-border)",
            },
            success: {
              iconTheme: {
                primary: "#4F46E5",
                secondary: "#fff",
              },
            },
          }}
        />

        <Suspense
          fallback={
            <div
              className="flex min-h-screen items-center justify-center bg-[#080B14] text-sm text-gray-300"
              role="status"
            >
              Loading page...
            </div>
          }
        >
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
              <Route index element={<RoleDashboard />} />
              <Route path="/" element={<RoleDashboard />} />

              <Route path="/finance-dashboard" element={<FinanceDashboard />} />
              <Route path="/support-dashboard" element={<SupportDashboard />} />
              <Route path="/read-only-dashboard" element={<ReadOnlyDashboard />} />

              {/* ── Account Routes (all authenticated roles) ── */}
              <Route path="notifications" element={<Notifications />} />
              <Route path="profile" element={<Profile />} />

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

              {/* ── Copyright + Support tabs redirect into Support Management ── */}
              <Route element={<RoleGuard />}>
                <Route path="copyright" element={<TabRedirect tab="copyright" />} />
                <Route path="copyright/cases" element={<CopyrightCaseList />} />
                <Route path="copyright/cases/:id" element={<CopyrightCaseReview />} />
                <Route path="copyright/strikes" element={<CopyrightStrikeList />} />
                <Route path="copyright/strikes/:id" element={<CopyrightStrikeDetail />} />
              </Route>

              {/* ── Copyright Create (admin + support only) ── */}
              <Route element={<RoleGuard requiredFeature="canCreateCopyrightCase" />}>
                <Route path="copyright/cases/new" element={<CopyrightCreateCase />} />
              </Route>

              {/* ── Support detail routes (admin + support) ── */}
              <Route element={<RoleGuard />}>
                <Route path="support/contact" element={<SupportContactPage />} />
                <Route path="support/contact/:id" element={<ContactRequestDetail />} />
                <Route path="support/deletion" element={<SupportDeletionPage />} />
                <Route path="support/deletion/:id" element={<DeletionRequestDetail />} />
              </Route>

              {/* ── Support employee: personal ticket queue ── */}
              <Route element={<RoleGuard />}>
                <Route path="my-tickets" element={<MyTickets />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>

          {/* ================= 404 NOT FOUND ================= */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        </Suspense>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
