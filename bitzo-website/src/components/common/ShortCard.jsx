import { useState } from "react";
import { MoreHorizontal, Share2 } from "lucide-react";

const formatViews = (num) => {
  const n = Number(num) || 0;
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M views`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K views`;
  }
  return `${n} views`;
};

export default function ShortCard({ item, onClick }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const thumbnail =
    item.thumbnail ||
    item.thumb ||
    "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=225&fit=crop";

  const openShort = () => onClick(item);

  const toggleMenu = (e) => {
    e.stopPropagation();
    setMenuOpen((open) => !open);
  };

  const shareShort = async (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/shorts/${item.id}`,
      );
    } catch {
      /* clipboard unavailable */
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openShort();
    } else if (e.key === "Escape") {
      setMenuOpen(false);
    }
  };

  return (
    <div
      onClick={openShort}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      className="card-hover group w-full cursor-pointer hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
    >
      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-xl bg-black shadow-sm">
        <img
          src={thumbnail}
          alt={item.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
        />

        <div className="absolute right-1.5 top-1.5 z-10 opacity-0 transition-opacity duration-300 group-focus-within:opacity-100 group-hover:opacity-100">
          <button
            onClick={toggleMenu}
            aria-label="More options"
            title="More options"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80"
          >
            <MoreHorizontal size={18} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-9 z-20 w-40 overflow-hidden rounded-lg bg-zinc-900 shadow-xl ring-1 ring-white/10">
              <button
                onClick={shareShort}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-white transition-colors hover:bg-zinc-800"
              >
                <Share2 size={15} /> Share
              </button>
            </div>
          )}
        </div>
      </div>

      <h3 className="mt-2 line-clamp-2 text-sm font-medium leading-snug text-white">
        {item.title}
      </h3>

      <p className="mt-1 text-xs text-neutral-400">
        {formatViews(item.views)}
      </p>
    </div>
  );
}
