"use client";

import { useState, useEffect, useCallback } from "react";
import DataTable from "react-data-table-component";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Search,
  Trash2,
  Loader2,
  Mail,
  X,
  UserX,
  AlertTriangle,
  Calendar,
  Shield,
  Info,
  RotateCcw,
} from "lucide-react";
import { hasFeature } from "../../config/roleConfig";
import { API_BASE_URL, fetchDeletedUsers, hardDeleteUser, restoreAdminUser } from "../../api";
import tableCustomStyles from "../../utils/tableStyles";

const BASE_URL = API_BASE_URL;
const LIMIT = 15;

export default function DeletedUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState(false);
  const [targetUser, setTargetUser] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Retain modal state
  const [retainModal, setRetainModal] = useState(false);
  const [retainTarget, setRetainTarget] = useState(null);
  const [retaining, setRetaining] = useState(false);

  const fetchUsers = useCallback(async (pageNum = 1, searchTerm = "") => {
    try {
      setLoading(true);
      const res = await fetchDeletedUsers({
        page: pageNum,
        limit: LIMIT,
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
  }, []);

  useEffect(() => {
    fetchUsers(page, search);
  }, [page, fetchUsers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) {
        setPage(1);
      } else {
        fetchUsers(1, search);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

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

      if (users.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        fetchUsers(page, search);
      }
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
      await restoreAdminUser(retainTarget._id);
      toast.success("User retained and restored to active list");
      setRetainModal(false);
      setRetainTarget(null);

      if (users.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        fetchUsers(page, search);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to retain user");
    } finally {
      setRetaining(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const roleColor = (role) => {
    if (role === "admin")
      return "bg-purple-500/15 text-purple-400 border border-purple-500/20";
    if (role === "creator")
      return "bg-blue-500/15 text-blue-400 border border-blue-500/20";
    return "bg-gray-500/15 text-gray-400 border border-gray-500/20";
  };

  const columns = [
    {
      name: "User",
      selector: (row) => row.name,
      sortable: true,
      grow: 2,
      cell: (row) => (
        <div className="flex items-center gap-3 py-1">
          <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
            {row.avatar ? (
              <img
                src={row.avatar}
                alt={row.name}
                className="w-10 h-10 rounded-full object-cover opacity-50"
              />
            ) : (
              row.name?.charAt(0)?.toUpperCase() || "U"
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-400 truncate line-through decoration-red-500/50">
              {row.name}
            </p>
            <p className="text-sm text-gray-500 truncate flex items-center gap-1">
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
          className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize opacity-60 ${roleColor(
            row.role
          )}`}
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
          <span className="text-sm text-gray-400">
            {formatDate(row.deletedAt)}
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
        <span className="text-sm text-gray-500 truncate max-w-[180px] block" title={row.deleteReason || ""}>
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
        <span className="text-sm text-gray-500">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      name: "Actions",
      width: "200px",
      center: true,
      cell: (row) => (
        <div className="flex items-center justify-center gap-2">
          {hasFeature("canDeleteUsers") && (
            <button
              onClick={() => openRetainModal(row)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium 
                         text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 
                         border border-emerald-500/20 rounded-lg transition"
              title="Retain User"
            >
              <RotateCcw size={16} />
            </button>
          )}
          {hasFeature("canHardDeleteUsers") && (
            <button
              onClick={() => openConfirmModal(row)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium 
                         text-red-400 bg-red-500/10 hover:bg-red-500/20 
                         border border-red-500/20 rounded-lg transition"
              title="Permanently Delete"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <UserX size={28} className="text-red-400" />
            Deleted Users
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {totalRows} deleted user{totalRows !== 1 ? "s" : ""} found
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg 
                       focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 
                       w-72 text-gray-100 placeholder-gray-500"
          />
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-center gap-3 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
        <Info size={18} className="text-red-400 flex-shrink-0" />
        <p className="text-sm text-gray-400">
          These users have been soft-deleted and no longer appear in the main Users list. You can permanently remove them here.
        </p>
      </div>

      {/* DataTable */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <DataTable
          columns={columns}
          data={users}
          customStyles={tableCustomStyles}
          progressPending={loading}
          progressComponent={
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2
                size={40}
                className="animate-spin text-red-400 mb-3"
              />
              <p className="text-gray-400">Loading deleted users...</p>
            </div>
          }
          noDataComponent={
            <div className="text-center py-20 text-gray-500">
              <UserX size={40} className="mx-auto mb-3 opacity-40" />
              <p className="text-lg font-medium text-gray-400">
                No deleted users found
              </p>
            </div>
          }
          pagination
          paginationServer
          paginationTotalRows={totalRows}
          paginationPerPage={LIMIT}
          paginationDefaultPage={page}
          onChangePage={handlePageChange}
          paginationComponentOptions={{
            noRowsPerPage: true,
          }}
          highlightOnHover
          pointerOnHover={false}
          responsive
          theme="dark"
        />
      </div>

      {/* ========== CONFIRMATION MODAL ========== */}
      {confirmModal && targetUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-red-500/30 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertTriangle size={22} className="text-red-400" />
                Permanently Delete User?
              </h2>
              <button
                onClick={closeConfirmModal}
                disabled={deleting}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-800/50 border border-gray-700/50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {targetUser.avatar ? (
                    <img
                      src={targetUser.avatar}
                      alt={targetUser.name}
                      className="w-10 h-10 rounded-full object-cover opacity-50"
                    />
                  ) : (
                    targetUser.name?.charAt(0)?.toUpperCase() || "U"
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-200 truncate">
                    {targetUser.name}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {targetUser.email}
                  </p>
                </div>
              </div>

              <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                <p className="text-sm text-gray-300 leading-relaxed">
                  This action will permanently remove this user and their database record. 
                  <span className="font-semibold text-red-400"> This cannot be undone.</span>
                </p>
              </div>

              <p className="text-sm text-gray-400">
                Are you sure you want to permanently delete this user?
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeConfirmModal}
                  disabled={deleting}
                  className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition disabled:opacity-50"
                >
                  No, Cancel
                </button>
                <button
                  onClick={handleHardDelete}
                  disabled={deleting}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white rounded-lg 
                             font-medium flex items-center justify-center gap-2 disabled:cursor-not-allowed transition"
                >
                  {deleting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Yes, Permanently Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== RETAIN CONFIRMATION MODAL ========== */}
      {retainModal && retainTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-emerald-500/30 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <RotateCcw size={22} className="text-emerald-400" />
                Retain User?
              </h2>
              <button
                onClick={closeRetainModal}
                disabled={retaining}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-800/50 border border-gray-700/50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {retainTarget.avatar ? (
                    <img
                      src={retainTarget.avatar}
                      alt={retainTarget.name}
                      className="w-10 h-10 rounded-full object-cover opacity-50"
                    />
                  ) : (
                    retainTarget.name?.charAt(0)?.toUpperCase() || "U"
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-200 truncate">
                    {retainTarget.name}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {retainTarget.email}
                  </p>
                </div>
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
                <p className="text-sm text-gray-300 leading-relaxed">
                  This will restore the user and move them back to the normal Users list.
                </p>
              </div>

              <p className="text-sm text-gray-400">
                Are you sure you want to retain this user?
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeRetainModal}
                  disabled={retaining}
                  className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition disabled:opacity-50"
                >
                  No, Cancel
                </button>
                <button
                  onClick={handleRetain}
                  disabled={retaining}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white rounded-lg 
                             font-medium flex items-center justify-center gap-2 disabled:cursor-not-allowed transition"
                >
                  {retaining ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Retaining...
                    </>
                  ) : (
                    <>
                      <RotateCcw size={16} />
                      Yes, Retain User
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
