import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Send,
  Shield,
  Search,
  CheckCircle,
  AlertTriangle,
  FileText,
  Film,
  X,
  Clock,
  RefreshCw,
  ExternalLink,
  Copyright,
  UserRound,
  Play,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { API_ORIGIN } from "../config/api";
import { resolveMediaUrl } from "../utils/mediaUrl";

const MY_CLAIMS_PER_PAGE = 5;

const claimTypes = [
  { value: "takedown", label: "Takedown Request" },
  { value: "infringement", label: "Infringement Notice" },
];

const statusColors = {
  pending: "text-yellow-400",
  under_review: "text-blue-400",
  more_information_required: "text-orange-400",
  action_pending: "text-orange-400",
  takedown_approved: "text-red-400",
  takedown_rejected: "text-gray-400",
  disputed: "text-purple-400",
  dispute_under_review: "text-blue-400",
  dispute_upheld: "text-red-400",
  dispute_overturned: "text-emerald-400",
  resolved: "text-emerald-400",
  withdrawn: "text-gray-400",
};

const statusLabels = {
  pending: "Pending Review",
  under_review: "Under Review",
  more_information_required: "More Information Required",
  action_pending: "Action Pending",
  takedown_approved: "Takedown Approved",
  takedown_rejected: "Takedown Rejected",
  disputed: "Disputed",
  dispute_under_review: "Dispute Under Review",
  dispute_upheld: "Dispute Upheld",
  dispute_overturned: "Dispute Overturned",
  resolved: "Resolved",
  withdrawn: "Withdrawn",
};

function getVideoId(value) {
  const input = value.trim();
  if (/^[0-9a-fA-F]{24}$/.test(input)) return input;

  try {
    const url = new URL(input, window.location.origin);
    const queryId = url.searchParams.get("videoId");
    const pathId = url.pathname.match(
      /(?:^|\/)(?:video|watch)\/([0-9a-fA-F]{24})(?:\/|$)/i,
    )?.[1];
    const videoId = queryId || pathId;
    return videoId && /^[0-9a-fA-F]{24}$/.test(videoId) ? videoId : "";
  } catch {
    return "";
  }
}

function isSafeExternalUrl(value) {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

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
  const [searchError, setSearchError] = useState(null);
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
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to search videos");
    }
    return data.data || [];
  }, []);

  useEffect(() => {
    if (!debouncedQuery.trim()) return;
    let cancelled = false;
    searchMyVideos(debouncedQuery)
      .then((items) => {
        if (!cancelled) setResults(items);
      }).catch((error) => {
        if (!cancelled) {
          setResults([]);
          setSearchError(error.message || "Failed to search videos");
        }
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
    setLoading(false);
    setSearchError(null);
    setOpen(false);
    setHighlight(-1);
  };

  const handleClear = () => {
    onClear();
    setQuery("");
    setResults([]);
    setLoading(false);
    setSearchError(null);
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
              const value = e.target.value;
              setQuery(value);
              setResults([]);
              setLoading(Boolean(value.trim()));
              setSearchError(null);
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
      {open && query.trim() === debouncedQuery.trim() && results.length > 0 && (
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
      {open &&
        query.trim() === debouncedQuery.trim() &&
        debouncedQuery.trim() &&
        !loading &&
        results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl shadow-xl px-3 py-2.5 text-sm text-gray-500">
          {searchError || "No videos found"}
        </div>
      )}
    </div>
  );
}

export default function CopyrightClaimPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const lookupReferenceFromUrl = searchParams.get("reference") || "";
  const autoLookupReference = useRef("");
  const [activeTab, setActiveTab] = useState(
    lookupReferenceFromUrl ? "lookup" : "submit",
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [errors, setErrors] = useState([]);

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
    originalWorkVideoId: "",
  });

  const [selectedOriginalWork, setSelectedOriginalWork] = useState(null);
  const [declarationAccepted, setDeclarationAccepted] = useState(false);

  // Lookup state
  const [lookupRef, setLookupRef] = useState(lookupReferenceFromUrl);
  const [lookupResult, setLookupResult] = useState(null);
  const [showLookupDetails, setShowLookupDetails] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState(null);
  const [myClaims, setMyClaims] = useState([]);
  const [myClaimsPage, setMyClaimsPage] = useState(1);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [claimsError, setClaimsError] = useState(null);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [selectedClaimLoading, setSelectedClaimLoading] = useState(false);
  const [selectedClaimError, setSelectedClaimError] = useState(null);

  const fetchMyClaims = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMyClaims([]);
      setClaimsError(null);
      return;
    }

    setClaimsLoading(true);
    setClaimsError(null);
    try {
      const res = await fetch(`${API_ORIGIN}/api/copyright/my-claims`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load your claims");
      }
      const claims = Array.isArray(data.data) ? data.data : [];
      setMyClaims(claims);
      setMyClaimsPage(1);
      setSelectedClaim((current) =>
        current
          ? claims.find((claim) => claim.caseNumber === current.caseNumber) ||
            current
          : null,
      );
    } catch (err) {
      console.error("Failed to fetch copyright claims:", err);
      setClaimsError(err.message || "Failed to load your claims");
    } finally {
      setClaimsLoading(false);
    }
  }, []);

  const myClaimsPageCount = Math.ceil(
    myClaims.length / MY_CLAIMS_PER_PAGE,
  );
  const visibleMyClaims = myClaims.slice(
    (myClaimsPage - 1) * MY_CLAIMS_PER_PAGE,
    myClaimsPage * MY_CLAIMS_PER_PAGE,
  );

  useEffect(() => {
    const timer = window.setTimeout(fetchMyClaims, 0);
    return () => window.clearTimeout(timer);
  }, [fetchMyClaims]);

  const handleSelectClaim = async (claim) => {
    setSelectedClaim(claim);
    setSelectedClaimError(null);
    if (!claim.caseNumber) return;

    setSelectedClaimLoading(true);
    try {
      const res = await fetch(
        `${API_ORIGIN}/api/copyright/claim/${encodeURIComponent(claim.caseNumber)}`,
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch claim details");
      }
      setSelectedClaim((current) =>
        current?.caseNumber === claim.caseNumber
          ? {
              ...claim,
              ...data.data,
              createdAt: data.data.filedAt || claim.createdAt,
            }
          : current,
      );
    } catch (err) {
      console.error("Failed to fetch selected claim details:", err);
      setSelectedClaimError(err.message || "Failed to fetch claim details");
    } finally {
      setSelectedClaimLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "originalWork" || name === "originalWorkUrl"
        ? { originalWorkVideoId: "" }
        : {}),
    }));
    if (name === "originalWork" || name === "originalWorkUrl") {
      setSelectedOriginalWork(null);
    }
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
    const videoId = getVideoId(form.videoId);
    if (!form.videoId.trim())
      errs.push("The Video ID of the infringing content is required");
    else if (!videoId)
      errs.push("Enter a valid Video ID or a video link containing a valid ID");
    if (!form.claimDescription.trim())
      errs.push("A description of the copyright violation is required");
    if (!form.originalWork.trim())
      errs.push("Title of your original work is required");
    if (!declarationAccepted)
      errs.push("You must confirm the copyright declaration");
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
          videoId: getVideoId(form.videoId),
          claimType: form.claimType,
          claimDescription: form.claimDescription.trim(),
          originalWork: form.originalWork.trim(),
          originalWorkUrl: form.originalWorkUrl.trim(),
          originalWorkVideoId: form.originalWorkVideoId || undefined,
          declaration: declarationAccepted,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrors([data.message || "Failed to submit claim"]);
        return;
      }

      setSubmitResult(data.data);
      setSelectedClaim(data.data);
      setSelectedOriginalWork(null);
      setDeclarationAccepted(false);
      setForm({
        claimantName: "",
        claimantEmail: "",
        claimantPhone: "",
        claimantOrganization: "",
        videoId: preloadedVideoId,
        claimType: "takedown",
        claimDescription: "",
        originalWork: "",
        originalWorkUrl: "",
        originalWorkVideoId: "",
      });
      await fetchMyClaims();
    } catch (err) {
      console.error("Claim submission error:", err);
      setErrors(["An error occurred. Please try again."]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLookup = useCallback(async (
    e,
    reference = lookupRef,
    expandDetails = true,
  ) => {
    e?.preventDefault();
    const normalizedReference = reference.trim();
    if (!normalizedReference) return;

    setLookupLoading(true);
    setLookupError(null);
    setLookupResult(null);
    setShowLookupDetails(false);
    try {
      const res = await fetch(
        `${API_ORIGIN}/api/copyright/claim/${encodeURIComponent(normalizedReference)}`,
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setLookupResult(data.data);
        setShowLookupDetails(expandDetails);
      } else {
        setLookupError(data.message || "Claim not found");
      }
    } catch (err) {
      console.error("Lookup error:", err);
      setLookupError("Failed to look up claim status");
    } finally {
      setLookupLoading(false);
    }
  }, [lookupRef]);

  const handleChooseMyClaim = (claim) => {
    setLookupRef(claim.caseNumber);
    setLookupResult(null);
    setLookupError(null);
    setShowLookupDetails(false);
    setActiveTab("lookup");
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);
      nextParams.set("reference", claim.caseNumber);
      return nextParams;
    });
  };

  useEffect(() => {
    if (!lookupReferenceFromUrl) {
      autoLookupReference.current = "";
      return;
    }
    if (autoLookupReference.current === lookupReferenceFromUrl) return;

    autoLookupReference.current = lookupReferenceFromUrl;
    setActiveTab("lookup");
    setLookupRef(lookupReferenceFromUrl);
    handleLookup(null, lookupReferenceFromUrl, true);
  }, [handleLookup, lookupReferenceFromUrl]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
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
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
              <div className="min-w-0 space-y-6">
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
                          placeholder="Paste a Video ID or video link"
                          className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                        <p className="text-xs text-gray-600 mt-1">
                          Use a 24-character video ID or a /video/ or /watch/
                          link.
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
                          originalWorkVideoId: video._id || "",
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
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={declarationAccepted}
                    onChange={(e) => {
                      setDeclarationAccepted(e.target.checked);
                      setErrors([]);
                    }}
                    className="mt-1 h-4 w-4 shrink-0 accent-indigo-500"
                  />
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
                </label>
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
              </div>

              <aside className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 lg:sticky lg:top-6">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      My Claims
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {
                        myClaims.filter((claim) => claim.status === "pending")
                          .length
                      }{" "}
                      pending review
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={fetchMyClaims}
                    disabled={claimsLoading || !localStorage.getItem("token")}
                    aria-label="Refresh claims"
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-zinc-800 disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${
                        claimsLoading ? "animate-spin" : ""
                      }`}
                    />
                  </button>
                </div>

                {!localStorage.getItem("token") ? (
                  <p className="text-sm text-gray-500">
                    Sign in to see your submitted claims here.
                  </p>
                ) : claimsLoading && myClaims.length === 0 ? (
                  <p className="text-sm text-gray-500">Loading your claims...</p>
                ) : claimsError ? (
                  <div className="space-y-3">
                    <p className="text-sm text-red-300">{claimsError}</p>
                    <button
                      type="button"
                      onClick={fetchMyClaims}
                      className="text-sm text-indigo-400 hover:text-indigo-300"
                    >
                      Try again
                    </button>
                  </div>
                ) : myClaims.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Your submitted claims will appear here.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
                    {visibleMyClaims.map((claim) => (
                      <button
                        key={claim._id || claim.caseNumber}
                        type="button"
                        onClick={() => handleSelectClaim(claim)}
                        className={`w-full text-left p-3 rounded-xl border transition-colors ${
                          selectedClaim?.caseNumber === claim.caseNumber
                            ? "bg-indigo-500/10 border-indigo-500/40"
                            : "bg-zinc-800/60 border-zinc-800 hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-xs font-medium ${
                              statusColors[claim.status] || "text-gray-400"
                            }`}
                          >
                            {statusLabels[claim.status] ||
                              claim.status?.replace(/_/g, " ")}
                          </span>
                          {claim.status === "pending" && (
                            <Clock className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-white truncate mt-2">
                          {claim.content?.title ||
                            claim.claim?.originalWork ||
                            "Copyright claim"}
                        </p>
                        <p className="text-xs text-gray-500 font-mono mt-1">
                          {claim.caseNumber}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Filed{" "}
                          {claim.createdAt
                            ? new Date(claim.createdAt).toLocaleString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                },
                              )
                            : "-"}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {myClaims.length > MY_CLAIMS_PER_PAGE && (
                  <div className="flex items-center justify-between gap-2 mt-3">
                    <span className="text-xs text-gray-500">
                      Page {myClaimsPage} of {myClaimsPageCount}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setMyClaimsPage((page) => Math.max(1, page - 1))
                        }
                        disabled={myClaimsPage === 1}
                        aria-label="Previous claims page"
                        className="p-2 rounded-lg border border-zinc-700 text-gray-300 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setMyClaimsPage((page) =>
                            Math.min(myClaimsPageCount, page + 1),
                          )
                        }
                        disabled={myClaimsPage === myClaimsPageCount}
                        aria-label="Next claims page"
                        className="p-2 rounded-lg border border-zinc-700 text-gray-300 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {selectedClaim && (
                  <div className="mt-5 pt-5 border-t border-zinc-800 space-y-3">
                    {selectedClaimError && (
                      <p role="alert" className="text-sm text-red-300">
                        {selectedClaimError}
                      </p>
                    )}
                    <div>
                      <p className="text-xs text-gray-500">
                        {selectedClaimLoading ? "Refreshing status..." : "Current status"}
                      </p>
                      <p
                        className={`text-sm font-semibold mt-1 ${
                          statusColors[selectedClaim.status] || "text-gray-300"
                        }`}
                      >
                        {statusLabels[selectedClaim.status] ||
                          selectedClaim.status?.replace(/_/g, " ") ||
                          "Submitted"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Reference number</p>
                      <p className="text-sm text-white font-mono mt-1">
                        {selectedClaim.caseNumber || selectedClaim.reference}
                      </p>
                    </div>
                    {selectedClaim.createdAt && (
                      <div>
                        <p className="text-xs text-gray-500">Filed on</p>
                        <p className="text-sm text-white mt-1">
                          {new Date(selectedClaim.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {selectedClaim.resolution?.reason && (
                      <div>
                        <p className="text-xs text-gray-500">Resolution</p>
                        <p className="text-sm text-gray-300 mt-1">
                          {selectedClaim.resolution.reason}
                        </p>
                      </div>
                    )}
                    {selectedClaim.caseNumber && (
                      <Link
                        to={`/copyright/claim?reference=${encodeURIComponent(selectedClaim.caseNumber)}`}
                        className="inline-flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300"
                      >
                        View full details
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                )}
              </aside>
            </div>

          </>
        )}

        {/* ===== LOOKUP TAB ===== */}
        {activeTab === "lookup" && (
          <div className="space-y-6">
            <form onSubmit={handleLookup} className="flex gap-3">
              <input
                value={lookupRef}
                onChange={(e) => {
                  setLookupRef(e.target.value);
                  setLookupResult(null);
                  setShowLookupDetails(false);
                  setLookupError(null);
                }}
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

            {myClaims.length > 0 && (
              <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Your claims
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Select a claim to open its full details.
                  </p>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {myClaims.map((claim) => (
                    <button
                      key={claim._id || claim.caseNumber}
                      type="button"
                      onClick={() => handleChooseMyClaim(claim)}
                      disabled={lookupLoading}
                      className={`min-w-48 rounded-xl border px-3 py-2 text-left transition-colors disabled:opacity-50 ${
                        lookupRef === claim.caseNumber
                          ? "border-indigo-500/50 bg-indigo-500/10"
                          : "border-zinc-800 bg-zinc-800/60 hover:border-zinc-700"
                      }`}
                    >
                      <span
                        className={`block text-xs font-medium ${
                          statusColors[claim.status] || "text-gray-400"
                        }`}
                      >
                        {statusLabels[claim.status] ||
                          claim.status?.replace(/_/g, " ")}
                      </span>
                      <span className="block text-xs text-white font-mono mt-1">
                        {claim.caseNumber}
                      </span>
                      <span className="block text-xs text-gray-500 mt-1 truncate">
                        {claim.content?.title ||
                          claim.claim?.originalWork ||
                          "Copyright claim"}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {lookupError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                <p className="text-sm text-red-300">{lookupError}</p>
              </div>
            )}

            {lookupResult && (
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-mono text-gray-300">
                      {lookupResult.caseNumber}
                    </p>
                    <span
                      className={`text-sm font-medium ${
                        statusColors[lookupResult.status] || "text-gray-400"
                      }`}
                    >
                      {statusLabels[lookupResult.status] ||
                        lookupResult.status?.replace(/_/g, " ")}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setShowLookupDetails((visible) => !visible)
                    }
                    aria-expanded={showLookupDetails}
                    className="px-3 py-2 text-sm font-medium text-indigo-300 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/10 transition-colors"
                  >
                    {showLookupDetails ? "Hide details" : "View full details"}
                  </button>
                </div>

                {showLookupDetails && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-white">
                      Copyright Claim Details
                    </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <section className="rounded-xl border border-zinc-800 bg-zinc-800/40 p-4 space-y-3">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-white">
                      <Film className="w-4 h-4 text-indigo-400" />
                      Reported Video
                    </h4>
                    {lookupResult.reportedVideo?.id && (
                      <Link
                        to={`/video/${lookupResult.reportedVideo.id}`}
                        aria-label={`Watch ${lookupResult.reportedVideo.title || "reported video"}`}
                        className="group relative block overflow-hidden rounded-lg bg-zinc-950"
                      >
                        {lookupResult.reportedVideo.thumbnail ? (
                          <img
                            src={resolveMediaUrl(lookupResult.reportedVideo.thumbnail)}
                            alt={`${lookupResult.reportedVideo.title || "Reported video"} thumbnail`}
                            className="w-full aspect-video object-cover transition-transform group-hover:scale-[1.02]"
                          />
                        ) : (
                          <div className="flex w-full aspect-video items-center justify-center text-gray-500">
                            <Film className="w-10 h-10" />
                          </div>
                        )}
                        <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/40">
                          <span className="rounded-full bg-black/60 p-3 text-white">
                            <Play className="w-6 h-6 fill-current" />
                          </span>
                        </span>
                      </Link>
                    )}
                    <p className="font-medium text-gray-100">
                      {lookupResult.reportedVideo?.title || "Video details unavailable"}
                    </p>
                    {lookupResult.reportedVideo?.channel && (
                      <p className="text-sm text-gray-400">
                        Channel: {lookupResult.reportedVideo.channel}
                      </p>
                    )}
                    {lookupResult.reportedVideo?.description && (
                      <p className="text-sm text-gray-300 whitespace-pre-wrap">
                        {lookupResult.reportedVideo.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      {lookupResult.reportedVideo?.id && (
                        <Link
                          to={`/video/${lookupResult.reportedVideo.id}`}
                          className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300"
                        >
                          Open video <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      )}
                      {lookupResult.reportedVideo?.uploadedAt && (
                        <span className="text-gray-500">
                          Uploaded{" "}
                          {new Date(
                            lookupResult.reportedVideo.uploadedAt,
                          ).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </section>

                  <section className="rounded-xl border border-zinc-800 bg-zinc-800/40 p-4 space-y-3">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-white">
                      <Copyright className="w-4 h-4 text-indigo-400" />
                      Copyright Owner & Original Work
                    </h4>
                    {lookupResult.claimant?.name && (
                      <div className="flex items-start gap-2">
                        <UserRound className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-gray-100">
                            {lookupResult.claimant.name}
                          </p>
                          {lookupResult.claimant.organization && (
                            <p className="text-sm text-gray-400">
                              {lookupResult.claimant.organization}
                            </p>
                          )}
                          {lookupResult.claimant.relationship && (
                            <p className="text-xs text-gray-500 mt-1 capitalize">
                              {lookupResult.claimant.relationship.replace(/_/g, " ")}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-500">Original work</p>
                      <p className="text-gray-100 mt-1">
                        {lookupResult.originalWork?.title || "Not provided"}
                      </p>
                      {lookupResult.originalWork?.thumbnail &&
                        (lookupResult.originalWork?.videoId ? (
                          <Link
                            to={`/video/${lookupResult.originalWork.videoId}`}
                            aria-label={`Watch ${lookupResult.originalWork.title || "original work"}`}
                            className="group relative mt-3 block overflow-hidden rounded-lg bg-zinc-950"
                          >
                            <img
                              src={resolveMediaUrl(lookupResult.originalWork.thumbnail)}
                              alt={`${lookupResult.originalWork.title || "Original work"} thumbnail`}
                              className="w-full aspect-video object-cover transition-transform group-hover:scale-[1.02]"
                            />
                            <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/40">
                              <span className="rounded-full bg-black/60 p-3 text-white">
                                <Play className="w-6 h-6 fill-current" />
                              </span>
                            </span>
                          </Link>
                        ) : (
                          <a
                            href={lookupResult.originalWork.url}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Watch ${lookupResult.originalWork.title || "original work"}`}
                            className="group relative mt-3 block overflow-hidden rounded-lg bg-zinc-950"
                          >
                            <img
                              src={resolveMediaUrl(lookupResult.originalWork.thumbnail)}
                              alt={`${lookupResult.originalWork.title || "Original work"} thumbnail`}
                              className="w-full aspect-video object-cover transition-transform group-hover:scale-[1.02]"
                            />
                            <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/40">
                              <span className="rounded-full bg-black/60 p-3 text-white">
                                <Play className="w-6 h-6 fill-current" />
                              </span>
                            </span>
                          </a>
                        ))}
                      {isSafeExternalUrl(lookupResult.originalWork?.url) && (
                        lookupResult.originalWork?.videoId ? (
                          <Link
                            to={`/video/${lookupResult.originalWork.videoId}`}
                            className="inline-flex items-center gap-1.5 mt-2 text-sm text-indigo-400 hover:text-indigo-300 break-all"
                          >
                            Watch original work <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          </Link>
                        ) : (
                          <a
                            href={lookupResult.originalWork.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 mt-2 text-sm text-indigo-400 hover:text-indigo-300 break-all"
                          >
                            Watch original work <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          </a>
                        )
                      )}
                    </div>
                  </section>
                </div>

                {lookupResult.claimDescription && (
                  <div>
                    <p className="text-gray-500 text-sm">Claim Details</p>
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
