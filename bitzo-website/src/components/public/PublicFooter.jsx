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
    <footer className="w-full border-t border-zinc-800/80 bg-[#0b0b0b]">
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-zinc-800/80 bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.12),transparent_30%),#111111] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)] sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <SiteLogo to="/" />
              <p className="mt-4 text-sm leading-relaxed text-zinc-400 sm:text-[15px]">
                {SITE.description}
              </p>
            </div>

            {SITE.supportEmail && (
              <a
                href={`mailto:${SITE.supportEmail}`}
                className="inline-flex w-fit items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition-colors hover:border-red-500/60 hover:bg-red-500/20"
              >
                Contact Support
              </a>
            )}
          </div>

          <div className="my-8 h-px bg-zinc-800" aria-hidden="true" />

          <nav
            aria-label="Footer"
            className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
          >
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Company
              </p>
              <ul className="space-y-1">
                {FOOTER_LINKS.company.map((link) => (
                  <li key={link.path}>
                    <FooterLink label={link.label} to={link.path} />
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Product
              </p>
              <ul className="space-y-1">
                {FOOTER_LINKS.product.map((link) => (
                  <li key={link.path}>
                    <FooterLink label={link.label} to={link.path} />
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Platform
              </p>
              <ul className="space-y-1">
                <li>
                  <FooterLink label="Home" to="/" />
                </li>
                <li>
                  <FooterLink label="About Us" to="/about" />
                </li>
                <li>
                  <FooterLink label="Apps" to="/apps" />
                </li>
              </ul>
            </div>
          </nav>

          <div className="mt-8 flex flex-col gap-3 border-t border-zinc-800 pt-6 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} {SITE.brandName}. All rights
              reserved.
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Link to="/terms" className="transition-colors hover:text-white">
                Terms
              </Link>
              <Link
                to="/privacy-policy"
                className="transition-colors hover:text-white"
              >
                Privacy
              </Link>
              <Link
                to="/help-support"
                className="transition-colors hover:text-white"
              >
                Help
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
