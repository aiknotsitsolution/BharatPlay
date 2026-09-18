import { Link } from "react-router-dom";
import { FOOTER_LINKS, SITE } from "../../config/site";
import SiteLogo from "./SiteLogo";

function FooterLink({ label, to }) {
  return (
    <Link
      to={to}
      className="inline-flex py-1.5 text-sm text-zinc-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60 focus-visible:rounded"
    >
      {label}
    </Link>
  );
}

/**
 * Reference-style company footer:
 * dark card container, brand + short description, divider,
 * two-column navigation, divider, copyright row.
 */
export default function PublicFooter() {
  return (
    <footer className="px-4 pb-6 pt-2 sm:px-6">
      <div className="mx-auto max-w-6xl rounded-2xl border border-zinc-800/70 bg-[#161616] px-6 py-8 sm:px-10 sm:py-10">
        {/* Brand + description */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
          <div className="max-w-sm">
            <SiteLogo to="/" />
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              {SITE.description}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="my-7 h-px bg-zinc-800" aria-hidden="true" />

        {/* Two-column links */}
        <nav aria-label="Footer" className="grid grid-cols-2 gap-6 sm:gap-8">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Company
            </p>
            <ul className="space-y-0.5">
              {FOOTER_LINKS.company.map((link) => (
                <li key={link.path}>
                  <FooterLink label={link.label} to={link.path} />
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Product
            </p>
            <ul className="space-y-0.5">
              {FOOTER_LINKS.product.map((link) => (
                <li key={link.path}>
                  <FooterLink label={link.label} to={link.path} />
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Divider */}
        <div className="my-7 h-px bg-zinc-800" aria-hidden="true" />

        {/* Copyright */}
        <div className="flex flex-col gap-2 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {SITE.brandName}. All rights reserved.</p>
          {SITE.supportEmail && (
            <a
              href={`mailto:${SITE.supportEmail}`}
              className="text-zinc-400 transition-colors hover:text-white"
            >
              {SITE.supportEmail}
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}