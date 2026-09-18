import { Link } from "react-router-dom";
import { SITE } from "../../config/site";
import { useTheme } from "../../context/ThemeContext";
import SiteLogo from "./SiteLogo";

const COLUMNS = [
  {
    title: "BharatPlay",
    links: [
      { label: "About Us", path: "/about" },
      { label: "Contact", path: "/contact" },
      { label: "Careers", path: "/about" },
      { label: "Press", path: "/about" },
    ],
  },
  {
    title: "Products",
    links: [
      { label: "BharatPlay Website", path: "/apps" },
      { label: "Mobile App", path: "/apps" },
      { label: "Shorts", path: "/" },
      { label: "Premium", path: "/about" },
      { label: "Studio", path: "/studio" },
    ],
  },
  {
    title: "Creators",
    links: [
      { label: "Artists", path: "/about" },
      { label: "Creators", path: "/about" },
      { label: "Creator Academy", path: "/about" },
      { label: "Creating for Kids", path: "/about" },
    ],
  },
  {
    title: "For Business",
    links: [
      { label: "Advertising", path: "/advertising" },
      { label: "Developers", path: "/developers" },
      { label: "Partnerships", path: "/for-business" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", path: "/privacy-policy" },
      { label: "Terms", path: "/terms" },
      { label: "Account & Data Deletion", path: "/delete-account" },
    ],
  },
];

const BOTTOM_LINKS = [
  { label: "Policy & Safety", path: "/privacy-policy" },
  { label: "Copyright", path: "/terms" },
  { label: "Privacy", path: "/privacy-policy" },
  { label: "Terms", path: "/terms" },
];

export default function PublicFooter() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <footer
      className={`w-full border-t transition-colors duration-300 ${
        isDark
          ? "border-zinc-800/70 bg-[#111111]"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="mx-auto max-w-7xl px-5 pt-10 pb-6 sm:px-8">
        {/* Brand */}
        <div className="mb-8">
          <SiteLogo to="/" className="[&_span]:text-base [&_img]:h-6 [&_img]:w-6" />
          <p className={`mt-2 text-sm ${isDark ? "text-zinc-500" : "text-gray-500"}`}>
            Entertainment that connects.
          </p>
        </div>

        {/* Columns */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className={`mb-3 text-xs font-semibold uppercase tracking-wider ${isDark ? "text-zinc-400" : "text-gray-500"}`}>
                {col.title}
              </p>
              <ul className="space-y-1.5">
                {col.links.map((link) => (
                  <li key={`${col.title}-${link.label}`}>
                    <Link
                      to={link.path}
                      className={`text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60 focus-visible:rounded ${
                        isDark
                          ? "text-zinc-500 hover:text-zinc-200"
                          : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className={`border-t ${isDark ? "border-zinc-800/50" : "border-gray-200"}`}>
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-5 py-4 sm:flex-row sm:justify-between sm:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`text-xs ${isDark ? "text-zinc-600" : "text-gray-400"}`}>
              &copy; {new Date().getFullYear()} {SITE.brandName}
            </span>
            {BOTTOM_LINKS.map((link) => (
              <span key={link.label} className="flex items-center gap-3">
                <span className={isDark ? "text-zinc-800" : "text-gray-300"} aria-hidden="true">/</span>
                <Link
                  to={link.path}
                  className={`text-xs transition-colors ${
                    isDark
                      ? "text-zinc-600 hover:text-zinc-300"
                      : "text-gray-400 hover:text-gray-700"
                  }`}
                >
                  {link.label}
                </Link>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <a
              href={SITE.supportEmail ? `mailto:${SITE.supportEmail}` : "/contact"}
              className={`text-xs transition-colors ${
                isDark
                  ? "text-zinc-600 hover:text-zinc-300"
                  : "text-gray-400 hover:text-gray-700"
              }`}
            >
              Help
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
