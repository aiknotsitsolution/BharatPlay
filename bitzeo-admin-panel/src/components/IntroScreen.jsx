import { useEffect, useState } from "react";

export default function IntroScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2700);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="intro-screen intro-exit fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden">
      <div className="intro-glow pointer-events-none absolute" />

      <div className="relative z-10 flex flex-col items-center gap-5 px-6">
        <div className="intro-logo">
          <img
            src="/Logo-image.jpg"
            alt="BharatPlay"
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover shadow-md ring-1 ring-bp-border"
          />
        </div>

        <p className="intro-wordmark brand-wordmark text-[26px] sm:text-[30px] font-black tracking-tight font-display">
          Bharatplay
        </p>

        <div className="intro-loader flex items-center gap-1.5">
          <span className="intro-dot w-1.5 h-1.5 rounded-full bg-bp-blue" style={{ animationDelay: "0s" }} />
          <span className="intro-dot w-1.5 h-1.5 rounded-full bg-bp-blue/60" style={{ animationDelay: "0.15s" }} />
          <span className="intro-dot w-1.5 h-1.5 rounded-full bg-bp-blue" style={{ animationDelay: "0.3s" }} />
        </div>
      </div>
    </div>
  );
}