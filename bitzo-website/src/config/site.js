/**
 * Central public-facing site configuration for BharatPlay.
 *
 * Only facts that can be verified from the repository are hard-coded here.
 * Anything not yet verified is read from environment variables so the real
 * value can be inserted later without touching page code.
 */

const isBrowser = typeof window !== "undefined";

export const SITE = {
  brandName: "BharatPlay",
  brandTagline: "Watch. Create. Connect.",

  description:
    "BharatPlay is a video and creator platform where people can watch, discover, upload and share short and long videos across web and mobile.",

  // Verified in the repository: the website is a video-sharing platform.
  product: {
    categories: ["BharatPlay Website (Web)", "BharatPlay Mobile App (Android)"],
  },

  // Verified from MyApp/app.json
  androidPackageName: "com.bharatplay.app",
  // Verified from MyApp/app.json (configuration only; iOS store availability is not verified)
  iosBundleId: "com.bharatplay.MyApp",
  hasVerifiedIosStoreListing: false,

  // Website URL. Falls back to the current origin so it works in dev and prod.
  websiteUrl: (() => {
    const url = import.meta.env.VITE_SITE_URL;
    if (url) return url.replace(/\/+$/, "");
    return isBrowser ? window.location.origin : "";
  })(),

  // Google Play listing. Not present in the repository — set VITE_GOOGLE_PLAY_URL
  // to the real listing URL when available. Never fabricate.
  googlePlayUrl: (import.meta.env.VITE_GOOGLE_PLAY_URL || "").replace(
    /\/+$/,
    "",
  ),

  // Support / contact email. Not verified in the repository — set
  // VITE_SUPPORT_EMAIL when the real address is available.
  supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || "",
  updateEmail: import.meta.env.VITE_UPDATE_EMAIL || "",

  legal: {
    lastUpdated: "September 18, 2026",
  },

  // Internal route the web application lives at (after authentication).
  appPath: "/",
};

export const NAV_LINKS = [
  { label: "Home", path: "/advanced-settings" },
  { label: "Apps", path: "/apps" },
  { label: "About", path: "/about" },
  { label: "Contact", path: "/contact" },
];

export const FOOTER_LINKS = {
  company: [
    { label: "About Us", path: "/about" },
    { label: "Privacy Policy", path: "/privacy-policy" },
    { label: "Contact Us", path: "/contact" },
  ],
  product: [
    { label: "Our Apps", path: "/apps" },
    { label: "Terms & Conditions", path: "/terms" },
    { label: "Delete Account", path: "/delete-account" },
  ],
};

export default SITE;
