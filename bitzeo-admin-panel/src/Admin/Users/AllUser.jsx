"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import DataTable from "react-data-table-component";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Search,
  Edit,
  Trash2,
  Loader2,
  Tv,
  Video,
  Mail,
  X,
  User,
  Eye,
  Check,
  Clapperboard,
} from "lucide-react";
import { hasFeature } from "../../config/roleConfig";
import { API_BASE_URL } from "../../api";
import tableCustomStyles from "../../utils/tableStyles";

const BASE_URL = API_BASE_URL;
const LIMIT = 15;

const isShortVideo = (v) => {
  const t = v?.videoType;
  return Array.isArray(t) ? t.includes("short") : t === "short";
};

function VideoListItem({ video }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-800/50 border border-gray-700/50 rounded-xl">
      <div className="w-16 h-10 rounded-lg bg-gray-800 overflow-hidden flex-shrink-0">
        {video.thumbnail && (
          <img
            src={video.thumbnail}
            className="w-full h-full object-cover"
            alt={video.title}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-gray-200 truncate">
          {video.title}
        </p>
        <p className="text-xs text-amber-400">{video.channelName}</p>
      </div>
      <span className="text-xs text-gray-500">{video.views || 0} views</span>
    </div>
  );
}

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [activeMediaTab, setActiveMediaTab] = useState("videos");
  const [editModal, setEditModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "creator",
    trustScore: 50,
    rewardPoints: 0,
  });

  const fetchUsers = useCallback(async (pageNum = 1, searchTerm = "") => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/admin/alluser`, {
        params: { page: pageNum, limit: LIMIT, search: searchTerm },
      });

      setUsers(res.data?.data || []);
      setTotalRows(res.data?.pagination?.total || 0);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load users");
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

  const openDetail = async (userId) => {
    try {
      setDetailLoading(true);
      setDetailModal(true);
      setSelectedUser(null);
      setSelectedChannel(null);
      setActiveMediaTab("videos");

      const res = await axios.get(`${BASE_URL}/admin/users/${userId}`);
      const data = res.data?.data || null;
      setSelectedUser(data);
      setSelectedChannel(data?.channels?.[0] || null);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to load user details");
      setDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const openEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "creator",
      trustScore: user.trustScore ?? 50,
      rewardPoints: user.rewardPoints ?? 0,
    });
    setEditModal(true);
  };

  const openEditFromDetail = () => {
    if (!selectedUser) return;
    setDetailModal(false);
    openEdit(selectedUser);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setSubmitting(true);
      await axios.put(`${BASE_URL}/admin/users/${selectedUser._id}`, formData);
      toast.success("User updated successfully");
      setEditModal(false);
      fetchUsers(page, search);
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await axios.delete(`${BASE_URL}/admin/users/${id}`);
      toast.success("User deleted successfully");

      if (users.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        fetchUsers(page, search);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  const { channelVideos, channelShorts } = useMemo(() => {
    const list = selectedChannel?.videos || [];
    return {
      channelVideos: list.filter((v) => !isShortVideo(v)),
      channelShorts: list.filter((v) => isShortVideo(v)),
    };
  }, [selectedChannel]);

  const roleColor = (role) => {
    if (role === "admin")
      return "bg-purple-500/15 text-purple-400 border border-purple-500/20";
    if (role === "creator")
      return "bg-blue-500/15 text-blue-400 border border-blue-500/20";
    return "bg-gray-500/15 text-gray-400 border border-gray-500/20";
  };

  const columns = useMemo(
    () => [
      {
        name: "User",
        selector: (row) => row.name,
        sortable: true,
        grow: 2,
        cell: (row) => (
          <div className="flex items-center gap-3 py-1">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
              {row.avatar ? (
                <img
                  src={row.avatar}
                  alt={row.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                row.name?.charAt(0)?.toUpperCase() || "U"
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-gray-200 truncate">{row.name}</p>
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
            className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${roleColor(row.role)}`}
          >
            {row.role}
          </span>
        ),
      },
      {
        name: "Channels",
        selector: (row) => row.totalChannels,
        sortable: true,
        width: "110px",
        cell: (row) => (
          <div className="flex items-center gap-1.5">
            <Tv size={15} className="text-amber-400" />
            <span className="font-semibold text-gray-300">
              {row.totalChannels}
            </span>
          </div>
        ),
      },
      {
        name: "Videos",
        selector: (row) => row.totalVideos,
        sortable: true,
        width: "100px",
        cell: (row) => (
          <div className="flex items-center gap-1.5">
            <Video size={15} className="text-blue-400" />
            <span className="font-semibold text-gray-300">
              {row.totalVideos}
            </span>
          </div>
        ),
      },
      {
        name: "Trust",
        selector: (row) => row.trustScore,
        sortable: true,
        width: "90px",
        cell: (row) => (
          <span className="text-sm font-medium text-gray-300">
            {row.trustScore}
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
            <button
              onClick={() => navigate(`/users/${row._id}`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium 
                         text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 
                         border border-emerald-500/20 rounded-lg transition"
              title="View Full Details"
            >
              <Eye size={16} />
              
            </button>

            {hasFeature("canEditUsers") && (
              <button
                onClick={() => navigate(`/users/${row._id}/edit`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium 
                           text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 
                           border border-indigo-500/20 rounded-lg transition"
                title="Edit User"
              >
                <Edit size={16} />
              </button>
            )}

            {/* {hasFeature("canDeleteUsers") && (
              <button
                onClick={() => handleDelete(row._id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium 
                           text-red-400 bg-red-500/10 hover:bg-red-500/20 
                           border border-red-500/20 rounded-lg transition"
                title="Delete User"
              >
                <Trash2 size={16} />
              </button>
            )} */}
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-sm text-gray-400 mt-0.5">{totalRows} total users</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg 
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
                       w-72 text-gray-100 placeholder-gray-500"
          />
        </div>
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
                className="animate-spin text-indigo-400 mb-3"
              />
              <p className="text-gray-400">Loading users...</p>
            </div>
          }
          noDataComponent={
            <div className="text-center py-20 text-gray-500">
              <User size={40} className="mx-auto mb-3 opacity-40" />
              <p className="text-lg font-medium text-gray-400">No users found</p>
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

      {/* ========== DETAIL MODAL ========== */}
      {detailModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
              <h2 className="text-xl font-bold text-white">User Details</h2>
              <button
                onClick={() => setDetailModal(false)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2
                  size={40}
                  className="animate-spin text-indigo-400 mb-3"
                />
                <p className="text-gray-400">Loading full details...</p>
              </div>
            ) : selectedUser ? (
              <div className="p-5 space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-2xl font-bold">
                    {selectedUser.avatar ? (
                      <img
                        src={selectedUser.avatar}
                        className="w-16 h-16 rounded-full object-cover"
                        alt={selectedUser.name}
                      />
                    ) : (
                      selectedUser.name?.charAt(0)?.toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {selectedUser.name}
                    </h3>
                    <p className="text-gray-400">{selectedUser.email}</p>
                    <span
                      className={`mt-1 inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full capitalize ${roleColor(
                        selectedUser.role,
                      )}`}
                    >
                      {selectedUser.role}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-center">
                    <p className="text-2xl font-bold text-amber-400">
                      {selectedUser.totalChannels}
                    </p>
                    <p className="text-xs text-amber-500/80">Channels</p>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl text-center">
                    <p className="text-2xl font-bold text-blue-400">
                      {selectedUser.totalVideos}
                    </p>
                    <p className="text-xs text-blue-500/80">Videos</p>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-center">
                    <p className="text-2xl font-bold text-emerald-400">
                      {selectedUser.trustScore}
                    </p>
                    <p className="text-xs text-emerald-500/80">Trust Score</p>
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/20 p-3 rounded-xl text-center">
                    <p className="text-2xl font-bold text-purple-400">
                      {selectedUser.rewardPoints}
                    </p>
                    <p className="text-xs text-purple-500/80">Points</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-200 mb-3 flex items-center gap-2">
                    <Tv size={18} className="text-amber-400" />
                    Channels ({selectedUser.totalChannels})
                  </h4>
                  {!selectedUser.channels?.length ? (
                    <p className="text-sm text-gray-500">No channels found</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedUser.channels.map((ch) => {
                        const isActive = selectedChannel?._id === ch._id;
                        return (
                          <button
                            key={ch._id}
                            type="button"
                            onClick={() => setSelectedChannel(ch)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition ${
                              isActive
                                ? "bg-amber-500/10 border-amber-500/30"
                                : "bg-gray-800/50 border-gray-700/50 hover:bg-gray-800 hover:border-gray-600"
                            }`}
                          >
                            <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                              {ch.channelImage ? (
                                <img
                                  src={ch.channelImage}
                                  className="w-10 h-10 rounded-lg object-cover"
                                  alt={ch.name}
                                />
                              ) : (
                                <Tv size={18} className="text-amber-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p
                                className={`font-medium truncate ${
                                  isActive ? "text-amber-200" : "text-gray-200"
                                }`}
                              >
                                {ch.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {ch.totalVideos} videos
                              </p>
                            </div>
                            {isActive && (
                              <Check
                                size={18}
                                className="text-amber-400 flex-shrink-0"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setActiveMediaTab("videos")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-medium text-sm transition ${
                        activeMediaTab === "videos"
                          ? "bg-blue-500/15 border-blue-500/30 text-blue-300"
                          : "bg-gray-800/50 border-gray-700/50 text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                      }`}
                    >
                      <Video size={16} />
                      Videos ({channelVideos.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMediaTab("shorts")}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-medium text-sm transition ${
                        activeMediaTab === "shorts"
                          ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                          : "bg-gray-800/50 border-gray-700/50 text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                      }`}
                    >
                      <Clapperboard size={16} />
                      Shorts ({channelShorts.length})
                    </button>
                  </div>

                  {activeMediaTab === "videos" ? (
                    channelVideos.length === 0 ? (
                      <p className="text-sm text-gray-500">No videos found</p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {channelVideos.map((v) => (
                          <VideoListItem key={v._id} video={v} />
                        ))}
                      </div>
                    )
                  ) : channelShorts.length === 0 ? (
                    <p className="text-sm text-gray-500">No shorts found</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {channelShorts.map((v) => (
                        <VideoListItem key={v._id} video={v} />
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-gray-800">
                  {hasFeature("canEditUsers") && (
                    <button
                      onClick={openEditFromDetail}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition"
                    >
                      <Edit size={18} />
                      Update User
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-gray-500">
                User not found
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== EDIT MODAL ========== */}
      {editModal && selectedUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">Edit User</h2>
              <button
                onClick={() => setEditModal(false)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Name
                </label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg 
                             text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Email
                </label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg 
                             text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg 
                             text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  <option value="viewer">Viewer</option>
                  <option value="creator">Creator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Trust Score
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={formData.trustScore}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        trustScore: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg 
                               text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Reward Points
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.rewardPoints}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rewardPoints: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg 
                               text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                {hasFeature("canEditUsers") && (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg 
                               font-medium flex items-center justify-center gap-2 disabled:opacity-60 transition"
                  >
                    {submitting && <Loader2 size={16} className="animate-spin" />}
                    Save Changes
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setEditModal(false)}
                  className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}