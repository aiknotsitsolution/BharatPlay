import { ChevronUp } from "lucide-react";

export default function SwipeHint() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-24 z-20 flex justify-center">
      <div className="shorts-hint-in flex items-center gap-2 rounded-full border border-white/15 bg-black/60 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-black/40 backdrop-blur-md">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
          <ChevronUp size={14} className="text-white/90" />
        </span>
        Watch more reels Swipe up
      </div>
    </div>
  );
}
