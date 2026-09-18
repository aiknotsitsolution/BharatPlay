import { Link } from "react-router-dom";
import { FileText, Scale, HeartHandshake, UserX } from "lucide-react";
import usePageMeta from "../../hooks/usePageMeta";

const LEGAL_NAV = [
  { label: "Privacy Policy", path: "/privacy-policy", icon: FileText },
  { label: "Terms & Conditions", path: "/terms", icon: Scale },
  { label: "Contact & Support", path: "/contact", icon: HeartHandshake },
  { label: "Delete Account", path: "/delete-account", icon: UserX },
];

/**
 * Shared layout for legal / policy / support pages: page heading, intro,
 * readable content width, optional legal navigation block.
 */
export default function LegalPageLayout({
  title,
  description,
  intro,
  lastUpdated,
  children,
}) {
  usePageMeta(title, description);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      {/* Heading */}
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
        {lastUpdated && (
          <p className="mt-2 text-sm text-zinc-500">Last Updated: {lastUpdated}</p>
        )}
        {intro && <p className="mt-4 text-base leading-relaxed text-zinc-400">{intro}</p>}
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
                  className="inline-flex items-center gap-2.5 rounded-lg border border-zinc-800/70 bg-[#161616] px-3.5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white lg:border-transparent lg:bg-transparent lg:hover:bg-[#1c1c1c]"
                >
                  <Icon size={16} className="text-zinc-500" />
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