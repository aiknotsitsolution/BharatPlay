import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, AlertCircle, Search, X, FileText, User, Info } from "lucide-react";
import toast from "react-hot-toast";
import { createCopyrightCase, searchVideos, searchUsers } from "../../../api";
import { hasFeature } from "../../../config/roleConfig";

const claimTypes = [
  { value: "takedown", label: "Takedown Request" },
  { value: "infringement", label: "Infringement Notice" },
];

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function SearchableSelect({
  label,
  required,
  placeholder,
  searchFn,
  renderItem,
  onSelect,
  selectedLabel,
  onClear,
  error,
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const wrapperRef = useRef(null);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    searchFn(debouncedQuery)
      .then((res) => {
        if (!cancelled) setResults(res.data?.data || []);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [debouncedQuery, searchFn]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e) => {
    if (!open || !results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter" && highlight >= 0) {
      e.preventDefault();
      handleSelect(results[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const handleSelect = (item) => {
    onSelect(item);
    setQuery("");
    setResults([]);
    setOpen(false);
    setHighlight(-1);
  };

  const handleClear = () => {
    onClear();
    setQuery("");
    setResults([]);
    setHighlight(-1);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-[13px] font-medium text-gray-300 mb-1.5">
        {label}
      </label>
      {selectedLabel ? (
        <div className="flex items-center gap-2 w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm">
          <span className="flex-1 truncate">{selectedLabel}</span>
          <button
            type="button"
            onClick={handleClear}
            className="p-0.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setHighlight(-1);
            }}
            onFocus={() => query.trim() && setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
          {results.map((item, i) => (
            <div
              key={item._id}
              onMouseDown={() => handleSelect(item)}
              onMouseEnter={() => setHighlight(i)}
              className={`px-3 py-2.5 cursor-pointer text-sm border-b border-gray-700/50 last:border-0 transition-colors ${
                i === highlight
                  ? "bg-indigo-600/20 text-white"
                  : "text-gray-300 hover:bg-gray-700/50"
              }`}
            >
              {renderItem(item)}
            </div>
          ))}
        </div>
      )}
      {open && debouncedQuery.trim() && !loading && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-xl px-3 py-2.5 text-sm text-gray-500">
          No results found
        </div>
      )}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

export default function CopyrightCreateCase() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState([]);

  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const [form, setForm] = useState({
    claimantName: "",
    claimantEmail: "",
    claimantOrganization: "",
    claimantPhone: "",
    claimType: "takedown",
    claimDescription: "",
    originalWork: "",
    originalWorkUrl: "",
    priority: "medium",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors([]);
  };

  const validate = () => {
    const errs = [];
    if (!selectedVideo) errs.push("Please select a video");
    if (!selectedUser) errs.push("Please select a respondent user");
    if (!form.claimantName.trim()) errs.push("Claimant name is required");
    if (!form.claimantEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.claimantEmail.trim())) {
      errs.push("A valid claimant email is required");
    }
    if (!form.claimType) errs.push("Claim type is required");
    if (!form.claimDescription.trim()) errs.push("Claim description is required");
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      await createCopyrightCase({
        videoId: selectedVideo._id,
        respondentId: selectedUser._id,
        claimantName: form.claimantName.trim(),
        claimantEmail: form.claimantEmail.trim().toLowerCase(),
        claimantOrganization: form.claimantOrganization.trim(),
        claimType: form.claimType,
        claimDescription: form.claimDescription.trim(),
        originalWork: form.originalWork.trim(),
        originalWorkUrl: form.originalWorkUrl.trim(),
        priority: form.priority,
      });
      toast.success("Copyright case created successfully");
      navigate("/copyright/cases");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to create copyright case";
      toast.error(msg);
      setErrors([msg]);
    } finally {
      setSubmitting(false);
    }
  };

  const videoSearchFn = useCallback((q) => searchVideos(q), []);
  const userSearchFn = useCallback((q) => searchUsers(q), []);

  const inputCls =
    "w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors";
  const selectCls =
    "w-full px-3 py-2 pr-9 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_10px_center] bg-no-repeat";

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate(-1)}
          className="mt-0.5 p-2 rounded-lg border border-gray-700 bg-gray-800/60 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          title="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-white leading-tight">
            Create Copyright Case
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            File a copyright claim against a video
          </p>
        </div>
      </div>

      <p className="text-xs text-gray-500">Required fields must be completed.</p>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-red-400 text-sm">Please fix the following:</p>
              <ul className="mt-1 space-y-0.5">
                {errors.map((err, i) => (
                  <li key={i} className="text-sm text-red-300">{err}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Target Content */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 space-y-4">
          <div>
            <h2 className="text-[15px] font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              Target Content
            </h2>
            <p className="text-xs text-gray-500 mt-0.5 ml-6">
              Search and select the video and respondent user
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SearchableSelect
              label="Video"
              required
              placeholder="Search by video title..."
              searchFn={videoSearchFn}
              selectedLabel={selectedVideo ? selectedVideo.title : null}
              onSelect={(video) => {
                setSelectedVideo(video);
                if (video.uploaderId && !selectedUser) {
                  setSelectedUser({ _id: video.uploaderId, name: video.uploaderName, email: "" });
                }
                setErrors((prev) => prev.filter((e) => !e.includes("video")));
              }}
              onClear={() => {
                setSelectedVideo(null);
                setSelectedUser(null);
              }}
              renderItem={(v) => (
                <div className="flex items-center gap-3">
                  {v.thumbnail ? (
                    <img src={v.thumbnail} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-gray-700 flex items-center justify-center text-xs text-gray-500 shrink-0">
                      No
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate">{v.title}</p>
                    <p className="text-xs text-gray-500 truncate">
                      by {v.uploaderName}
                      {v.videoType?.length ? ` · ${v.videoType.join(", ")}` : ""}
                    </p>
                  </div>
                </div>
              )}
              error={errors.find((e) => e.includes("video"))}
            />

            <SearchableSelect
              label="Respondent User"
              required
              placeholder="Search by name or email..."
              searchFn={userSearchFn}
              selectedLabel={selectedUser ? `${selectedUser.name}${selectedUser.email ? ` (${selectedUser.email})` : ""}` : null}
              onSelect={(user) => {
                setSelectedUser(user);
                setErrors((prev) => prev.filter((e) => !e.includes("user")));
              }}
              onClear={() => setSelectedUser(null)}
              renderItem={(u) => (
                <div className="flex items-center gap-3">
                  {u.avatar ? (
                    <img src={u.avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400 shrink-0">
                      {u.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate">{u.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {u.email}
                      {u.role ? ` · ${u.role}` : ""}
                    </p>
                  </div>
                </div>
              )}
              error={errors.find((e) => e.includes("user"))}
            />
          </div>
          {selectedVideo && selectedUser && (
            <p className="text-xs text-gray-500 flex items-center gap-1.5 ml-6">
              <Info className="w-3.5 h-3.5 shrink-0" />
              Respondent auto-filled from video uploader. You can change it by searching again.
            </p>
          )}
        </div>

        {/* Claimant */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 space-y-4">
          <div>
            <h2 className="text-[15px] font-semibold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              Claimant Information
            </h2>
            <p className="text-xs text-gray-500 mt-0.5 ml-6">
              Contact details of the party filing the claim
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-gray-300 mb-1.5">
                Name
              </label>
              <input
                type="text"
                name="claimantName"
                value={form.claimantName}
                onChange={handleChange}
                placeholder="Claimant full name"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                name="claimantEmail"
                value={form.claimantEmail}
                onChange={handleChange}
                placeholder="claimant@example.com"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-300 mb-1.5">
                Organization
              </label>
              <input
                type="text"
                name="claimantOrganization"
                value={form.claimantOrganization}
                onChange={handleChange}
                placeholder="Company or label (optional)"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-300 mb-1.5">
                Phone
              </label>
              <input
                type="tel"
                name="claimantPhone"
                value={form.claimantPhone}
                onChange={handleChange}
                placeholder="Contact phone (optional)"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Claim Details */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 space-y-4">
          <div>
            <h2 className="text-[15px] font-semibold text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-gray-500" />
              Claim Details
            </h2>
            <p className="text-xs text-gray-500 mt-0.5 ml-6">
              Describe the claim and reference the original work
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-gray-300 mb-1.5">
                Claim Type
              </label>
              <select
                name="claimType"
                value={form.claimType}
                onChange={handleChange}
                className={selectCls}
              >
                {claimTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-300 mb-1.5">
                Priority
              </label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className={selectCls}
              >
                {priorityOptions.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-medium text-gray-300 mb-1.5">
              Claim Description
            </label>
            <textarea
              name="claimDescription"
              value={form.claimDescription}
              onChange={handleChange}
              rows={4}
              placeholder="Describe the copyright violation in detail..."
              className={`${inputCls} resize-none`}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-gray-300 mb-1.5">
                Original Work Title
              </label>
              <input
                type="text"
                name="originalWork"
                value={form.originalWork}
                onChange={handleChange}
                placeholder="Title of the original work"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-300 mb-1.5">
                Original Work URL
              </label>
              <input
                type="url"
                name="originalWorkUrl"
                value={form.originalWorkUrl}
                onChange={handleChange}
                placeholder="https://..."
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-800 hover:bg-gray-750 hover:text-gray-300 border border-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          {hasFeature("canCreateCopyrightCase") && (
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {submitting ? "Creating..." : "Create Case"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
