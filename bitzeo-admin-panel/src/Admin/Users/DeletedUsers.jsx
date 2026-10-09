// import { useState, useEffect, useCallback } from "react";
// import { useDispatch } from "react-redux";
// import DataTable from "react-data-table-component";
// import toast from "react-hot-toast";
// import { roleColor, formatDateTime } from "../../utils/helpers";
// import {
//   Search,
//   Trash2,
//   Loader2,
//   Mail,
//   X,
//   UserX,
//   AlertTriangle,
//   Calendar,
//   Shield,
//   Info,
//   RotateCcw,
// } from "lucide-react";
// import { hasFeature } from "../../config/roleConfig";
// import { API_BASE_URL, fetchDeletedUsers, hardDeleteUser } from "../../api";
// import { restoreUser } from "../../redux/slices/adminUser360Slice";
// import tableCustomStyles from "../../utils/tableStyles";
// import PageHeader from "../../components/layout/PageHeader";

// const BASE_URL = API_BASE_URL;
// const LIMIT = 15;

// export default function DeletedUsers() {
//   const dispatch = useDispatch();
//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch] = useState("");
//   const [page, setPage] = useState(1);
//   const [totalRows, setTotalRows] = useState(0);

//   // Confirmation modal state
//   const [confirmModal, setConfirmModal] = useState(false);
//   const [targetUser, setTargetUser] = useState(null);
//   const [deleting, setDeleting] = useState(false);

//   // Retain modal state
//   const [retainModal, setRetainModal] = useState(false);
//   const [retainTarget, setRetainTarget] = useState(null);
//   const [retaining, setRetaining] = useState(false);

//   const fetchUsers = useCallback(async (pageNum = 1, searchTerm = "") => {
//     try {
//       setLoading(true);
//       const res = await fetchDeletedUsers({
//         page: pageNum,
//         limit: LIMIT,
//         search: searchTerm,
//       });

//       setUsers(res.data?.data || []);
//       setTotalRows(res.data?.pagination?.total || 0);
//     } catch (err) {
//       console.error(err);
//       toast.error("Failed to load deleted users");
//       setUsers([]);
//       setTotalRows(0);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchUsers(page, search);
//   }, [page, fetchUsers]);

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       if (page !== 1) {
//         setPage(1);
//       } else {
//         fetchUsers(1, search);
//       }
//     }, 400);
//     return () => clearTimeout(timer);
//   }, [search]);

//   const handlePageChange = (newPage) => {
//     setPage(newPage);
//   };

//   const openConfirmModal = (user) => {
//     setTargetUser(user);
//     setConfirmModal(true);
//   };

//   const closeConfirmModal = () => {
//     if (deleting) return;
//     setConfirmModal(false);
//     setTargetUser(null);
//   };

//   const handleHardDelete = async () => {
//     if (!targetUser) return;

//     try {
//       setDeleting(true);
//       await hardDeleteUser(targetUser._id);
//       toast.success("User permanently deleted");
//       setConfirmModal(false);
//       setTargetUser(null);

//       if (users.length === 1 && page > 1) {
//         setPage((p) => p - 1);
//       } else {
//         fetchUsers(page, search);
//       }
//     } catch (err) {
//       toast.error(
//         err.response?.data?.message || "Failed to permanently delete user",
//       );
//     } finally {
//       setDeleting(false);
//     }
//   };

//   const openRetainModal = (user) => {
//     setRetainTarget(user);
//     setRetainModal(true);
//   };

//   const closeRetainModal = () => {
//     if (retaining) return;
//     setRetainModal(false);
//     setRetainTarget(null);
//   };

//   const handleRetain = async () => {
//     if (!retainTarget) return;

//     try {
//       setRetaining(true);
//       await dispatch(restoreUser({ userId: retainTarget._id })).unwrap();
//       toast.success("User retained and restored to active list");
//       setRetainModal(false);
//       setRetainTarget(null);

//       if (users.length === 1 && page > 1) {
//         setPage((p) => p - 1);
//       } else {
//         fetchUsers(page, search);
//       }
//     } catch (err) {
//       toast.error(
//         err.response?.data?.message ||
//           err.error?.message ||
//           err.message ||
//           "Failed to retain user",
//       );
//     } finally {
//       setRetaining(false);
//     }
//   };

//   const columns = [
//     {
//       name: "User",
//       selector: (row) => row.name,
//       sortable: true,
//       grow: 2,
//       cell: (row) => (
//         <div className="flex items-center gap-3 py-1">
//           <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
//             {row.avatar ? (
//               <img
//                 src={row.avatar}
//                 alt={row.name}
//                 className="w-10 h-10 rounded-full object-cover opacity-50"
//               />
//             ) : (
//               row.name?.charAt(0)?.toUpperCase() || "U"
//             )}
//           </div>
//           <div className="min-w-0">
//             <p className="font-medium text-bp-text-secondary truncate line-through decoration-red-500/50">
//               {row.name}
//             </p>
//             <p className="text-sm text-bp-text-muted truncate flex items-center gap-1">
//               <Mail size={12} />
//               {row.email}
//             </p>
//           </div>
//         </div>
//       ),
//     },
//     {
//       name: "Role",
//       selector: (row) => row.role,
//       sortable: true,
//       width: "120px",
//       cell: (row) => (
//         <span
//           className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize opacity-60 ${roleColor(
//             row.role,
//           )}`}
//         >
//           {row.role}
//         </span>
//       ),
//     },
//     {
//       name: "Deleted At",
//       selector: (row) => row.deletedAt,
//       sortable: true,
//       width: "180px",
//       cell: (row) => (
//         <div className="flex items-center gap-1.5">
//           <Calendar size={14} className="text-red-400 flex-shrink-0" />
//           <span className="text-sm text-bp-text-secondary">
//             {formatDateTime(row.deletedAt)}
//           </span>
//         </div>
//       ),
//     },
//     {
//       name: "Reason",
//       selector: (row) => row.deleteReason,
//       sortable: false,
//       width: "200px",
//       cell: (row) => (
//         <span
//           className="text-sm text-bp-text-muted truncate max-w-[180px] block"
//           title={row.deleteReason || ""}
//         >
//           {row.deleteReason || "No reason provided"}
//         </span>
//       ),
//     },
//     {
//       name: "Joined",
//       selector: (row) => row.createdAt,
//       sortable: true,
//       width: "120px",
//       cell: (row) => (
//         <span className="text-sm text-bp-text-muted">
//           {new Date(row.createdAt).toLocaleDateString()}
//         </span>
//       ),
//     },
//     {
//       name: "Actions",
//       width: "200px",
//       center: true,
//       cell: (row) => (
//         <div className="flex items-center justify-center gap-2">
//           {hasFeature("canDeleteUsers") && (
//             <button
//               onClick={() => openRetainModal(row)}
//               className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium 
//                          text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 
//                          border border-emerald-500/20 rounded-lg transition"
//               title="Retain User"
//             >
//               <RotateCcw size={16} />
//             </button>
//           )}
//           {hasFeature("canHardDeleteUsers") && (
//             <button
//               onClick={() => openConfirmModal(row)}
//               className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium 
//                          text-red-400 bg-red-500/10 hover:bg-red-500/20 
//                          border border-red-500/20 rounded-lg transition"
//               title="Permanently Delete"
//             >
//               <Trash2 size={16} />
//             </button>
//           )}
//         </div>
//       ),
//     },
//   ];

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <PageHeader
//         title="Deleted Users"
//         subtitle={`${totalRows} deleted user${totalRows !== 1 ? "s" : ""} found`}
//       >
//         <div className="relative">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bp-text-muted pointer-events-none" />
//           <input
//             type="text"
//             placeholder="Search by name or email..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             className="pl-9 pr-9 py-2.5 bg-bp-surface/60 border border-bp-border/50 rounded-xl w-72 text-sm text-bp-text placeholder:text-bp-text-muted focus:outline-none focus:ring-2 focus:ring-bp-blue/20 focus:border-bp-blue/50 hover:border-bp-border transition-colors duration-200"
//           />
//           {search && (
//             <button
//               type="button"
//               onClick={() => setSearch("")}
//               className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-bp-text-muted hover:text-bp-text hover:bg-bp-elevated transition-colors duration-150"
//             >
//               <X size={14} />
//             </button>
//           )}
//         </div>
//       </PageHeader>

//       {/* Info Banner */}
//       <div className="flex items-center gap-3 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
//         <Info size={18} className="text-red-400 flex-shrink-0" />
//         <p className="text-sm text-bp-text-secondary">
//           These users have been soft-deleted and no longer appear in the main
//           Users list. You can permanently remove them here.
//         </p>
//       </div>

//       {/* DataTable */}
//       <div className="bg-bp-card rounded-2xl overflow-hidden">
//         <DataTable
//           columns={columns}
//           data={users}
//           customStyles={tableCustomStyles}
//           progressPending={loading}
//           progressComponent={
//             <div className="py-12 text-center text-bp-text-muted">
//               Loading deleted users...
//             </div>
//           }
//           noDataComponent={
//             <div className="py-12 text-center text-bp-text-muted">
//               No deleted users found
//             </div>
//           }
//           pagination
//           paginationServer
//           paginationTotalRows={totalRows}
//           paginationPerPage={LIMIT}
//           paginationDefaultPage={page}
//           onChangePage={handlePageChange}
//           highlightOnHover
//           pointerOnHover={false}
//         />
//       </div>

//       {/* ========== CONFIRMATION MODAL ========== */}
//       {confirmModal && targetUser && (
//         <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
//           <div className="bg-bp-card border border-red-500/30 rounded-2xl shadow-2xl w-full max-w-md">
//             <div className="flex items-center justify-between p-5 border-b border-bp-border">
//               <h2 className="text-xl font-bold text-white flex items-center gap-2">
//                 <AlertTriangle size={22} className="text-red-400" />
//                 Permanently Delete User?
//               </h2>
//               <button
//                 onClick={closeConfirmModal}
//                 disabled={deleting}
//                 className="p-1.5 text-bp-text-secondary hover:text-bp-text hover:bg-bp-elevated rounded-lg transition disabled:opacity-50"
//               >
//                 <X size={20} />
//               </button>
//             </div>

//             <div className="p-5 space-y-4">
//               <div className="flex items-center gap-3 p-3 bg-bp-elevated/50 border border-bp-border/50 rounded-xl">
//                 <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
//                   {targetUser.avatar ? (
//                     <img
//                       src={targetUser.avatar}
//                       alt={targetUser.name}
//                       className="w-10 h-10 rounded-full object-cover opacity-50"
//                     />
//                   ) : (
//                     targetUser.name?.charAt(0)?.toUpperCase() || "U"
//                   )}
//                 </div>
//                 <div className="min-w-0">
//                   <p className="font-medium text-white truncate">
//                     {targetUser.name}
//                   </p>
//                   <p className="text-sm text-bp-text-muted truncate">
//                     {targetUser.email}
//                   </p>
//                 </div>
//               </div>

//               <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
//                 <p className="text-sm text-white leading-relaxed">
//                   This action permanently removes this user, their channels and
//                   videos, and related comments, watch sessions, and references.
//                   <span className="font-semibold text-red-400">
//                     {" "}
//                     This cannot be undone.
//                   </span>
//                 </p>
//               </div>

//               <p className="text-sm text-bp-text-secondary">
//                 Are you sure you want to permanently delete this user?
//               </p>

//               <div className="flex gap-3 pt-2">
//                 <button
//                   onClick={closeConfirmModal}
//                   disabled={deleting}
//                   className="flex-1 py-2.5 bg-bp-elevated hover:bg-bp-border text-white rounded-lg font-medium transition disabled:opacity-50"
//                 >
//                   No, Cancel
//                 </button>
//                 <button
//                   onClick={handleHardDelete}
//                   disabled={deleting}
//                   className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white rounded-lg 
//                              font-medium flex items-center justify-center gap-2 disabled:cursor-not-allowed transition"
//                 >
//                   {deleting ? (
//                     <>
//                       <Loader2 size={16} className="animate-spin" />
//                       Deleting...
//                     </>
//                   ) : (
//                     <>
//                       <Trash2 size={16} />
//                       Yes, Permanently Delete
//                     </>
//                   )}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ========== RETAIN CONFIRMATION MODAL ========== */}
//       {retainModal && retainTarget && (
//         <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
//           <div className="bg-bp-card border border-emerald-500/30 rounded-2xl shadow-2xl w-full max-w-md">
//             <div className="flex items-center justify-between p-5 border-b border-bp-border">
//               <h2 className="text-xl font-bold text-white flex items-center gap-2">
//                 <RotateCcw size={22} className="text-emerald-400" />
//                 Retain User?
//               </h2>
//               <button
//                 onClick={closeRetainModal}
//                 disabled={retaining}
//                 className="p-1.5 text-bp-text-secondary hover:text-bp-text hover:bg-bp-elevated rounded-lg transition disabled:opacity-50"
//               >
//                 <X size={20} />
//               </button>
//             </div>

//             <div className="p-5 space-y-4">
//               <div className="flex items-center gap-3 p-3 bg-bp-elevated/50 border border-bp-border/50 rounded-xl">
//                 <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
//                   {retainTarget.avatar ? (
//                     <img
//                       src={retainTarget.avatar}
//                       alt={retainTarget.name}
//                       className="w-10 h-10 rounded-full object-cover opacity-50"
//                     />
//                   ) : (
//                     retainTarget.name?.charAt(0)?.toUpperCase() || "U"
//                   )}
//                 </div>
//                 <div className="min-w-0">
//                   <p className="font-medium text-white truncate">
//                     {retainTarget.name}
//                   </p>
//                   <p className="text-sm text-bp-text-muted truncate">
//                     {retainTarget.email}
//                   </p>
//                 </div>
//               </div>

//               <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
//                 <p className="text-sm text-white leading-relaxed">
//                   This will restore the user and move them back to the normal
//                   Users list.
//                 </p>
//               </div>

//               <p className="text-sm text-bp-text-secondary">
//                 Are you sure you want to retain this user?
//               </p>

//               <div className="flex gap-3 pt-2">
//                 <button
//                   onClick={closeRetainModal}
//                   disabled={retaining}
//                   className="flex-1 py-2.5 bg-bp-elevated hover:bg-bp-border text-white rounded-lg font-medium transition disabled:opacity-50"
//                 >
//                   No, Cancel
//                 </button>
//                 <button
//                   onClick={handleRetain}
//                   disabled={retaining}
//                   className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white rounded-lg 
//                              font-medium flex items-center justify-center gap-2 disabled:cursor-not-allowed transition"
//                 >
//                   {retaining ? (
//                     <>
//                       <Loader2 size={16} className="animate-spin" />
//                       Retaining...
//                     </>
//                   ) : (
//                     <>
//                       <RotateCcw size={16} />
//                       Yes, Retain User
//                     </>
//                   )}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

import { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import DataTable from "react-data-table-component";
import toast from "react-hot-toast";
import { roleColor, formatDateTime } from "../../utils/helpers";
import {
  Search,
  Trash2,
  Loader2,
  Mail,
  X,
  AlertTriangle,
  Calendar,
  Info,
  RotateCcw,
} from "lucide-react";
import { hasFeature } from "../../config/roleConfig";
import { fetchDeletedUsers, hardDeleteUser } from "../../api";
import { restoreUser } from "../../redux/slices/adminUser360Slice";
import tableCustomStyles from "../../utils/tableStyles";
import {
  PAGINATION_PER_PAGE,
  PAGINATION_OPTIONS,
} from "../../utils/paginationConfig";
import PageHeader from "../../components/layout/PageHeader";

const LIMIT = PAGINATION_PER_PAGE;

export default function DeletedUsers() {
  const dispatch = useDispatch();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(LIMIT);
  const [totalRows, setTotalRows] = useState(0);

  const [confirmModal, setConfirmModal] = useState(false);
  const [targetUser, setTargetUser] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [retainModal, setRetainModal] = useState(false);
  const [retainTarget, setRetainTarget] = useState(null);
  const [retaining, setRetaining] = useState(false);

  const fetchUsers = useCallback(async (pageNum = 1, searchTerm = "") => {
    try {
      setLoading(true);
      const res = await fetchDeletedUsers({
        page: pageNum,
        limit,
        search: searchTerm,
      });
      setUsers(res.data?.data || []);
      setTotalRows(res.data?.pagination?.total || 0);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load deleted users");
      setUsers([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchUsers(page, search);
  }, [page, fetchUsers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) setPage(1);
      else fetchUsers(1, search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handlePageChange = (newPage) => setPage(newPage);

  const openConfirmModal = (user) => {
    setTargetUser(user);
    setConfirmModal(true);
  };

  const closeConfirmModal = () => {
    if (deleting) return;
    setConfirmModal(false);
    setTargetUser(null);
  };

  const handleHardDelete = async () => {
    if (!targetUser) return;
    try {
      setDeleting(true);
      await hardDeleteUser(targetUser._id);
      toast.success("User permanently deleted");
      setConfirmModal(false);
      setTargetUser(null);
      if (users.length === 1 && page > 1) setPage((p) => p - 1);
      else fetchUsers(page, search);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to permanently delete user");
    } finally {
      setDeleting(false);
    }
  };

  const openRetainModal = (user) => {
    setRetainTarget(user);
    setRetainModal(true);
  };

  const closeRetainModal = () => {
    if (retaining) return;
    setRetainModal(false);
    setRetainTarget(null);
  };

  const handleRetain = async () => {
    if (!retainTarget) return;
    try {
      setRetaining(true);
      await dispatch(restoreUser({ userId: retainTarget._id })).unwrap();
      toast.success("User retained and restored to active list");
      setRetainModal(false);
      setRetainTarget(null);
      if (users.length === 1 && page > 1) setPage((p) => p - 1);
      else fetchUsers(page, search);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.error?.message ||
          err.message ||
          "Failed to retain user"
      );
    } finally {
      setRetaining(false);
    }
  };

  const columns = [
    {
      name: "User",
      selector: (row) => row.name,
      sortable: true,
      grow: 2,
      cell: (row) => (
        <div className="flex items-center gap-3 py-1.5">
          <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center font-bold text-sm flex-shrink-0 ring-2 ring-white shadow-sm overflow-hidden">
            {row.avatar ? (
              <img
                src={row.avatar}
                alt={row.name}
                className="w-10 h-10 rounded-full object-cover opacity-60"
              />
            ) : (
              row.name?.charAt(0)?.toUpperCase() || "U"
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-[13.5px] text-slate-500 truncate line-through decoration-red-300">
              {row.name}
            </p>
            <p className="text-[12px] text-slate-400 truncate flex items-center gap-1">
              <Mail size={12} />
              {row.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      name: "Role",
      selector: (row) => row.role,
      sortable: true,
      width: "120px",
      cell: (row) => (
        <span
          className={`px-2.5 py-1 text-[11px] font-semibold rounded-full capitalize opacity-70 ${roleColor(row.role)}`}
        >
          {row.role}
        </span>
      ),
    },
    {
      name: "Deleted At",
      selector: (row) => row.deletedAt,
      sortable: true,
      width: "180px",
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <Calendar size={14} className="text-red-400 flex-shrink-0" />
          <span className="text-[13px] text-slate-600">
            {formatDateTime(row.deletedAt)}
          </span>
        </div>
      ),
    },
    {
      name: "Reason",
      selector: (row) => row.deleteReason,
      sortable: false,
      width: "200px",
      cell: (row) => (
        <span
          className="text-[13px] text-slate-400 truncate max-w-[180px] block"
          title={row.deleteReason || ""}
        >
          {row.deleteReason || "No reason provided"}
        </span>
      ),
    },
    {
      name: "Joined",
      selector: (row) => row.createdAt,
      sortable: true,
      width: "120px",
      cell: (row) => (
        <span className="text-[13px] text-slate-400">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      name: "Actions",
      width: "160px",
      center: true,
      cell: (row) => (
        <div className="flex items-center justify-center gap-1.5">
          {hasFeature("canDeleteUsers") && (
            <button
              onClick={() => openRetainModal(row)}
              className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all duration-150 hover:scale-105"
              title="Retain User"
            >
              <RotateCcw size={15} />
            </button>
          )}
          {hasFeature("canHardDeleteUsers") && (
            <button
              onClick={() => openConfirmModal(row)}
              className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-all duration-150 hover:scale-105"
              title="Permanently Delete"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Deleted Users"
        subtitle={`${totalRows} deleted user${totalRows !== 1 ? "s" : ""} found`}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl w-64 sm:w-72 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </PageHeader>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl">
        <Info size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
        <p className="text-[13px] text-slate-600 leading-relaxed">
          These users have been soft-deleted and no longer appear in the main
          Users list. You can restore them or permanently remove them here.
        </p>
      </div>

      {/* DataTable */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={users}
          customStyles={tableCustomStyles}
          progressPending={loading}
          progressComponent={
            <div className="py-14 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
              <Loader2 size={24} className="animate-spin text-blue-500" />
              Loading deleted users...
            </div>
          }
          noDataComponent={
            <div className="py-14 text-center text-slate-400 text-sm">
              No deleted users found
            </div>
          }
          pagination
          paginationServer
          paginationTotalRows={totalRows}
          paginationPerPage={limit}
          paginationRowsPerPageOptions={PAGINATION_OPTIONS}
          paginationDefaultPage={page}
          onChangePage={handlePageChange}
          onChangeRowsPerPage={(rows) => {
            setLimit(rows);
            setPage(1);
          }}
          highlightOnHover
          pointerOnHover={false}
        />
      </div>

      {/* ========== HARD DELETE MODAL ========== */}
      {confirmModal && targetUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-red-100 rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle size={20} className="text-red-500" />
                Permanently Delete User?
              </h2>
              <button
                onClick={closeConfirmModal}
                disabled={deleting}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center font-bold text-sm flex-shrink-0 overflow-hidden">
                  {targetUser.avatar ? (
                    <img
                      src={targetUser.avatar}
                      alt={targetUser.name}
                      className="w-10 h-10 rounded-full object-cover opacity-60"
                    />
                  ) : (
                    targetUser.name?.charAt(0)?.toUpperCase() || "U"
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 truncate">{targetUser.name}</p>
                  <p className="text-sm text-slate-400 truncate">{targetUser.email}</p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <p className="text-[13px] text-slate-700 leading-relaxed">
                  This action permanently removes this user, their channels and
                  videos, and related comments, watch sessions, and references.
                  <span className="font-semibold text-red-600"> This cannot be undone.</span>
                </p>
              </div>

              <p className="text-[13px] text-slate-500">
                Are you sure you want to permanently delete this user?
              </p>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={closeConfirmModal}
                  disabled={deleting}
                  className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl font-medium transition disabled:opacity-50"
                >
                  No, Cancel
                </button>
                <button
                  onClick={handleHardDelete}
                  disabled={deleting}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition shadow-sm"
                >
                  {deleting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Yes, Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== RETAIN MODAL ========== */}
      {retainModal && retainTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-emerald-100 rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <RotateCcw size={20} className="text-emerald-500" />
                Retain User?
              </h2>
              <button
                onClick={closeRetainModal}
                disabled={retaining}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm flex-shrink-0 overflow-hidden">
                  {retainTarget.avatar ? (
                    <img
                      src={retainTarget.avatar}
                      alt={retainTarget.name}
                      className="w-10 h-10 rounded-full object-cover opacity-60"
                    />
                  ) : (
                    retainTarget.name?.charAt(0)?.toUpperCase() || "U"
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 truncate">{retainTarget.name}</p>
                  <p className="text-sm text-slate-400 truncate">{retainTarget.email}</p>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                <p className="text-[13px] text-slate-700 leading-relaxed">
                  This will restore the user and move them back to the normal
                  Users list. They will be able to log in again.
                </p>
              </div>

              <p className="text-[13px] text-slate-500">
                Are you sure you want to retain this user?
              </p>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={closeRetainModal}
                  disabled={retaining}
                  className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl font-medium transition disabled:opacity-50"
                >
                  No, Cancel
                </button>
                <button
                  onClick={handleRetain}
                  disabled={retaining}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition shadow-sm"
                >
                  {retaining ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Retaining...
                    </>
                  ) : (
                    <>
                      <RotateCcw size={16} />
                      Yes, Retain
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}