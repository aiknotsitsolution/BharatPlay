// import { useState } from "react"
// import { Outlet } from "react-router-dom"
// import Sidebar from "./Sidebar"
// import Header from "./Header"

// export default function Layout() {
//   const [sidebarOpen, setSidebarOpen] = useState(false)

//   return (
//     <div className="min-h-screen page-bg-gradient">
//       <Sidebar />

//       {/* Mobile overlay */}
//       {sidebarOpen && (
//         <div
//           className="fixed inset-0 bg-black/50 z-40 md:hidden"
//           onClick={() => setSidebarOpen(false)}
//           aria-label="Close navigation"
//         />
//       )}

//       {/* Mobile sidebar */}
//       <div
//         className={`fixed inset-y-0 left-0 z-50 w-[264px] sidebar-gradient transform transition-transform duration-300 ease-in-out md:hidden ${
//           sidebarOpen ? "translate-x-0" : "-translate-x-full"
//         }`}
//       >
//         <Sidebar />
//       </div>

//       {/* Main content */}
//       <div className="md:pl-[264px] flex flex-col min-h-screen">
//         <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
//         <main className="flex-1 p-4 sm:p-6 w-full max-w-[1440px] mx-auto">
//           <Outlet />
//         </main>
//       </div>
//     </div>
//   )
// }

import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    if (!sidebarOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeSidebar();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen w-full overflow-x-clip page-bg-gradient">
      <Sidebar />

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[2px] md:hidden"
          onClick={closeSidebar}
          aria-label="Close navigation menu"
        />
      )}

      <div
        id="mobile-navigation"
        aria-hidden={!sidebarOpen}
        inert={!sidebarOpen}
        className={`fixed inset-y-0 left-0 z-50 w-[min(84vw,300px)] shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar mobile onNavigate={closeSidebar} />
      </div>

      <div className="flex min-h-screen min-w-0 flex-col md:pl-[280px]">
        <Header
          sidebarOpen={sidebarOpen}
          toggleSidebar={() => setSidebarOpen((open) => !open)}
        />
        <main className="mx-auto w-full min-w-0 max-w-[1440px] flex-1 p-3 sm:p-5 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}