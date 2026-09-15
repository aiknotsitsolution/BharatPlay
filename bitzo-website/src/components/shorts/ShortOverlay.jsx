export default function ShortOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[5]"
      aria-hidden="true"
    >
      {/* Top: almost transparent for an immersive look */}
      <div className="absolute inset-x-0 top-0 h-28 bg-linear-to-b from-black/70 via-black/20 to-transparent" />
      {/* Bottom: transparent → black gradient for text readability */}
      <div className="absolute inset-x-0 bottom-0 h-[55%] bg-linear-to-t from-black/90 via-black/40 to-transparent" />
    </div>
  );
}
