import { Outlet } from "react-router-dom";
import PublicHeader from "./PublicHeader";
import PublicFooter from "./PublicFooter";

/**
 * Layout for public-facing (no authentication required) pages.
 */
export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0f0f0f] font-sans text-white">
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}