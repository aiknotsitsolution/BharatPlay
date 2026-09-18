import { Link } from "react-router-dom";
import { FileText, Scale, HeartHandshake, UserX, BookOpen, Copyright } from "lucide-react";
import usePageMeta from "../../hooks/usePageMeta";
import { useTheme } from "../../context/ThemeContext";

const LEGAL_NAV = [
  { label: "Privacy Policy", path: "/privacy-policy", icon: FileText },
  { label: "Terms & Services", path: "/terms", icon: Scale },
  { label: "Community Guidelines", path: "/community-guidelines", icon: BookOpen },
  { label: "Copyright Notices", path: "/copyright-policy", icon: Copyright },
  { label: "Contact & Support", path: "/contact", icon: HeartHandshake },
  { label: "Delete Account", path: "/delete-account", icon: UserX },
];

export default function LegalPageLayout({
  title,
  description,
  intro,
  lastUpdated,
  children,
}) {
  usePageMeta(title, description);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      {/* Heading */}
      <div className="max-w-2xl">
        <h1 className={`text-3xl font-bold tracking-tight sm:text-4xl ${isDark ? "text-white" : "text-gray-900"}`}>
          {title}
        </h1>
        {lastUpdated && (
          <p className={`mt-2 text-sm ${isDark ? "text-zinc-500" : "text-gray-400"}`}>Last Updated: {lastUpdated}</p>
        )}
        {intro && <p className={`mt-4 text-base leading-relaxed ${isDark ? "text-zinc-400" : "text-gray-500"}`}>{intro}</p>}
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[220px_1fr] lg:gap-12">
        {/* Legal navigation */}
        <aside aria-label="Company and legal pages">
          <nav className="flex flex-wrap gap-1.5 lg:sticky lg:top-24 lg:flex-col">
            {LEGAL_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`inline-flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm font-medium transition-colors lg:border-transparent lg:bg-transparent ${
                    isDark
                      ? "border-zinc-800/70 bg-[#161616] text-zinc-300 hover:border-zinc-700 hover:text-white lg:hover:bg-[#1c1c1c]"
                      : "border-gray-200 bg-gray-100 text-gray-700 hover:border-gray-300 hover:text-gray-900 lg:hover:bg-gray-50"
                  }`}
                >
                  <Icon size={16} className={isDark ? "text-zinc-500" : "text-gray-400"} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <div className="max-w-3xl">{children}</div>
      </div>
    </div>
  );
}
