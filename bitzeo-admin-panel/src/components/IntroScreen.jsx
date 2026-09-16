import { useEffect, useState } from "react";

export default function IntroScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 3050);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="intro-screen intro-exit fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden">
      {/* Subtle centered blue glow behind branding */}
      <div className="intro-glow pointer-events-none absolute" />

      {/* Branding */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-6">
        {/* Logo icon */}
        <div className="intro-logo">
          <img
            src="/Logo-image.jpg"
            alt="BharatPlay"
            className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover shadow-2xl ring-1 ring-bp-border"
          />
        </div>

        {/* Wordmark */}
        <p className="intro-wordmark text-[26px] sm:text-[30px] font-bold tracking-tight text-bp-text">
          Bharat
          <span
            style={{
              background:
                "linear-gradient(135deg, #FF6A00, #FFC400, #00D9FF, #008CFF)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            play
          </span>
        </p>

        {/* Minimal loader dots */}
        <div className="intro-loader flex items-center gap-1.5">
          <span className="intro-dot w-1.5 h-1.5 rounded-full bg-bp-blue" style={{ animationDelay: "0s" }} />
          <span className="intro-dot w-1.5 h-1.5 rounded-full bg-bp-cyan" style={{ animationDelay: "0.16s" }} />
          <span className="intro-dot w-1.5 h-1.5 rounded-full bg-bp-blue" style={{ animationDelay: "0.32s" }} />
        </div>
      </div>
    </div>
  );
}