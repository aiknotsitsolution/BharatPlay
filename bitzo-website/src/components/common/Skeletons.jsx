const shimmer = "animate-shimmer";

export function VideoCardSkeleton() {
  return (
    <div className="shrink-0 w-64 md:w-72" aria-hidden="true">
      <div className="card-hover">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-900">
          <div className={`${shimmer} absolute inset-0`} />
        </div>
        <div className="mt-3 flex items-start gap-3">
          <div className={`${shimmer} h-10 w-10 shrink-0 rounded-full`} />
          <div className="min-w-0 flex-1 space-y-2">
            <div className={`${shimmer} h-4 w-full rounded`} />
            <div className={`${shimmer} h-4 w-3/4 rounded`} />
            <div className={`${shimmer} h-3 w-1/2 rounded`} />
            <div className={`${shimmer} h-3 w-2/3 rounded`} />
          </div>
        </div>
      </div>
    </div>
  );
}



export function ShortsCardSkeleton() {
  return (
    <div
      className="shrink-0 w-40 sm:w-44 md:w-48 lg:w-52 snap-start"
      aria-hidden="true"
    >
      <div className="card-hover">
        <div className="relative aspect-[9/16] w-full overflow-hidden rounded-xl bg-zinc-900">
          <div className={`${shimmer} absolute inset-0`} />
        </div>
        <div className={`${shimmer} mt-3 h-4 w-4/5 rounded`} />
        <div className={`${shimmer} mt-2 h-3 w-2/5 rounded`} />
      </div>
    </div>
  );
}

export function VideoCardSkeletonRow({ count = 5 }) {
  return (
    <div
      className="flex gap-4 overflow-hidden pb-3"
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, index) => (
        <VideoCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function ShortsCardSkeletonRow({ count = 10 }) {
  return (
    <div
      className="flex gap-3 sm:gap-4 overflow-hidden pb-3"
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, index) => (
        <ShortsCardSkeleton key={index} />
      ))}
    </div>
  );
}
