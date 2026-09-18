// // import React, { useState, useEffect } from "react";
// // import { NavLink, useLocation, useNavigate } from "react-router-dom";
// // import {
// //   Home,
// //   Flame,
// //   PlusCircle,
// //   Library,
// //   User,
// //   ChevronDown,
// //   ChevronUp,
// //   Tv,
// //   History,
// //   Heart,
// //   Clock,
// //   Video,
// // } from "lucide-react";

// // const sidebarMainItems = [
// //   { icon: Home, label: "Home", path: "/" },
// //   { icon: Flame, label: "Shorts", path: "/shorts" },
// //   { icon: PlusCircle, label: "Upload", path: "/uploadvideo" },
// //   { icon: Library, label: "You", path: "/profile" },
// // ];

// // const bottomNavItems = [
// //   { icon: Home, label: "Home", path: "/" },
// //   { icon: Flame, label: "Shorts", path: "/shorts" },
// //   {
// //     icon: PlusCircle,
// //     label: "Upload",
// //     path: "/uploadvideo",
// //     isCenter: true,
// //   },
// //   { icon: User, label: "You", path: "/profile" },
// // ];

// // export default function Navigation({ isOpen }) {
// //   const location = useLocation();
// //   const navigate = useNavigate();
// //   const [showAllSubs, setShowAllSubs] = useState(false);
// //   const [isYouDropdownOpen, setIsYouDropdownOpen] = useState(false);
// //   const [subscriptionData, setSubscriptionData] = useState([]);
// //   const [subscriptionLoading, setSubscriptionLoading] = useState(true);

// //   useEffect(() => {
// //     const fetchSubscriptions = async () => {
// //       const token = localStorage.getItem("token");
// //       if (!token) {
// //         setSubscriptionData([]);
// //         setSubscriptionLoading(false);
// //         return;
// //       }

// //       try {
// //         const response = await fetch(
// //           "${BACKEND_URL}/api/uservideo/subscribed-channels",
// //           {
// //             headers: { Authorization: `Bearer ${token}` },
// //           },
// //         );

// //         if (!response.ok) throw new Error("Failed to fetch subscriptions");

// //         const data = await response.json();
// //         const channels = Array.isArray(data.channels) ? data.channels : [];

// //         const normalized = channels.map((channel) => ({
// //           id: channel._id || channel.id,
// //           name: channel.name || "Untitled Channel",
// //           avatar: channel.channelImage || "",
// //           path: channel.path || `/channel/${channel._id || channel.id}`,
// //         }));

// //         setSubscriptionData(normalized);
// //       } catch (error) {
// //         console.error("Error fetching subscriptions:", error);
// //         setSubscriptionData([]);
// //       } finally {
// //         setSubscriptionLoading(false);
// //       }
// //     };

// //     fetchSubscriptions();
// //   }, []);

// //   // Show first 6 subscriptions by default
// //   const visibleSubs = showAllSubs
// //     ? subscriptionData
// //     : subscriptionData.slice(0, 6);
// //   const hasMore = subscriptionData.length > 6;

// //   // Close dropdown when clicking outside or navigating
// //   const handleYouClick = (e) => {
// //     e.preventDefault(); // prevent navigation on click
// //     setIsYouDropdownOpen((prev) => !prev);
// //   };

// //   const handleNavClick = (path) => {
// //     navigate(path);
// //     setIsYouDropdownOpen(false); // close dropdown after navigation
// //   };

// //   return (
// //     <>
// //       {/* ===== DESKTOP / TABLET SIDEBAR ===== */}
// //       <aside
// //         className={`
// //           hidden md:block fixed top-14 left-0 z-40
// //           h-[calc(100vh-3.5rem)]
// //           bg-[#0f0f0f] border-r border-gray-800
// //           overflow-y-auto
// //           transition-all duration-300
// //           ${isOpen ? "w-64" : "w-16 hover:w-64 group/sidebar"}
// //         `}
// //       >
// //         <div className="py-2 flex flex-col">
// //           {/* Main navigation items */}
// //           {sidebarMainItems.map((item) => {
// //             const Icon = item.icon;
// //             const isActive = location.pathname === item.path;
// //             const isYouItem = item.label === "You";

// //             if (isYouItem) {
// //               return (
// //                 <div key={item.path} className="relative">
// //                   <button
// //                     onClick={handleYouClick}
// //                     className={`
// //                       group/item relative flex items-center gap-6
// //                       px-5 py-3 text-sm font-medium w-full text-left
// //                       transition-all hover:bg-[#272727]
// //                       ${isActive ? "bg-[#272727] text-white" : "text-gray-300"}
// //                     `}
// //                   >
// //                     <Icon
// //                       size={24}
// //                       strokeWidth={isActive ? 2.5 : 1.8}
// //                       className={isActive ? "text-white" : "text-gray-300"}
// //                     />

// //                     <div className="flex items-center justify-between flex-1">
// //                       <span
// //                         className={`
// //                           whitespace-nowrap transition-opacity
// //                           ${isOpen ? "opacity-100" : "opacity-0 group-hover/sidebar:opacity-100"}
// //                         `}
// //                       >
// //                         {item.label}
// //                       </span>
// //                       {isOpen && (
// //                         <ChevronDown
// //                           size={18}
// //                           className={`transition-transform ${isYouDropdownOpen ? "rotate-180" : ""}`}
// //                         />
// //                       )}
// //                     </div>

// //                     {isActive && (
// //                       <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-white rounded-r-full" />
// //                     )}
// //                   </button>

// //                   {/* Dropdown for "You" */}
// //                   {isYouDropdownOpen && isOpen && (
// //                     <div className="bg-[#1a1a1a] border-t border-b border-gray-800 py-1">
// //                       <button
// //                         onClick={() => handleNavClick("/history")}
// //                         className="w-full px-9 py-2.5 text-left hover:bg-[#272727] flex items-center gap-4 text-sm transition"
// //                       >
// //                         <History size={18} />
// //                         <span>History</span>
// //                       </button>
// //                       <button
// //                         onClick={() => handleNavClick("/liked-videos")}
// //                         className="w-full px-9 py-2.5 text-left hover:bg-[#272727] flex items-center gap-4 text-sm transition"
// //                       >
// //                         <Heart size={18} />
// //                         <span>Liked Videos</span>
// //                       </button>
// //                       <button
// //                         onClick={() => handleNavClick("/watch-later")}
// //                         className="w-full px-9 py-2.5 text-left hover:bg-[#272727] flex items-center gap-4 text-sm transition"
// //                       >
// //                         <Clock size={18} />
// //                         <span>Watch Later</span>
// //                       </button>
// //                       <button
// //                         onClick={() => handleNavClick("/your-videos")}
// //                         className="w-full px-9 py-2.5 text-left hover:bg-[#272727] flex items-center gap-4 text-sm transition"
// //                       >
// //                         <Video size={18} />
// //                         <span>Your Videos</span>
// //                       </button>
// //                     </div>
// //                   )}
// //                 </div>
// //               );
// //             }

// //             return (
// //               <NavLink
// //                 key={item.path}
// //                 to={item.path}
// //                 className={`
// //                   group/item relative flex items-center gap-6
// //                   px-5 py-3 text-sm font-medium
// //                   transition-all hover:bg-[#272727]
// //                   ${isActive ? "bg-[#272727] text-white" : "text-gray-300"}
// //                 `}
// //               >
// //                 <Icon
// //                   size={24}
// //                   strokeWidth={isActive ? 2.5 : 1.8}
// //                   className={isActive ? "text-white" : "text-gray-300"}
// //                 />

// //                 <span
// //                   className={`
// //                     whitespace-nowrap transition-opacity
// //                     ${isOpen ? "opacity-100" : "opacity-0 group-hover/sidebar:opacity-100"}
// //                   `}
// //                 >
// //                   {item.label}
// //                 </span>

// //                 {isActive && (
// //                   <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-white rounded-r-full" />
// //                 )}
// //               </NavLink>
// //             );
// //           })}

// //           {/* ===== SUBSCRIPTIONS SECTION ===== */}
// //           {isOpen && (
// //             <>
// //               <div className="h-px bg-gray-800 my-2 mx-6" />

// //               <div className="px-5 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
// //                 Subscriptions
// //               </div>

// //               {subscriptionLoading ? (
// //                 <div className="px-5 py-2 text-sm text-gray-400">
// //                   Loading subscriptions...
// //                 </div>
// //               ) : visibleSubs.length > 0 ? (
// //                 visibleSubs.map((sub, index) => {
// //                   const isActive = location.pathname === sub.path;

// //                   return (
// //                     <NavLink
// //                       key={sub.id || index}
// //                       to={sub.path}
// //                       className={`
// //                         group/item relative flex items-center gap-5
// //                         px-5 py-2.5 text-sm
// //                         transition-all hover:bg-[#272727]
// //                         ${isActive ? "bg-[#272727] text-white" : "text-gray-300"}
// //                       `}
// //                     >
// //                       <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xl shrink-0 overflow-hidden">
// //                         {sub.avatar ? (
// //                           <img
// //                             src={sub.avatar}
// //                             alt={sub.name}
// //                             className="w-full h-full object-cover"
// //                           />
// //                         ) : (
// //                           <span>
// //                             {sub.name?.charAt(0)?.toUpperCase() || "C"}
// //                           </span>
// //                         )}
// //                       </div>
// //                       <span className="truncate">{sub.name}</span>

// //                       {isActive && (
// //                         <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
// //                       )}
// //                     </NavLink>
// //                   );
// //                 })
// //               ) : (
// //                 <div className="px-5 py-2 text-sm text-gray-400">
// //                   No subscriptions yet.
// //                 </div>
// //               )}

// //               {hasMore && (
// //                 <button
// //                   onClick={() => setShowAllSubs(!showAllSubs)}
// //                   className={`
// //                     flex items-center gap-5
// //                     px-5 py-2.5 text-sm text-gray-300
// //                     hover:bg-[#272727] w-full text-left transition-all
// //                   `}
// //                 >
// //                   <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0">
// //                     {showAllSubs ? (
// //                       <ChevronUp size={20} />
// //                     ) : (
// //                       <ChevronDown size={20} />
// //                     )}
// //                   </div>
// //                   <span>{showAllSubs ? "Show less" : "Show more"}</span>
// //                 </button>
// //               )}
// //             </>
// //           )}

// //           {/* Collapsed mode: Subscriptions icon */}
// //           {!isOpen && (
// //             <div className="group/item relative flex items-center justify-center py-3 hover:bg-[#272727]">
// //               <Tv size={24} className="text-gray-300 group-hover:text-white" />
// //               <div
// //                 className="
// //                   absolute left-full ml-2 px-3 py-1.5
// //                   bg-[#1f1f1f] text-white text-sm rounded
// //                   opacity-0 group-hover:opacity-100 pointer-events-none
// //                   whitespace-nowrap border border-gray-700 shadow-xl
// //                 "
// //               >
// //                 Subscriptions
// //               </div>
// //             </div>
// //           )}
// //         </div>
// //       </aside>

// //       {/* ===== MOBILE BOTTOM NAV ===== */}
// //       <nav
// //         className="
// //           md:hidden fixed bottom-0 inset-x-0 z-50
// //           bg-[#0f0f0f]/90 backdrop-blur-xl
// //           border-t border-gray-800
// //           flex items-center justify-around h-18
// //         "
// //       >
// //         {bottomNavItems.map((item) => {
// //           const Icon = item.icon;
// //           const isActive = location.pathname === item.path;
// //           const isCenter = item.isCenter;

// //           if (item.label === "You") {
// //             return (
// //               <div key={item.path} className="relative flex-1">
// //                 <button
// //                   onClick={handleYouClick}
// //                   className={`
// //                     flex flex-col items-center justify-center w-full h-full
// //                     transition-all ${isActive ? "text-white" : "text-gray-400"}
// //                   `}
// //                 >
// //                   <Icon size={26} strokeWidth={isActive ? 2.6 : 2} />
// //                   <span className="text-[10px] mt-1">{item.label}</span>
// //                   {isActive && (
// //                     <span className="mt-1 w-6 h-1 bg-white rounded-full" />
// //                   )}
// //                 </button>

// //                 {/* Mobile dropdown - appears above */}
// //                 {isYouDropdownOpen && (
// //                   <div
// //                     className="
// //                       absolute bottom-full left-0 right-0 mb-2
// //                       bg-[#1a1a1a] border border-gray-700 rounded-lg
// //                       shadow-xl overflow-hidden
// //                     "
// //                   >
// //                     <button
// //                       onClick={() => handleNavClick("/history")}
// //                       className="w-full px-5 py-3 text-left hover:bg-[#272727] flex items-center gap-4 text-sm"
// //                     >
// //                       <History size={18} />
// //                       <span>History</span>
// //                     </button>
// //                     <button
// //                       onClick={() => handleNavClick("/liked-videos")}
// //                       className="w-full px-5 py-3 text-left hover:bg-[#272727] flex items-center gap-4 text-sm"
// //                     >
// //                       <Heart size={18} />
// //                       <span>Liked Videos</span>
// //                     </button>
// //                     <button
// //                       onClick={() => handleNavClick("/watch-later")}
// //                       className="w-full px-5 py-3 text-left hover:bg-[#272727] flex items-center gap-4 text-sm"
// //                     >
// //                       <Clock size={18} />
// //                       <span>Watch Later</span>
// //                     </button>
// //                     <button
// //                       onClick={() => handleNavClick("/your-videos")}
// //                       className="w-full px-5 py-3 text-left hover:bg-[#272727] flex items-center gap-4 text-sm"
// //                     >
// //                       <Video size={18} />
// //                       <span>Your Videos</span>
// //                     </button>
// //                   </div>
// //                 )}
// //               </div>
// //             );
// //           }

// //           if (isCenter) {
// //             return (
// //               <NavLink
// //                 key={item.path}
// //                 to={item.path}
// //                 className="
// //                   relative -top-6 w-16 h-16
// //                   flex items-center justify-center
// //                   rounded-full bg-red-600 text-white
// //                   shadow-lg active:scale-95
// //                 "
// //               >
// //                 <Icon size={32} />
// //               </NavLink>
// //             );
// //           }

// //           return (
// //             <NavLink
// //               key={item.path}
// //               to={item.path}
// //               className={`
// //                 flex flex-col items-center justify-center flex-1
// //                 transition-all ${isActive ? "text-white" : "text-gray-400"}
// //               `}
// //             >
// //               <Icon size={26} strokeWidth={isActive ? 2.6 : 2} />
// //               <span className="text-[10px] mt-1">{item.label}</span>
// //               {isActive && (
// //                 <span className="mt-1 w-6 h-1 bg-white rounded-full" />
// //               )}
// //             </NavLink>
// //           );
// //         })}
// //       </nav>
// //     </>
// //   );
// // }

// import React, { useState, useEffect } from "react";
// import { NavLink, matchPath, useLocation, useNavigate } from "react-router-dom";
// import {
//   Home,
//   Flame,
//   PlusCircle,
//   Library,
//   User,
//   ChevronDown,
//   ChevronUp,
//   Tv,
//   History,
//   Heart,
//   Clock,
//   Video,
//   // Shield,
// } from "lucide-react";
// import { API_ORIGIN as BACKEND_URL } from "../../config/api";

// const sidebarMainItems = [
//   { icon: Home, label: "Home", path: "/" },
//   { icon: Flame, label: "Shorts", path: "/shorts" },
//   { icon: PlusCircle, label: "Upload", path: "/uploadvideo" },
//   { icon: Library, label: "You", path: "/profile" },
//   // { icon: Shield, label: "Copyright", path: "/copyright" },
// ];

// const bottomNavItems = [
//   { icon: Home, label: "Home", path: "/" },
//   { icon: Flame, label: "Shorts", path: "/shorts" },
//   {
//     icon: PlusCircle,
//     label: "Upload",
//     path: "/uploadvideo",
//     isCenter: true,
//   },
//   { icon: User, label: "You", path: "/profile" },
// ];

// export default function Navigation({ isOpen }) {
//   const location = useLocation();
//   const navigate = useNavigate();

//   const isPathActive = (path) => {
//     if (path === "/") return location.pathname === "/";
//     return Boolean(matchPath({ path, end: false }, location.pathname));
//   };
//   const [showAllSubs, setShowAllSubs] = useState(false);
//   const [isYouDropdownOpen, setIsYouDropdownOpen] = useState(false);
//   const [subscriptionData, setSubscriptionData] = useState([]);
//   const [subscriptionLoading, setSubscriptionLoading] = useState(true);

//   useEffect(() => {
//     const fetchSubscriptions = async () => {
//       const token = localStorage.getItem("token");
//       if (!token) {
//         setSubscriptionData([]);
//         setSubscriptionLoading(false);
//         return;
//       }

//       try {
//         const response = await fetch(
//           `${BACKEND_URL}/api/uservideo/subscribed-channels`,
//           {
//             headers: { Authorization: `Bearer ${token}` },
//           },
//         );

//         if (!response.ok) throw new Error("Failed to fetch subscriptions");

//         const data = await response.json();
//         const channels = Array.isArray(data.channels) ? data.channels : [];

//         const normalized = channels.map((channel) => {
//           const id = channel._id || channel.id;
//           return {
//             id,
//             name: channel.name || "Untitled Channel",
//             avatar: channel.channelImage
//               ? channel.channelImage.startsWith("http")
//                 ? channel.channelImage
//                 : `${BACKEND_URL}/${channel.channelImage}`
//               : "",
//             path: `/subscribechannel/${id}`,
//           };
//         });

//         setSubscriptionData(normalized);
//       } catch (error) {
//         console.error("Error fetching subscriptions:", error);
//         setSubscriptionData([]);
//       } finally {
//         setSubscriptionLoading(false);
//       }
//     };

//     fetchSubscriptions();
//   }, []);

//   const visibleSubs = showAllSubs
//     ? subscriptionData
//     : subscriptionData.slice(0, 6);
//   const hasMore = subscriptionData.length > 6;

//   const handleYouClick = (e) => {
//     e.preventDefault();
//     setIsYouDropdownOpen((prev) => !prev);
//   };

//   const handleNavClick = (path) => {
//     navigate(path);
//     setIsYouDropdownOpen(false);
//   };

//   return (
//     <>
//       {/* ===== DESKTOP / TABLET SIDEBAR ===== */}
//       <aside
//         className={`
//           hidden md:block fixed top-14 left-0 z-40
//           h-[calc(100dvh-3.5rem)]
//           bg-[#0f0f0f] border-r border-gray-800
//           overflow-y-auto overflow-x-hidden scroll-smooth
//           transition-all duration-300
//           ${isOpen ? "w-64" : "w-16 hover:w-64 group/sidebar"}
//         `}
//       >
//         <div className="py-2 flex flex-col mr-0.5">
//           {/* Main navigation items */}
//           {sidebarMainItems.map((item) => {
//             const Icon = item.icon;
//             const isActive = isPathActive(item.path);
//             const isYouItem = item.label === "You";

//             if (isYouItem) {
//               return (
//                 <div key={item.path} className="relative">
//                   <button
//                     onClick={handleYouClick}
//                     className={`
//                       group/item relative flex items-center gap-6
//                       px-5 py-3 text-sm font-medium w-full text-left
//                       transition-all hover:bg-[#272727]
//                       ${isActive ? "bg-[#272727] text-white" : "text-gray-300"}
//                     `}
//                   >
//                     <Icon
//                       size={24}
//                       strokeWidth={isActive ? 2.5 : 1.8}
//                       className={isActive ? "text-white" : "text-gray-300"}
//                     />

//                     <div className="flex items-center justify-between flex-1">
//                       <span
//                         className={`
//                           whitespace-nowrap transition-opacity
//                           ${isOpen ? "opacity-100" : "opacity-0 group-hover/sidebar:opacity-100"}
//                         `}
//                       >
//                         {item.label}
//                       </span>
//                       {isOpen && (
//                         <ChevronDown
//                           size={18}
//                           className={`transition-transform ${
//                             isYouDropdownOpen ? "rotate-180" : ""
//                           }`}
//                         />
//                       )}
//                     </div>

//                     {isActive && (
//                       <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-white rounded-r-full" />
//                     )}
//                   </button>

//                   {isYouDropdownOpen && isOpen && (
//                     <div className="bg-[#1a1a1a] border-t border-b border-gray-800 py-1">
//                       <button
//                         onClick={() => handleNavClick("/history")}
//                         className="w-full px-9 py-2.5 text-left hover:bg-[#272727] flex items-center gap-4 text-sm transition"
//                       >
//                         <History size={18} />
//                         <span>History</span>
//                       </button>
//                       <button
//                         onClick={() => handleNavClick("/liked-videos")}
//                         className="w-full px-9 py-2.5 text-left hover:bg-[#272727] flex items-center gap-4 text-sm transition"
//                       >
//                         <Heart size={18} />
//                         <span>Liked Videos</span>
//                       </button>
//                       <button
//                         onClick={() => handleNavClick("/watch-later")}
//                         className="w-full px-9 py-2.5 text-left hover:bg-[#272727] flex items-center gap-4 text-sm transition"
//                       >
//                         <Clock size={18} />
//                         <span>Watch Later</span>
//                       </button>
//                       <button
//                         onClick={() => handleNavClick("/your-videos")}
//                         className="w-full px-9 py-2.5 text-left hover:bg-[#272727] flex items-center gap-4 text-sm transition"
//                       >
//                         <Video size={18} />
//                         <span>Your Videos</span>
//                       </button>
//                     </div>
//                   )}
//                 </div>
//               );
//             }

//             return (
//               <NavLink
//                 key={item.path}
//                 to={item.path}
//                 className={`
//                   group/item relative flex items-center gap-6
//                   px-5 py-3 text-sm font-medium
//                   transition-all hover:bg-[#272727]
//                   ${isActive ? "bg-[#272727] text-white" : "text-gray-300"}
//                 `}
//               >
//                 <Icon
//                   size={24}
//                   strokeWidth={isActive ? 2.5 : 1.8}
//                   className={isActive ? "text-white" : "text-gray-300"}
//                 />

//                 <span
//                   className={`
//                     whitespace-nowrap transition-opacity
//                     ${isOpen ? "opacity-100" : "opacity-0 group-hover/sidebar:opacity-100"}
//                   `}
//                 >
//                   {item.label}
//                 </span>

//                 {isActive && (
//                   <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-white rounded-r-full" />
//                 )}
//               </NavLink>
//             );
//           })}

//           {/* ===== SUBSCRIPTIONS SECTION ===== */}
//           {isOpen && (
//             <>
//               <div className="h-px bg-gray-800 my-2 mx-6" />

//               <div className="px-5 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
//                 Subscriptions
//               </div>

//               {subscriptionLoading ? (
//                 <div className="px-5 py-2 text-sm text-gray-400">
//                   Loading subscriptions...
//                 </div>
//               ) : visibleSubs.length > 0 ? (
//                 visibleSubs.map((sub, index) => {
//                   const isActive = isPathActive(sub.path);

//                   return (
//                     <NavLink
//                       key={sub.id || index}
//                       to={sub.path}
//                       className={`
//                         group/item relative flex items-center gap-5
//                         px-5 py-2.5 text-sm
//                         transition-all hover:bg-[#272727]
//                         ${isActive ? "bg-[#272727] text-white" : "text-gray-300"}
//                       `}
//                     >
//                       <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xl shrink-0 overflow-hidden">
//                         {sub.avatar ? (
//                           <img
//                             src={sub.avatar}
//                             alt={sub.name}
//                             className="w-full h-full object-cover"
//                           />
//                         ) : (
//                           <span>
//                             {sub.name?.charAt(0)?.toUpperCase() || "C"}
//                           </span>
//                         )}
//                       </div>
//                       <span className="truncate">{sub.name}</span>

//                       {isActive && (
//                         <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
//                       )}
//                     </NavLink>
//                   );
//                 })
//               ) : (
//                 <div className="px-5 py-2 text-sm text-gray-400">
//                   No subscriptions yet.
//                 </div>
//               )}

//               {hasMore && (
//                 <button
//                   onClick={() => setShowAllSubs(!showAllSubs)}
//                   className={`
//                     flex items-center gap-5
//                     px-5 py-2.5 text-sm text-gray-300
//                     hover:bg-[#272727] w-full text-left transition-all
//                   `}
//                 >
//                   <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0">
//                     {showAllSubs ? (
//                       <ChevronUp size={20} />
//                     ) : (
//                       <ChevronDown size={20} />
//                     )}
//                   </div>
//                   <span>{showAllSubs ? "Show less" : "Show more"}</span>
//                 </button>
//               )}
//             </>
//           )}

//           {/* Collapsed mode: Subscriptions icon */}
//           {!isOpen && (
//             <div className="group/item relative flex items-center justify-center py-3 hover:bg-[#272727]">
//               <Tv size={24} className="text-gray-300 group-hover:text-white" />
//               <div
//                 className="
//                   absolute left-full ml-2 px-3 py-1.5
//                   bg-[#1f1f1f] text-white text-sm rounded
//                   opacity-0 group-hover:opacity-100 pointer-events-none
//                   whitespace-nowrap border border-gray-700 shadow-xl
//                 "
//               >
//                 Subscriptions
//               </div>
//             </div>
//           )}
//         </div>
//       </aside>

//       {/* ===== MOBILE BOTTOM NAV ===== */}
//       <nav
//         className="
//           md:hidden fixed bottom-0 inset-x-0 z-50
//           bg-[#0f0f0f]/90 backdrop-blur-xl
//           border-t border-gray-800
//           flex items-center justify-around h-18
//         "
//       >
//         {bottomNavItems.map((item) => {
//           const Icon = item.icon;
//           const isActive = isPathActive(item.path);
//           const isCenter = item.isCenter;

//           if (item.label === "You") {
//             return (
//               <div key={item.path} className="relative flex-1">
//                 <button
//                   onClick={handleYouClick}
//                   className={`
//                     flex flex-col items-center justify-center w-full h-full
//                     transition-all ${isActive ? "text-white" : "text-gray-400"}
//                   `}
//                 >
//                   <Icon size={26} strokeWidth={isActive ? 2.6 : 2} />
//                   <span className="text-[10px] mt-1">{item.label}</span>
//                   {isActive && (
//                     <span className="mt-1 w-6 h-1 bg-white rounded-full" />
//                   )}
//                 </button>

//                 {isYouDropdownOpen && (
//                   <div
//                     className="
//                       absolute bottom-full left-0 right-0 mb-2
//                       bg-[#1a1a1a] border border-gray-700 rounded-lg
//                       shadow-xl overflow-hidden
//                     "
//                   >
//                     <button
//                       onClick={() => handleNavClick("/history")}
//                       className="w-full px-5 py-3 text-left hover:bg-[#272727] flex items-center gap-4 text-sm"
//                     >
//                       <History size={18} />
//                       <span>History</span>
//                     </button>
//                     <button
//                       onClick={() => handleNavClick("/liked-videos")}
//                       className="w-full px-5 py-3 text-left hover:bg-[#272727] flex items-center gap-4 text-sm"
//                     >
//                       <Heart size={18} />
//                       <span>Liked Videos</span>
//                     </button>
//                     <button
//                       onClick={() => handleNavClick("/watch-later")}
//                       className="w-full px-5 py-3 text-left hover:bg-[#272727] flex items-center gap-4 text-sm"
//                     >
//                       <Clock size={18} />
//                       <span>Watch Later</span>
//                     </button>
//                     <button
//                       onClick={() => handleNavClick("/your-videos")}
//                       className="w-full px-5 py-3 text-left hover:bg-[#272727] flex items-center gap-4 text-sm"
//                     >
//                       <Video size={18} />
//                       <span>Your Videos</span>
//                     </button>
//                   </div>
//                 )}
//               </div>
//             );
//           }

//           if (isCenter) {
//             return (
//               <NavLink
//                 key={item.path}
//                 to={item.path}
//                 className="
//                   relative -top-6 w-16 h-16
//                   flex items-center justify-center
//                   rounded-full bg-red-600 text-white
//                   shadow-lg active:scale-95
//                 "
//               >
//                 <Icon size={32} />
//               </NavLink>
//             );
//           }

//           return (
//             <NavLink
//               key={item.path}
//               to={item.path}
//               className={`
//                 flex flex-col items-center justify-center flex-1
//                 transition-all ${isActive ? "text-white" : "text-gray-400"}
//               `}
//             >
//               <Icon size={26} strokeWidth={isActive ? 2.6 : 2} />
//               <span className="text-[10px] mt-1">{item.label}</span>
//               {isActive && (
//                 <span className="mt-1 w-6 h-1 bg-white rounded-full" />
//               )}
//             </NavLink>
//           );
//         })}
//       </nav>
//     </>
//   );
// }


import React, { useState, useEffect } from "react";
import { NavLink, matchPath, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Flame,
  PlusCircle,
  Library,
  History,
  Heart,
  Clock,
  Video,
  ChevronDown,
  ChevronUp,
  Tv,
} from "lucide-react";
import { API_ORIGIN as BACKEND_URL } from "../../config/api";

const mainItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Flame, label: "Shorts", path: "/shorts" },
  { icon: PlusCircle, label: "Upload", path: "/uploadvideo" },
  { icon: Library, label: "You", path: "/profile" },
];

export default function Sidebar({ isOpen }) {
  const location = useLocation();
  const navigate = useNavigate();

  const isPathActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return Boolean(matchPath({ path, end: false }, location.pathname));
  };

  const [showAllSubs, setShowAllSubs] = useState(false);
  const [isYouOpen, setIsYouOpen] = useState(false);
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubs = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setSubs([]);
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${BACKEND_URL}/api/uservideo/subscribed-channels`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        const channels = Array.isArray(data.channels) ? data.channels : [];
        setSubs(
          channels.map((c) => ({
            id: c._id || c.id,
            name: c.name || "Untitled",
            avatar: c.channelImage
              ? c.channelImage.startsWith("http")
                ? c.channelImage
                : `${BACKEND_URL}/${c.channelImage}`
              : "",
            path: `/subscribechannel/${c._id || c.id}`,
          }))
        );
      } catch {
        setSubs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSubs();
  }, []);

  const visibleSubs = showAllSubs ? subs : subs.slice(0, 5);
  const hasMore = subs.length > 5;

  return (
    <aside
      className={`
        hidden md:block fixed top-14 left-0 z-40
        h-[calc(100dvh-3.5rem)]
        bg-[#0f0f0f] border-r border-gray-800
        overflow-y-auto overflow-x-hidden
        transition-all duration-200
        ${isOpen ? "w-60" : "w-[72px]"}
      `}
    >
      <div className="py-3 flex flex-col">
        {/* Main items */}
        {mainItems.map((item) => {
          const Icon = item.icon;
          const active = isPathActive(item.path);
          const isYou = item.label === "You";

          if (isYou) {
            return (
              <div key={item.path}>
                <button
                  onClick={() => setIsYouOpen((p) => !p)}
                  className={`
                    relative flex items-center gap-6 w-full
                    px-3 py-2.5 mx-2 rounded-lg text-sm font-medium
                    transition-colors hover:bg-[#272727]
                    ${active ? "bg-[#272727] text-white" : "text-gray-300"}
                  `}
                >
                  <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
                  {isOpen && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${isYouOpen ? "rotate-180" : ""}`}
                      />
                    </>
                  )}
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
                  )}
                </button>

                {isYouOpen && isOpen && (
                  <div className="mt-1 mb-2 space-y-0.5">
                    {[
                      { path: "/history", icon: History, label: "History" },
                      { path: "/liked-videos", icon: Heart, label: "Liked videos" },
                      { path: "/watch-later", icon: Clock, label: "Watch later" },
                      { path: "/your-videos", icon: Video, label: "Your videos" },
                    ].map((sub) => (
                      <button
                        key={sub.path}
                        onClick={() => {
                          navigate(sub.path);
                          setIsYouOpen(false);
                        }}
                        className="w-full flex items-center gap-5 pl-12 pr-4 py-2 text-sm text-gray-300 hover:bg-[#272727] rounded-lg mx-2"
                      >
                        <sub.icon size={18} />
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`
                relative flex items-center gap-6
                px-3 py-2.5 mx-2 rounded-lg text-sm font-medium
                transition-colors hover:bg-[#272727]
                ${active ? "bg-[#272727] text-white" : "text-gray-300"}
              `}
            >
              <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
              {isOpen && <span>{item.label}</span>}
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
              )}
            </NavLink>
          );
        })}

        {/* Subscriptions */}
        {isOpen && (
          <>
            <div className="h-px bg-gray-800 my-3 mx-4" />
            <div className="px-5 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Subscriptions
            </div>

            {loading ? (
              <div className="px-5 py-3 text-sm text-gray-500">Loading...</div>
            ) : visibleSubs.length > 0 ? (
              visibleSubs.map((sub) => {
                const active = isPathActive(sub.path);
                return (
                  <NavLink
                    key={sub.id}
                    to={sub.path}
                    className={`
                      relative flex items-center gap-4
                      px-3 py-2 mx-2 rounded-lg text-sm
                      hover:bg-[#272727] transition-colors
                      ${active ? "bg-[#272727] text-white" : "text-gray-300"}
                    `}
                  >
                    <div className="w-6 h-6 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                      {sub.avatar ? (
                        <img src={sub.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="w-full h-full flex items-center justify-center text-xs">
                          {sub.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <span className="truncate">{sub.name}</span>
                  </NavLink>
                );
              })
            ) : (
              <div className="px-5 py-3 text-sm text-gray-500">No subscriptions yet</div>
            )}

            {hasMore && (
              <button
                onClick={() => setShowAllSubs(!showAllSubs)}
                className="flex items-center gap-4 px-3 py-2 mx-2 rounded-lg text-sm text-gray-300 hover:bg-[#272727] w-[calc(100%-16px)]"
              >
                {showAllSubs ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                {showAllSubs ? "Show less" : "Show more"}
              </button>
            )}
          </>
        )}

        {/* Collapsed: Subscriptions icon */}
        {!isOpen && (
          <div className="mt-2 flex justify-center py-3 hover:bg-[#272727] rounded-lg mx-2">
            <Tv size={22} className="text-gray-300" />
          </div>
        )}
      </div>
    </aside>
  );
}