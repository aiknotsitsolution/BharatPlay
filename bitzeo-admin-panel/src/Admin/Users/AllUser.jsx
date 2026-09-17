import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import DataTable from "react-data-table-component";
import toast from "react-hot-toast";
import { roleColor } from "../../utils/helpers";
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

const allUserTableStyles = {
  ...tableCustomStyles,
  headCells: {
    style: {
      ...tableCustomStyles.headCells.style,
      textAlign: "center",
      justifyContent: "center",
    },
  },
};

const BASE_URL = API_BASE_URL;
const LIMIT = 15;

const isShortVideo = (v) => {
  const t = v?.videoType;
  return Array.isArray(t) ? t.includes("short") : t === "short";
};

function VideoListItem({ video }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-bp-elevated/50 border border-bp-border/50 rounded-xl">
      <div className="w-16 h-10 rounded-lg bg-bp-elevated overflow-hidden flex-shrink-0">
        {video.thumbnail && (
          <img
            src={video.thumbnail}
            className="w-full h-full object-cover"
            alt={video.title}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-bp-text truncate">
          {video.title}
        </p>
        <p className="text-xs text-bp-yellow">{video.channelName}</p>
      </div>
      <span className="text-xs text-bp-text-muted">{video.views || 0} views</span>
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

  const columns = useMemo(
    () => [
      {
        name: "User",
        selector: (row) => row.name,
        sortable: true,
        grow: 1,
        cell: (row) => (
          <div className="flex items-center gap-3 py-1 overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-bp-blue/20 text-bp-blue flex items-center justify-center font-bold text-sm flex-shrink-0">
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
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="font-medium text-bp-text truncate">{row.name}</p>
              <div className="flex items-center gap-1">
                <Mail size={12} className="text-bp-text-muted flex-shrink-0" />
                <p className="text-sm text-bp-text-muted truncate min-w-0" title={row.email}>{row.email}</p>
              </div>
            </div>
          </div>
        ),
      },
      {
        name: "Role",
        selector: (row) => row.role,
        sortable: true,
        cell: (row) => (
          <div className="pl-8">
            <span
              className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${roleColor(row.role)}`}
            >
              {row.role}
            </span>
          </div>
        ),
      },
      {
        name: "Channels",
        selector: (row) => row.totalChannels,
        sortable: true,
        cell: (row) => (
          <div className="flex items-center gap-1.5 pl-12">
            <Tv size={15} className="text-bp-yellow" />
            <span className="font-semibold text-bp-text">
              {row.totalChannels}
            </span>
          </div>
        ),
      },
      {
        name: "Videos",
        selector: (row) => row.totalVideos,
        sortable: true,
        cell: (row) => (
          <div className="flex items-center gap-1.5 pl-12">
            <Video size={15} className="text-bp-cyan" />
            <span className="font-semibold text-bp-text">
              {row.totalVideos}
            </span>
          </div>
        ),
      },
      {
        name: "Trust",
        selector: (row) => row.trustScore,
        sortable: true,
        cell: (row) => (
          <span className="text-sm font-medium text-bp-text pl-12">
            {row.trustScore}
          </span>
        ),
      },
      {
        name: "Joined",
        selector: (row) => row.createdAt,
        sortable: true,
        cell: (row) => (
          <span className="text-sm text-bp-text-muted pl-8">
            {new Date(row.createdAt).toLocaleDateString()}
          </span>
        ),
      },
      {
        name: "Actions",
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
                           text-bp-blue bg-bp-blue/10 hover:bg-bp-blue/20 
                           border border-bp-blue/20 rounded-lg transition"
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-bp-text">Users</h1>
          <p className="text-[13px] text-bp-text-secondary mt-1">{totalRows} total users</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bp-text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-9 py-2.5 bg-bp-surface/60 border border-bp-border/50 rounded-xl w-72 text-sm text-bp-text placeholder:text-bp-text-muted focus:outline-none focus:ring-2 focus:ring-bp-blue/30 focus:border-bp-blue/40 hover:border-bp-border transition-colors duration-200"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-bp-text-muted hover:text-bp-text hover:bg-bp-elevated transition-colors duration-150"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* DataTable */}
      <div className="bg-bp-card rounded-2xl overflow-hidden">
        <DataTable
          columns={columns}
          data={users}
          customStyles={allUserTableStyles}
          progressPending={loading}
          progressComponent={
            <div className="py-12 text-center text-bp-text-muted">
              Loading users...
            </div>
          }
          noDataComponent={
            <div className="py-12 text-center text-bp-text-muted">
              No users found
            </div>
          }
          pagination
          paginationServer
          paginationTotalRows={totalRows}
          paginationPerPage={LIMIT}
          paginationDefaultPage={page}
          onChangePage={handlePageChange}
          highlightOnHover
          pointerOnHover={false}
        />
      </div>

      {/* ========== DETAIL MODAL ========== */}
      {detailModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="User Details">
          <div className="bg-bp-card border border-bp-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-bp-border sticky top-0 bg-bp-card z-10">
              <h2 className="text-xl font-bold text-bp-text">User Details</h2>
              <button
                onClick={() => setDetailModal(false)}
                className="p-1.5 text-bp-text-secondary hover:text-bp-text hover:bg-bp-elevated rounded-lg transition"
                aria-label="Close user details"
              >
                <X size={20} />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2
                  size={40}
                  className="animate-spin text-bp-blue mb-3"
                />
                <p className="text-bp-text-secondary">Loading full details...</p>
              </div>
            ) : selectedUser ? (
              <div className="p-5 space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-bp-blue/20 text-bp-blue flex items-center justify-center text-2xl font-bold">
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
                    <h3 className="text-lg font-bold text-bp-text">
                      {selectedUser.name}
                    </h3>
                    <p className="text-bp-text-secondary">{selectedUser.email}</p>
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
                  <div className="bg-bp-yellow/10 border border-bp-yellow/20 p-3 rounded-xl text-center">
                    <p className="text-2xl font-bold text-bp-yellow">
                      {selectedUser.totalChannels}
                    </p>
                    <p className="text-xs text-bp-cyan/80">Channels</p>
                  </div>
                  <div className="bg-bp-cyan/10 border border-bp-cyan/20 p-3 rounded-xl text-center">
                    <p className="text-2xl font-bold text-bp-cyan">
                      {selectedUser.totalVideos}
                    </p>
                    <p className="text-xs text-blue-500/80">Videos</p>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-center">
                    <p className="text-2xl font-bold text-emerald-600">
                      {selectedUser.trustScore}
                    </p>
                    <p className="text-xs text-emerald-500/80">Trust Score</p>
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/20 p-3 rounded-xl text-center">
                    <p className="text-2xl font-bold text-bp-cyan">
                      {selectedUser.rewardPoints}
                    </p>
                    <p className="text-xs text-purple-500/80">Points</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-bp-text mb-3 flex items-center gap-2">
                    <Tv size={18} className="text-bp-yellow" />
                    Channels ({selectedUser.totalChannels})
                  </h4>
                  {!selectedUser.channels?.length ? (
                    <p className="text-sm text-bp-text-muted">No channels found</p>
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
                                ? "bg-bp-yellow/10 border-bp-yellow/30"
                                : "bg-bp-elevated/50 border-bp-border/50 hover:bg-bp-elevated hover:border-bp-border"
                            }`}
                          >
                            <div className="w-10 h-10 rounded-lg bg-bp-yellow/15 flex items-center justify-center flex-shrink-0">
                              {ch.channelImage ? (
                                <img
                                  src={ch.channelImage}
                                  className="w-10 h-10 rounded-lg object-cover"
                                  alt={ch.name}
                                />
                              ) : (
                                <Tv size={18} className="text-bp-yellow" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p
                                className={`font-medium truncate ${
                                  isActive ? "text-bp-yellow" : "text-bp-text"
                                }`}
                              >
                                {ch.name}
                              </p>
                              <p className="text-xs text-bp-text-muted">
                                {ch.totalVideos} videos
                              </p>
                            </div>
                            {isActive && (
                              <Check
                                size={18}
                                className="text-bp-yellow flex-shrink-0"
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
                          ? "bg-bp-cyan/15 border-bp-cyan/30 text-bp-cyan"
                          : "bg-bp-elevated/50 border-bp-border/50 text-bp-text-secondary hover:bg-bp-elevated hover:text-bp-text"
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
                          ? "bg-bp-yellow/15 border-bp-yellow/30 text-bp-yellow"
                          : "bg-bp-elevated/50 border-bp-border/50 text-bp-text-secondary hover:bg-bp-elevated hover:text-bp-text"
                      }`}
                    >
                      <Clapperboard size={16} />
                      Shorts ({channelShorts.length})
                    </button>
                  </div>

                  {activeMediaTab === "videos" ? (
                    channelVideos.length === 0 ? (
                      <p className="text-sm text-bp-text-muted">No videos found</p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {channelVideos.map((v) => (
                          <VideoListItem key={v._id} video={v} />
                        ))}
                      </div>
                    )
                  ) : channelShorts.length === 0 ? (
                    <p className="text-sm text-bp-text-muted">No shorts found</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {channelShorts.map((v) => (
                        <VideoListItem key={v._id} video={v} />
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-bp-border">
                  {hasFeature("canEditUsers") && (
                    <button
                      onClick={openEditFromDetail}
                      className="w-full py-2.5 bg-bp-blue hover:bg-bp-blue/90 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition"
                    >
                      <Edit size={18} />
                      Update User
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-bp-text-muted">
                User not found
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== EDIT MODAL ========== */}
      {editModal && selectedUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Edit User">
          <div className="bg-bp-card border border-bp-border rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-bp-border">
              <h2 className="text-xl font-bold text-white">Edit User</h2>
              <button
                onClick={() => setEditModal(false)}
                className="p-1.5 text-bp-text-secondary hover:text-bp-text hover:bg-bp-elevated rounded-lg transition"
                aria-label="Close edit user"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">
                  Name
                </label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-bp-elevated border border-bp-border rounded-lg 
                             text-white focus:ring-2 focus:ring-bp-blue focus:border-bp-blue outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-1.5">
                  Email
                </label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-bp-elevated border border-bp-border rounded-lg 
                             text-white focus:ring-2 focus:ring-bp-blue focus:border-bp-blue outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-1.5">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-bp-elevated border border-bp-border rounded-lg 
                             text-white focus:ring-2 focus:ring-bp-blue focus:border-bp-blue outline-none"
                >
                  <option value="viewer">Viewer</option>
                  <option value="creator">Creator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">
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
                    className="w-full px-4 py-2.5 bg-bp-elevated border border-bp-border rounded-lg 
                               text-white focus:ring-2 focus:ring-bp-blue focus:border-bp-blue outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1.5">
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
                    className="w-full px-4 py-2.5 bg-bp-elevated border border-bp-border rounded-lg 
                               text-white focus:ring-2 focus:ring-bp-blue focus:border-bp-blue outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                {hasFeature("canEditUsers") && (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 bg-bp-blue hover:bg-bp-blue/90 text-white rounded-lg 
                               font-medium flex items-center justify-center gap-2 disabled:opacity-60 transition"
                  >
                    {submitting && <Loader2 size={16} className="animate-spin" />}
                    Save Changes
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setEditModal(false)}
                  className="flex-1 py-2.5 bg-bp-elevated hover:bg-bp-border text-white rounded-lg font-medium transition"
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