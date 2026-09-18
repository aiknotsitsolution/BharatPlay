import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  Search,
  Mic,
  MicOff,
  Plus,
  Bell,
  Star,
  User,
  Settings,
  LogOut,
  Wallet,
  History,
  Heart,
  Clock,
  Video,
  ChevronRight,
  ChevronDown,
  HelpCircle,
  FileText,
  MessageCircle,
  PhoneCall,
  ArrowLeft,
  X,
  Shield,
} from "lucide-react";
import { useRewards } from "../../context/RewardContext";
import { useSelector, useDispatch } from "react-redux";
import NotificationPanel from "./NotificationPanel";
import {
  fetchNotifications,
  resetNotifications,
} from "../../features/notifications/notificationsSlice";
import { fetchProfileData } from "../../features/profile/profileSlice";
import axios from "axios";
import { API_ORIGIN as API_BASE_URL } from "../../config/api";
import logo from "../../../public/Bharatplay-Cb3qGLyP-Cb3qGLyP-DSDLqCtA.png";

const HINTS_URL = `${API_BASE_URL}/api/uservideo/search/hints`;

export default function Navbar({ toggleSidebar }) {
  const { points } = useRewards();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const profileUser = useSelector((state) => state.profile?.user);
  const unreadCount = useSelector((state) => state.notifications.unreadCount);
  const user = profileUser;

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copyrightOpen, setCopyrightOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(localStorage.getItem("token")),
  );
  const [loading, setLoading] = useState(false);

  const trustScore = Math.max(0, Math.min(100, Number(user?.trustScore ?? 50)));
  const trustTier =
    user?.trustTier ||
    (trustScore >= 70 ? "premium" : trustScore >= 40 ? "medium" : "restricted");

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  // Search + Voice
  const [searchQuery, setSearchQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [hints, setHints] = useState([]);
  const [showHints, setShowHints] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const recognitionRef = useRef(null);
  const searchBoxRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const mobileSearchBoxRef = useRef(null);

  const handleSearch = useCallback(
    (query) => {
      const q = (typeof query === "string" ? query : searchQuery).trim();
      if (!q) return;
      setShowHints(false);
      setIsListening(false);
      setIsMobileSearchOpen(false);
      navigate(`/search?q=${encodeURIComponent(q)}`);
    },
    [searchQuery, navigate],
  );

  // Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setSearchQuery(transcript);

      if (event.results[event.results.length - 1].isFinal) {
        const finalQuery = transcript.trim();
        if (finalQuery) {
          setTimeout(() => {
            navigate(`/search?q=${encodeURIComponent(finalQuery)}`);
            setIsListening(false);
            setShowHints(false);
          }, 300);
        }
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted") {
        setIsListening(false);
        return;
      }
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error === "not-allowed") {
        alert("Microphone permission denied. Please allow mic access.");
      }
    };

    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;

    return () => {
      try {
        recognitionRef.current?.abort();
      } catch (_) {}
    };
  }, [navigate]);

  // Hints
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 1) {
      setHints([]);
      setShowHints(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await axios.get(HINTS_URL, {
          params: { q },
          signal: controller.signal,
        });
        const data = res.data?.data || res.data?.hints || res.data || [];
        setHints(Array.isArray(data) ? data : []);
        setShowHints(true);
      } catch (err) {
        if (axios.isCancel(err) || err?.code === "ERR_CANCELED") return;
        console.error("Hints fetch error:", err);
        setHints([]);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  const handleMicClick = () => {
    if (!voiceSupported) {
      alert("Voice search is not supported in this browser. Use Chrome.");
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (_) {}
      setIsListening(false);
    } else {
      setSearchQuery("");
      setHints([]);
      setShowHints(false);
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.error("Mic start error:", err);
      }
    }
  };

  // Outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        setIsSettingsOpen(false);
        setCopyrightOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      const insideSearch =
        (searchBoxRef.current && searchBoxRef.current.contains(event.target)) ||
        (mobileSearchBoxRef.current &&
          mobileSearchBoxRef.current.contains(event.target));
      if (!insideSearch) setShowHints(false);

      if (
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(event.target)
      ) {
        setIsMobileSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!isLoggedIn) return;
      try {
        setLoading(true);
        await dispatch(fetchProfileData());
      } catch (error) {
        console.error("Profile fetch failed:", error);
        if (
          error?.payload?.includes("Session expired") ||
          error?.status === 401
        ) {
          handleSignOut();
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();

    const handleAuthChange = () => {
      const token = localStorage.getItem("token");
      setIsLoggedIn(Boolean(token));
      if (token) fetchProfile();
    };
    window.addEventListener("auth-change", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);
    return () => {
      window.removeEventListener("auth-change", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, [dispatch, isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) dispatch(fetchNotifications());
  }, [isLoggedIn, dispatch]);

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
    setIsSettingsOpen(false);
    setIsNotificationsOpen(false);
    setCopyrightOpen(false);
  };

  const toggleNotifications = () => {
    setIsNotificationsOpen((prev) => !prev);
    setIsDropdownOpen(false);
    setIsSettingsOpen(false);
  };

  const handleSignOut = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await axios
          .post(
            `${API_BASE_URL}/api/logout`,
            {},
            { headers: { Authorization: `Bearer ${token}` } },
          )
          .catch(() => {});
      }
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setIsLoggedIn(false);
      setIsDropdownOpen(false);
      setIsSettingsOpen(false);
      setIsNotificationsOpen(false);
      dispatch(resetNotifications());
      window.dispatchEvent(new Event("auth-change"));
      navigate("/login");
    }
  };

  const onHintClick = (hint) => {
    const text =
      typeof hint === "string" ? hint : hint.text || hint.title || "";
    setSearchQuery(text);
    setShowHints(false);
    setIsMobileSearchOpen(false);
    handleSearch(text);
  };

  const renderHints = () => (
    <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#212121] border border-gray-700/80 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto py-1.5">
      {hints.map((hint, i) => {
        const text =
          typeof hint === "string"
            ? hint
            : hint.text || hint.title || hint.name || "";
        const type = hint.type || "";
        return (
          <button
            key={i}
            onClick={() => onHintClick(hint)}
            className="w-full px-4 py-2.5 text-left hover:bg-[#3a3a3a] flex items-center gap-3 text-white text-sm"
          >
            <Search size={16} className="text-gray-400 flex-shrink-0" />
            <span className="truncate flex-1">{text}</span>
            {type === "channel" && (
              <span className="text-xs text-gray-500">Channel</span>
            )}
            {type === "video" && (
              <span className="text-xs text-gray-500">Video</span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0f0f0f] border-b border-gray-800 h-14 flex items-center">
      <div className="flex items-center justify-between w-full px-3 md:px-4">
        {/* Left */}
        <div className="flex items-center gap-1 md:gap-2">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-[#272727] rounded-full transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu size={22} className="text-white" />
          </button>

          <Link to="/home" className="flex items-center flex-shrink-0 gap-0 ml-1">
            <div className="w-16 h-12 rounded-md overflow-hidden flex items-center justify-center">
              <img
                src={logo}
                alt="BharatPlay"
                className="w-full rounded-2xl h-full object-contain"
              />
            </div>
            <span className="text-xl font-bold tracking-tight text-white dark:text-white">
              BharatPlay
            </span>
          </Link>
          {/* Points (desktop) */}

          {isLoggedIn && (
            <div
              className="hidden lg:flex items-center gap-1.5 bg-[#272727] px-2.5 py-1 rounded-full border border-blue-500/30 ml-1"
              title={`Trust Score: ${trustScore}/100 (${trustTier})`}
            >
              <Shield size={14} className="text-blue-400" />
              <span className="text-white font-semibold text-xs">
                {trustScore}
              </span>
              <span className="text-gray-400 text-[10px]">trust</span>
            </div>
          )}
        </div>

        {/* Center Search (desktop) */}
        <div className="flex-1 max-w-[640px] mx-4 lg:mx-8 hidden md:flex items-center gap-3">
          <div className="relative w-full" ref={searchBoxRef}>
            <input
              type="text"
              placeholder={isListening ? "Listening..." : "Search"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() =>
                searchQuery.trim() && hints.length > 0 && setShowHints(true)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
                if (e.key === "Escape") setShowHints(false);
              }}
              className={`w-full h-10 bg-[#121212] border rounded-full pl-4 pr-12 text-sm text-white placeholder-gray-500 focus:outline-none transition-all
                ${
                  isListening
                    ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    : "border-gray-700 hover:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                }`}
            />
            <button
              onClick={() => handleSearch()}
              className="absolute right-1 top-1 bottom-1 w-10 flex items-center justify-center rounded-full hover:bg-[#272727]"
            >
              <Search size={18} className="text-gray-300" />
            </button>
            {showHints && hints.length > 0 && renderHints()}
          </div>

          <button
            onClick={handleMicClick}
            className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all
              ${isListening ? "bg-red-600 hover:bg-red-700 animate-pulse" : "bg-[#272727] hover:bg-[#3a3a3a]"}`}
            title={isListening ? "Stop listening" : "Search with voice"}
          >
            {isListening ? (
              <MicOff size={20} className="text-white" />
            ) : (
              <Mic size={20} className="text-white" />
            )}
          </button>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Mobile search trigger */}
          <button
            onClick={() => {
              setIsMobileSearchOpen(true);
              setIsDropdownOpen(false);
              setIsNotificationsOpen(false);
            }}
            className="p-2 hover:bg-[#272727] rounded-full md:hidden"
          >
            <Search size={22} className="text-white" />
          </button>

          <div className="hidden sm:flex items-center gap-1.5 bg-[#272727] px-2.5 py-1 rounded-full border border-yellow-600/30 ml-3">
            <Star size={14} className="text-yellow-400 fill-yellow-400" />
            <span className="text-white font-semibold text-xs">
              {points.toFixed(1)}
            </span>
            <span className="text-gray-400 text-[10px]">pts</span>
          </div>
          <Link
            to="/uploadvideo"
            className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-[#272727] rounded-full transition-colors"
          >
            <Plus size={20} className="text-white" strokeWidth={2.5} />
            <span className="text-sm font-medium text-white">Create</span>
          </Link>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={toggleNotifications}
              className="p-2 hover:bg-[#272727] rounded-full relative transition-colors"
            >
              <Bell size={22} className="text-white" />

              {/* YouTube-style unread badge */}
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-[#cc0000] rounded-full text-[10px] font-medium text-white flex items-center justify-center leading-none border border-[#0f0f0f]">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            <NotificationPanel
              isOpen={isNotificationsOpen}
              onClose={() => setIsNotificationsOpen(false)}
            />
          </div>

          {/* Profile */}
          <div className="relative ml-1" ref={dropdownRef}>
            {isLoggedIn ? (
              <button
                onClick={toggleDropdown}
                className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-blue-400 transition-all"
                disabled={loading}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-sm font-semibold">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </span>
                )}
              </button>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="px-3.5 py-1.5 bg-transparent border border-blue-500 text-blue-400 text-sm font-medium rounded-full hover:bg-blue-500/10 transition"
              >
                Sign in
              </button>
            )}

            {/* Profile Dropdown */}
            {isLoggedIn && isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-[300px] max-h-[calc(100dvh-5rem)] overflow-y-auto bg-[#0f0f0f] border border-gray-700 rounded-xl shadow-2xl z-50">
                {/* Header */}
                <div className="px-4 py-4 border-b border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 overflow-hidden flex-shrink-0">
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                          {user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">
                        {user?.name || "User"}
                      </p>
                      <p className="text-sm text-gray-400 truncate">
                        {user?.email || ""}
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-yellow-400">
                        <Star size={12} className="fill-yellow-400" />
                        <span>{points.toFixed(0)} pts</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-blue-300">
                        <Shield size={12} />
                        <span>Trust Score: {trustScore}/100</span>
                        <span className="capitalize text-gray-400">
                          ({trustTier})
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      navigate(`/channel/${user?._id || "me"}`);
                      setIsDropdownOpen(false);
                    }}
                    className="mt-3 w-full py-2 bg-[#272727] hover:bg-[#3a3a3a] rounded-lg text-sm font-medium"
                  >
                    View your channel
                  </button>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      navigate("/profile");
                      setIsDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-[#272727] flex items-center gap-4 text-sm"
                  >
                    <User size={20} className="text-gray-300" /> My Profile
                  </button>
                  <button
                    onClick={() => {
                      navigate("/studio");
                      setIsDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-[#272727] flex items-center gap-4 text-sm"
                  >
                    <Video size={20} className="text-gray-300" /> Bharat Play
                    Studio
                  </button>

                  {/* Settings sub */}
                  <div>
                    <button
                      onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                      className="w-full px-4 py-2.5 text-left hover:bg-[#272727] flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-4">
                        <Settings size={20} className="text-gray-300" />{" "}
                        Settings
                      </div>
                      {isSettingsOpen ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </button>
                    {isSettingsOpen && (
                      <div className="bg-[#1a1a1a] py-1">
                        {[
                          { path: "/history", icon: History, label: "History" },
                          {
                            path: "/liked-videos",
                            icon: Heart,
                            label: "Liked Videos",
                          },
                          {
                            path: "/watch-later",
                            icon: Clock,
                            label: "Watch Later",
                          },
                          {
                            path: "/your-videos",
                            icon: Video,
                            label: "Your Videos",
                          },
                        ].map((item) => (
                          <button
                            key={item.path}
                            onClick={() => {
                              navigate(item.path);
                              setIsDropdownOpen(false);
                              setIsSettingsOpen(false);
                            }}
                            className="w-full pl-12 pr-4 py-2 text-left hover:bg-[#272727] flex items-center gap-3 text-sm"
                          >
                            <item.icon size={16} /> {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <Link
                    to="/withdraw"
                    onClick={() => setIsDropdownOpen(false)}
                    className="w-full px-4 py-2.5 text-left hover:bg-[#272727] flex items-center gap-4 text-sm border-t border-gray-800"
                  >
                    <Wallet size={20} className="text-gray-300" /> Withdraw
                    Rewards
                  </Link>
                  <Link
                    to="/leaderboard"
                    onClick={() => setIsDropdownOpen(false)}
                    className="w-full px-4 py-2.5 text-left hover:bg-[#272727] flex items-center gap-4 text-sm"
                  >
                    <Star size={20} className="text-gray-300" /> Leaderboard
                  </Link>
                </div>

                <div className="py-1 border-t border-gray-800">
                  <Link
                    to="/faq"
                    onClick={() => setIsDropdownOpen(false)}
                    className="w-full px-4 py-2.5 text-left hover:bg-[#272727] flex items-center gap-4 text-sm"
                  >
                    <HelpCircle size={20} className="text-gray-300" /> FAQ
                  </Link>
                  <Link
                    to="/feedback"
                    onClick={() => setIsDropdownOpen(false)}
                    className="w-full px-4 py-2.5 text-left hover:bg-[#272727] flex items-center gap-4 text-sm"
                  >
                    <MessageCircle size={20} className="text-gray-300" />{" "}
                    Feedback
                  </Link>

                  {/* Copyright */}
                  <div>
                    <button
                      onClick={() => setCopyrightOpen(!copyrightOpen)}
                      className="w-full px-4 py-2.5 text-left hover:bg-[#272727] flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-4">
                        <Shield size={20} className="text-gray-300" /> Copyright
                      </div>
                      {copyrightOpen ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </button>
                    {copyrightOpen && (
                      <div className="bg-[#1a1a1a]">
                        <Link
                          to="/copyright"
                          onClick={() => {
                            setIsDropdownOpen(false);
                            setCopyrightOpen(false);
                          }}
                          className="w-full pl-12 pr-4 py-2 text-left hover:bg-[#272727] text-sm text-gray-300 block"
                        >
                          Copyright Center
                        </Link>
                        <Link
                          to="/copyright/my-claims"
                          onClick={() => {
                            setIsDropdownOpen(false);
                            setCopyrightOpen(false);
                          }}
                          className="w-full pl-12 pr-4 py-2 text-left hover:bg-[#272727] text-sm text-gray-300 block"
                        >
                          My Claims
                        </Link>
                      </div>
                    )}
                  </div>

                  <Link
                    to="/customer-support"
                    onClick={() => setIsDropdownOpen(false)}
                    className="w-full px-4 py-2.5 text-left hover:bg-[#272727] flex items-center gap-4 text-sm"
                  >
                    <PhoneCall size={20} className="text-gray-300" /> Customer
                    Support
                  </Link>
                  <Link
                    to="/terms-and-conditions"
                    onClick={() => setIsDropdownOpen(false)}
                    className="w-full px-4 py-2.5 text-left hover:bg-[#272727] flex items-center gap-4 text-sm"
                  >
                    <FileText size={20} className="text-gray-300" /> Terms and
                    Conditions
                  </Link>

                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-2.5 text-left hover:bg-[#272727] flex items-center gap-4 text-sm border-t border-gray-800 text-red-400"
                  >
                    <LogOut size={20} /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Voice Listening Overlay */}
      {isListening && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center">
          <div className="bg-[#1a1a1a] border border-gray-700 rounded-2xl p-8 max-w-sm w-full mx-4 text-center">
            <div className="relative mx-auto w-20 h-20 mb-5">
              <div className="absolute inset-0 bg-red-600/30 rounded-full animate-ping" />
              <div className="relative w-20 h-20 bg-red-600 rounded-full flex items-center justify-center">
                <Mic size={36} className="text-white" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">
              Listening...
            </h3>
            <p className="text-gray-400 text-sm mb-4">Speak now to search</p>
            {searchQuery && (
              <p className="text-white text-base font-medium mb-5 px-3 py-2 bg-[#272727] rounded-lg">
                "{searchQuery}"
              </p>
            )}
            <button
              onClick={handleMicClick}
              className="px-6 py-2 bg-[#272727] hover:bg-[#3a3a3a] text-white rounded-full text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Mobile Search Overlay */}
      {isMobileSearchOpen && (
        <div
          className="absolute inset-0 z-50 bg-[#0f0f0f] flex items-center gap-2 px-3"
          ref={mobileSearchRef}
        >
          <button
            onClick={() => setIsMobileSearchOpen(false)}
            className="p-2 rounded-full hover:bg-[#272727]"
          >
            <ArrowLeft size={22} className="text-white" />
          </button>

          <div className="relative flex-1" ref={mobileSearchBoxRef}>
            <input
              type="text"
              autoFocus
              placeholder={isListening ? "Listening..." : "Search"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() =>
                searchQuery.trim() && hints.length > 0 && setShowHints(true)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
                if (e.key === "Escape") setIsMobileSearchOpen(false);
              }}
              className={`w-full h-10 bg-[#121212] border rounded-full pl-4 pr-12 text-sm text-white placeholder-gray-500 focus:outline-none
                ${isListening ? "border-red-500" : "border-gray-700 focus:border-blue-500"}`}
            />
            <button
              onClick={() => handleSearch()}
              className="absolute right-1 top-1 bottom-1 w-9 flex items-center justify-center rounded-full hover:bg-[#272727]"
            >
              <Search size={18} className="text-gray-300" />
            </button>
            {showHints && hints.length > 0 && renderHints()}
          </div>

          <button
            onClick={handleMicClick}
            className={`p-2.5 rounded-full ${isListening ? "bg-red-600 animate-pulse" : "hover:bg-[#272727]"}`}
          >
            {isListening ? (
              <MicOff size={22} className="text-white" />
            ) : (
              <Mic size={22} className="text-white" />
            )}
          </button>

          <button
            onClick={() => setIsMobileSearchOpen(false)}
            className="p-2 rounded-full hover:bg-[#272727]"
          >
            <X size={22} className="text-white" />
          </button>
        </div>
      )}
    </header>
  );
}
