import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import DataTable from "react-data-table-component";
import {
  Search,
  Loader2,
  AlertTriangle,
  Upload,
  Film,
  Video,
} from "lucide-react";
import { fetchUploads, setSearch } from "../../redux/slices/adminUploadsSlice";
import { API_BASE_URL } from "../../api";
import tableCustomStyles from "../../utils/tableStyles";

const MEDIA_BASE = API_BASE_URL.replace(/\/api\/?$/, "");
const TYPE_MAP = { all: "all", videos: "long", shorts: "short" };

const TAB_DEFS = [
  { key: "all", label: "All" },
  { key: "videos", label: "Videos" },
  { key: "shorts", label: "Shorts" },
];

const LIMIT = 10;

function formatDuration(sec) {
  if (!sec && sec !== 0) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function AllUploads() {
  const dispatch = useDispatch();
  const { tabs, counts } = useSelector((s) => s.adminUploads);

  const [activeTab, setActiveTab] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const debounceRef = useRef(null);

  const tab = tabs[activeTab] || tabs.all;
  const { items, pagination, _loading, _loaded, _error, _search } = tab;

  const loadData = useCallback(
    (type, page, search, force = false) => {
      dispatch(
        fetchUploads({
          tabKey: type,
          type: TYPE_MAP[type],
          page,
          limit: LIMIT,
          search,
          force,
        })
      );
    },
    [dispatch]
  );

  useEffect(() => {
    if (!_loaded && !_loading) {
      loadData(activeTab, 1, _search || "");
    }
  }, [activeTab, _loaded, _loading, _search, loadData]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    const t = tabs[newTab] || tabs.all;
    setSearchInput(t._search || "");
    if (!t._loaded && !t._loading) {
      loadData(newTab, 1, t._search || "");
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      dispatch(setSearch({ type: activeTab, search: val }));
      loadData(activeTab, 1, val);
    }, 400);
  };

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const handlePageChange = (newPage) => {
    loadData(activeTab, newPage, _search || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const columns = useMemo(
    () => [
      {
        name: "Content",
        selector: (row) => row.title,
        grow: 2,
        cell: (row) => {
          const thumbSrc = row.thumbnail
            ? row.thumbnail.startsWith("http")
              ? row.thumbnail
              : `${MEDIA_BASE}/${row.thumbnail}`
            : null;
          return (
            <div className="flex items-center gap-3 py-1">
              <div className="w-24 h-14 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                {thumbSrc ? (
                  <img
                    src={thumbSrc}
                    alt={row.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video size={18} className="text-gray-600" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-gray-200 truncate max-w-[200px]">
                  {row.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {row.category?.name || "—"}
                  {" · "}
                  {formatDuration(row.duration)}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        name: "Creator",
        selector: (row) => row.uploadedBy?.name,
        grow: 1,
        cell: (row) => (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {row.uploadedBy?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">
                {row.uploadedBy?.name || "Unknown"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {row.uploadedBy?.email || "—"}
              </p>
            </div>
          </div>
        ),
      },
      {
        name: "Type",
        selector: (row) => {
          const isVideo = Array.isArray(row.videoType)
            ? row.videoType.includes("long")
            : row.videoType === "long";
          return isVideo ? "Video" : "Short";
        },
        width: "110px",
        cell: (row) => {
          const isVideo = Array.isArray(row.videoType)
            ? row.videoType.includes("long")
            : row.videoType === "long";
          return (
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                isVideo
                  ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                  : "bg-pink-500/15 text-pink-400 border border-pink-500/20"
              }`}
            >
              {isVideo ? "Video" : "Short"}
            </span>
          );
        },
      },
      {
        name: "Views",
        selector: (row) => row.views || 0,
        sortable: true,
        width: "90px",
        cell: (row) => (
          <span className="text-gray-300 font-medium">
            {(row.views || 0).toLocaleString()}
          </span>
        ),
      },
      {
        name: "Likes",
        selector: (row) => row.likesCount || 0,
        sortable: true,
        width: "90px",
        cell: (row) => (
          <span className="text-gray-300 font-medium">
            {(row.likesCount || 0).toLocaleString()}
          </span>
        ),
      },
      {
        name: "Comments",
        selector: (row) => row.commentCount || 0,
        sortable: true,
        width: "110px",
        cell: (row) => (
          <span className="text-gray-300 font-medium">
            {(row.commentCount || 0).toLocaleString()}
          </span>
        ),
      },
      {
        name: "Date",
        selector: (row) => row.createdAt,
        sortable: true,
        width: "120px",
        cell: (row) => (
          <span className="text-gray-500 text-sm">
            {new Date(row.createdAt).toLocaleDateString()}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Upload className="w-6 h-6 text-blue-400" />
          Uploads
        </h1>
        <p className="text-gray-400 mt-1">Manage all videos and shorts</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
        {TAB_DEFS.map((t) => {
          const isActive = activeTab === t.key;
          const count = counts[t.key] || 0;
          return (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
              }`}
            >
              {t.label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-gray-800 text-gray-500"
                }`}
              >
                {count.toLocaleString()}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
        />
        <input
          type="text"
          placeholder="Search uploads..."
          value={searchInput}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Error */}
      {_error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertTriangle size={20} />
          <span className="flex-1">{_error}</span>
          <button
            onClick={() => loadData(activeTab, 1, _search || "", true)}
            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm font-medium transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <DataTable
          columns={columns}
          data={items}
          progressPending={_loading && !_loaded}
          progressComponent={
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={40} className="animate-spin text-indigo-400 mb-3" />
              <p className="text-gray-400">Loading uploads...</p>
            </div>
          }
          noDataComponent={
            <div className="text-center py-20 text-gray-500">
              <Film size={40} className="mx-auto mb-3 opacity-40" />
              <p className="text-lg font-medium text-gray-400">
                {_search
                  ? `No uploads found for "${_search}"`
                  : "No uploads yet"}
              </p>
            </div>
          }
          pagination
          paginationServer
          paginationTotalRows={pagination.total || 0}
          paginationPerPage={LIMIT}
          paginationDefaultPage={pagination.page || 1}
          onChangePage={handlePageChange}
          paginationComponentOptions={{
            noRowsPerPage: true,
          }}
          customStyles={tableCustomStyles}
          highlightOnHover
          pointerOnHover={false}
          responsive
          theme="dark"
        />
      </div>
    </div>
  );
}
