import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Send,
  Shield,
  Search,
  CheckCircle,
  AlertTriangle,
  FileText,
  Film,
  X,
} from "lucide-react";
import { API_ORIGIN } from "../config/api";

const claimTypes = [
  { value: "takedown", label: "Takedown Request" },
  { value: "infringement", label: "Infringement Notice" },
];

const statusColors = {
  pending: "text-yellow-400",
  under_review: "text-blue-400",
  more_information_required: "text-orange-400",
  takedown_approved: "text-red-400",
  takedown_rejected: "text-gray-400",
  resolved: "text-emerald-400",
  withdrawn: "text-gray-400",
};

const statusLabels = {
  pending: "Pending Review",
  under_review: "Under Review",
  more_information_required: "More Information Required",
  takedown_approved: "Takedown Approved",
  takedown_rejected: "Takedown Rejected",
  resolved: "Resolved",
  withdrawn: "Withdrawn",
};

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function VideoSearchSelect({
  label,
  placeholder,
  onSelect,
  selectedVideo,
  onClear,
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const wrapperRef = useRef(null);
  const debouncedQuery = useDebounce(query, 300);

  const searchMyVideos = useCallback(async (q) => {
    const token = localStorage.getItem("token");
    if (!token) return [];
    const res = await fetch(
      `${API_ORIGIN}/api/copyright/my-videos/search?q=${encodeURIComponent(q)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const data = await res.json();
    return data.data || [];
  }, []);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    searchMyVideos(debouncedQuery)
      .then((items) => {
        if (!cancelled) setResults(items);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, searchMyVideos]);

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

  const token = localStorage.getItem("token");

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-sm text-gray-400 mb-1.5">{label}</label>
      {selectedVideo ? (
        <div className="flex items-center gap-2 w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm">
          <Film size={14} className="text-indigo-400 shrink-0" />
          <span className="flex-1 truncate">{selectedVideo.title}</span>
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
            placeholder={
              token ? placeholder : "Login to search your videos (optional)"
            }
            disabled={!token}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto bg-gray-800 border border-gray-700 rounded-xl shadow-xl">
          {results.map((item, i) => (
            <div
              key={item._id}
              onMouseDown={() => handleSelect(item)}
              onMouseEnter={() => setHighlight(i)}
              className={`px-3 py-2.5 cursor-pointer text-sm border-b border-gray-700/50 last:border-0 transition-colors flex items-center gap-3 ${
                i === highlight
                  ? "bg-indigo-600/20 text-white"
                  : "text-gray-300 hover:bg-gray-700/50"
              }`}
            >
              {item.thumbnail ? (
                <img
                  src={item.thumbnail}
                  alt=""
                  className="w-10 h-6 object-cover rounded shrink-0"
                />
              ) : (
                <div className="w-10 h-6 bg-gray-700 rounded shrink-0 flex items-center justify-center">
                  <Film size={12} className="text-gray-500" />
                </div>
              )}
              <span className="truncate">{item.title}</span>
            </div>
          ))}
        </div>
      )}
      {open && debouncedQuery.trim() && !loading && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl shadow-xl px-3 py-2.5 text-sm text-gray-500">
          No videos found
        </div>
      )}
    </div>
  );
}

export default function CopyrightClaimPage() {
  const [activeTab, setActiveTab] = useState("submit");
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [errors, setErrors] = useState([]);

  const [searchParams] = useSearchParams();
  const preloadedVideoId = searchParams.get("videoId") || "";
  const preloadedTitle = searchParams.get("title") || "";

  const [form, setForm] = useState({
    claimantName: "",
    claimantEmail: "",
    claimantPhone: "",
    claimantOrganization: "",
    videoId: preloadedVideoId,
    claimType: "takedown",
    claimDescription: "",
    originalWork: "",
    originalWorkUrl: "",
  });

  const [selectedOriginalWork, setSelectedOriginalWork] = useState(null);

  // Lookup state
  const [lookupRef, setLookupRef] = useState("");
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors([]);
  };

  const validate = () => {
    const errs = [];
    if (!form.claimantName.trim()) errs.push("Your full name is required");
    if (
      !form.claimantEmail.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.claimantEmail.trim())
    ) {
      errs.push("A valid email address is required");
    }
    if (!form.videoId.trim())
      errs.push("The Video ID of the infringing content is required");
    if (!form.claimDescription.trim())
      errs.push("A description of the copyright violation is required");
    if (!form.originalWork.trim())
      errs.push("Title of your original work is required");
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
    setSubmitResult(null);
    try {
      const res = await fetch(`${API_ORIGIN}/api/copyright/claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(localStorage.getItem("token")
            ? { Authorization: `Bearer ${localStorage.getItem("token")}` }
            : {}),
        },
        body: JSON.stringify({
          claimantName: form.claimantName.trim(),
          claimantEmail: form.claimantEmail.trim(),
          claimantPhone: form.claimantPhone.trim(),
          claimantOrganization: form.claimantOrganization.trim(),
          videoId: form.videoId.trim(),
          claimType: form.claimType,
          claimDescription: form.claimDescription.trim(),
          originalWork: form.originalWork.trim(),
          originalWorkUrl: form.originalWorkUrl.trim(),
          declaration: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitResult(data.data);
        setSelectedOriginalWork(null);
        setForm({
          claimantName: "",
          claimantEmail: "",
          claimantPhone: "",
          claimantOrganization: "",
          videoId: "",
          claimType: "takedown",
          claimDescription: "",
          originalWork: "",
          originalWorkUrl: "",
        });
      } else {
        setErrors([data.message || "Failed to submit claim"]);
      }
    } catch (err) {
      console.error("Claim submission error:", err);
      setErrors(["An error occurred. Please try again."]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!lookupRef.trim()) return;

    setLookupLoading(true);
    setLookupError(null);
    setLookupResult(null);
    try {
      const res = await fetch(
        `${API_ORIGIN}/api/copyright/claim/${encodeURIComponent(lookupRef.trim())}`,
      );
      const data = await res.json();
      if (data.success) {
        setLookupResult(data.data);
      } else {
        setLookupError(data.message || "Claim not found");
      }
    } catch (err) {
      console.error("Lookup error:", err);
      setLookupError("Failed to look up claim status");
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-4">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-medium text-indigo-400">
              Copyright Protection
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Copyright Claim Center
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Report a video that uses your copyrighted work without permission,
            or check the status of a claim you've already submitted.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <button
            onClick={() => setActiveTab("submit")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeTab === "submit"
                ? "bg-indigo-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700"
            }`}
          >
            <Send className="w-4 h-4" />
            Submit a Claim
          </button>
          <button
            onClick={() => setActiveTab("lookup")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeTab === "lookup"
                ? "bg-indigo-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700"
            }`}
          >
            <Search className="w-4 h-4" />
            Check Status
          </button>
        </div>

        {/* ===== SUBMIT TAB ===== */}
        {activeTab === "submit" && (
          <>
            {/* Success */}
            {submitResult && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 mb-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-emerald-500/20 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-emerald-400">
                      Claim Submitted Successfully
                    </h3>
                    <p className="text-gray-300 mt-1">
                      Your copyright claim has been filed. Save your reference
                      number to check the status later.
                    </p>
                    <div className="mt-4 p-4 bg-gray-800/50 rounded-xl">
                      <p className="text-sm text-gray-400">
                        Your Reference Number
                      </p>
                      <p className="text-xl font-bold text-white font-mono mt-1">
                        {submitResult.caseNumber || submitResult.reference}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500 mt-3">
                      Our team will review your claim. You can use the "Check
                      Status" tab to monitor progress.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Errors */}
            {errors.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <ul className="space-y-1">
                      {errors.map((err, i) => (
                        <li key={i} className="text-sm text-red-300">
                          {err}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Claimant Info */}
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Your Information
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Tell us who is submitting this claim.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="claimantName"
                      value={form.claimantName}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="claimantEmail"
                      value={form.claimantEmail}
                      onChange={handleChange}
                      placeholder="Enter your email address"
                      className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">
                      Phone (optional)
                    </label>
                    <input
                      type="tel"
                      name="claimantPhone"
                      value={form.claimantPhone}
                      onChange={handleChange}
                      placeholder="Enter your phone number"
                      className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">
                      Organization (optional)
                    </label>
                    <input
                      type="text"
                      name="claimantOrganization"
                      value={form.claimantOrganization}
                      onChange={handleChange}
                      placeholder="Company, creator name, or organization"
                      className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Content You Want to Report */}
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Content You Want to Report
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Tell us which video uses your copyrighted work.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">
                      Video to Report *
                    </label>
                    {preloadedVideoId ? (
                      <div className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-sm flex items-center gap-3">
                        <Film size={16} className="text-indigo-400 shrink-0" />
                        <span className="text-white truncate">
                          {preloadedTitle || "Unknown Video"}
                        </span>
                      </div>
                    ) : (
                      <>
                        <input
                          type="text"
                          name="videoId"
                          value={form.videoId}
                          onChange={handleChange}
                          placeholder="Paste the Video ID from the URL"
                          className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                        <p className="text-xs text-gray-600 mt-1">
                          Find it in the video URL: /video/
                          <span className="text-gray-500">VIDEO_ID</span>
                        </p>
                      </>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">
                      What would you like to report?
                    </label>
                    <select
                      name="claimType"
                      value={form.claimType}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                      
                    >
                      {claimTypes.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700
                rounded-xl text-white text-sm focus:outline-none
                focus:border-indigo-500 transition-colors"
                <label className="block text-sm text-gray-400 mb-1.5">
                  Tell us what happened *
                </label>
                <textarea
                  name="claimDescription"
                  value={form.claimDescription}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Explain how your copyrighted work was used without your permission. Include any details that can help us review your claim."
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                />
              </div>

              {/* Original Work - Free text + optional search */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">
                    Title of Your Original Work *
                  </label>
                  <input
                    type="text"
                    name="originalWork"
                    value={form.originalWork}
                    onChange={handleChange}
                    placeholder="Enter the title of your original copyrighted work"
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <VideoSearchSelect
                      label="Or search your videos to auto-fill (optional)"
                      placeholder="Search your videos by title..."
                      selectedVideo={selectedOriginalWork}
                      onSelect={(video) => {
                        setSelectedOriginalWork(video);
                        setForm((prev) => ({
                          ...prev,
                          originalWork: video.title || "",
                          originalWorkUrl: video.videoUrl || "",
                        }));
                      }}
                      onClear={() => {
                        setSelectedOriginalWork(null);
                        // Do not clear originalWork / originalWorkUrl so user can keep typed values
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">
                      Link to Your Original Work (optional)
                    </label>
                    <input
                      type="url"
                      name="originalWorkUrl"
                      value={form.originalWorkUrl}
                      onChange={handleChange}
                      placeholder="https://... (auto-filled if you select a video)"
                      className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Declaration */}
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-zinc-500 mt-0.5 shrink-0" />
                  <div className="space-y-2">
                    <p className="text-sm text-zinc-300">
                      I confirm that I am the copyright owner or authorized to
                      submit this claim. I confirm that the information I
                      provided is accurate and complete.
                    </p>
                    <p className="text-xs text-zinc-500">
                      I understand that submitting a false copyright claim may
                      have legal consequences.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {submitting ? "Submitting..." : "Submit Claim"}
                </button>
              </div>
            </form>
          </>
        )}

        {/* ===== LOOKUP TAB ===== */}
        {activeTab === "lookup" && (
          <div className="space-y-6">
            <form onSubmit={handleLookup} className="flex gap-3">
              <input
                value={lookupRef}
                onChange={(e) => setLookupRef(e.target.value)}
                placeholder="Enter your reference number (e.g. PUB-260101-0001)"
                className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                type="submit"
                disabled={lookupLoading || !lookupRef.trim()}
                className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {lookupLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                {lookupLoading ? "Searching..." : "Lookup"}
              </button>
            </form>

            {lookupError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                <p className="text-sm text-red-300">{lookupError}</p>
              </div>
            )}

            {lookupResult && (
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    Claim Status
                  </h3>
                  <span
                    className={`text-sm font-medium ${
                      statusColors[lookupResult.status] || "text-gray-400"
                    }`}
                  >
                    {statusLabels[lookupResult.status] ||
                      lookupResult.status?.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Reference Number</p>
                    <p className="text-white font-mono mt-0.5">
                      {lookupResult.caseNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Filed On</p>
                    <p className="text-white mt-0.5">
                      {lookupResult.filedAt
                        ? new Date(lookupResult.filedAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            },
                          )
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Claim Type</p>
                    <p className="text-white mt-0.5 capitalize">
                      {lookupResult.claimType?.replace(/_/g, " ") || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Source</p>
                    <p className="text-white mt-0.5 capitalize">
                      {lookupResult.source === "public_submission"
                        ? "Public Submission"
                        : "Admin Created"}
                    </p>
                  </div>
                </div>

                {lookupResult.claimDescription && (
                  <div>
                    <p className="text-gray-500 text-sm">Description</p>
                    <p className="text-gray-300 text-sm mt-1">
                      {lookupResult.claimDescription}
                    </p>
                  </div>
                )}

                {lookupResult.resolution && (
                  <div className="p-4 bg-gray-800/50 rounded-xl">
                    <p className="text-gray-500 text-sm">Resolution</p>
                    <p className="text-white text-sm mt-1 font-medium">
                      {lookupResult.resolution.decision?.replace(/_/g, " ")}
                    </p>
                    {lookupResult.resolution.reason && (
                      <p className="text-gray-400 text-sm mt-1">
                        {lookupResult.resolution.reason}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {!lookupResult && !lookupError && !lookupLoading && (
              <div className="text-center py-16">
                <Search className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500">
                  Enter your reference number to check claim status
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
