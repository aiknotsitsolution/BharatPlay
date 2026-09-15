
// // src/layouts/MainLayout.jsx
// import { useState } from 'react';
// import { Outlet } from 'react-router-dom';
// import Navbar from '../common/Navbar';
// import Sidebar from '../common/Sidebar';
// import BottomNav from '../common/BottomNav';

// export default function MainLayout() {
//   const [sidebarOpen, setSidebarOpen] = useState(true);

//   const toggleSidebar = () => setSidebarOpen(prev => !prev);

//   return (
//     <div className="bg-[#0f0f0f] min-h-screen text-white font-sans">
//       <Navbar toggleSidebar={toggleSidebar} />
//       <div className="hidden md:block">
//         <Sidebar isOpen={sidebarOpen} />
//       </div>
//       <main
//         className={`
//           pt-14
//           pb-16 md:pb-0     
//           transition-all duration-300 ease-in-out
//           ${sidebarOpen ? 'md:pl-[15rem]' : 'md:pl-16'}
//         `}
//       >
//         <Outlet />
//       </main>
//       <BottomNav />
//     </div>
//   );
// }


import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../common/Navbar";
import Sidebar from "../common/Sidebar";
import BottomNav from "../common/BottomNav";

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="bg-[#0f0f0f] min-h-screen text-white font-sans">
      <Navbar toggleSidebar={() => setSidebarOpen((p) => !p)} />

      <Sidebar isOpen={sidebarOpen} />

      <main
        className={`
          pt-14 pb-16 md:pb-0
          transition-all duration-200 ease-in-out
          ${sidebarOpen ? "md:pl-60" : "md:pl-[72px]"}
        `}
      >
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}