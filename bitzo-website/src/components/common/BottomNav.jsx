

import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, Flame, Plus, User, MonitorSpeakerIcon } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { API_ORIGIN } from "../../config/api";
import { fetchProfileData } from "../../features/profile/profileSlice";


const bottomItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Flame, label: "Shorts", path: "/shorts" },
  { icon: Plus, label: "", path: "/uploadvideo", isCenter: true },
  { icon: MonitorSpeakerIcon, label: "Earn More", path: "/video/1" },
  { icon: User, label: "You", path: "/profile" },
];

export default function BottomNav() {
  const location = useLocation();
  const dispatch = useDispatch();
  const profileUser = useSelector((state) => state.profile?.user);
  const [avatarFailed, setAvatarFailed] = useState(false);

  // Keep avatar URL handling consistent with the profile page.
  const avatarValue =
    typeof profileUser?.avatar === "object"
      ? profileUser.avatar.url || profileUser.avatar.secure_url
      : profileUser?.avatar;

  const normalizedAvatar = String(avatarValue || "").replace(/\\/g, "/");

  const avatarUrl = normalizedAvatar
    ? /^https?:\/\//i.test(normalizedAvatar)
      ? normalizedAvatar
      : normalizedAvatar.startsWith("uploads/")
        ? `${API_ORIGIN}/${normalizedAvatar}`
        : normalizedAvatar.startsWith("/uploads/")
          ? `${API_ORIGIN}${normalizedAvatar}`
          : normalizedAvatar.includes("uploads/")
            ? `${API_ORIGIN}/${normalizedAvatar.split("uploads/").pop()}`
            : `${API_ORIGIN}/${normalizedAvatar.replace(/^\/+/, "")}`
    : null;

  // 🔥 Console to see exactly where image is coming from
  useEffect(() => {
    console.log("[BottomNav] Avatar Debug →", {
      profileUserExists: !!profileUser,
      rawAvatar: profileUser?.avatar,
      avatarValue,
      normalizedAvatar,
      finalAvatarUrl: avatarUrl,
      API_ORIGIN,
    });
  }, [profileUser, avatarUrl]);

  // Fetch profile if logged in and not loaded yet
  useEffect(() => {
    if (!profileUser && localStorage.getItem("token")) {
      dispatch(fetchProfileData());
    }
  }, [dispatch, profileUser]);

  // Reset failed state when avatar changes
  useEffect(() => {
    setAvatarFailed(false);
  }, [avatarUrl]);

  return (
    <nav
      className="
        md:hidden fixed bottom-0 inset-x-0 z-50
        bg-[#0f0f0f]/90 backdrop-blur-xl border-t border-gray-800/80
        flex items-center justify-around h-16
        shadow-[0_-4px_12px_rgba(0,0,0,0.4)]
      "
    >
      {bottomItems.map((item) => {
        const isCenter = item.isCenter;
        const isActive = location.pathname === item.path;

        // Center Upload Button
        if (isCenter) {
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="
                relative -top-5 flex items-center justify-center
                w-14 h-14 rounded-full bg-red-600 text-white
                shadow-[0_6px_20px_rgba(220,38,38,0.4)]
                active:scale-95 transition-all
              "
            >
              <Plus size={28} strokeWidth={2.5} />
            </NavLink>
          );
        }

        // Normal Tabs
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={`
              relative flex flex-col items-center flex-1 py-1.5
              transition-all duration-150 active:scale-95
              ${isActive ? "text-white" : "text-gray-400 hover:text-white"}
            `}
          >
            {/* Profile Photo for "You" tab */}
            {item.label === "You" ? (
              avatarUrl && !avatarFailed ? (
                <img
                  key={avatarUrl}
                  src={avatarUrl}
                  alt="Profile"
                  loading="eager"
                  className={`mb-0.5 h-7 w-7 rounded-full object-cover border-2 ${
                    isActive ? "border-white" : "border-transparent"
                  }`}
                  onLoad={() =>
                    console.log(
                      "[BottomNav] ✅ avatar loaded successfully →",
                      avatarUrl,
                    )
                  }
                  onError={(event) => {
                    console.error("[BottomNav] ❌ avatar failed to load →", {
                      triedUrl: avatarUrl,
                      actualSrc: event.currentTarget?.src,
                    });
                    setAvatarFailed(true);
                  }}
                />
              ) : (
                <div
                  className={`mb-0.5 h-7 w-7 rounded-full bg-linear-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold ${
                    isActive ? "ring-2 ring-white" : ""
                  }`}
                >
                  {profileUser?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )
            ) : (
              <item.icon
                size={26}
                strokeWidth={isActive ? 2.8 : 1.8}
                className="mb-0.5"
              />
            )}

            <span className="text-[10px] font-medium mt-0.5">{item.label}</span>

            {isActive && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-white rounded-full" />
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
