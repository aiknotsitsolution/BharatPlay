import { useEffect, useState } from "react";
import { isLoginCelebrationEnabled } from "../utils/helpers";

const FLOWERS = ["🌸", "🌼", "🌺", "🌷", "✿", "❀"];

function createFlowers(count) {
  return Array.from({ length: count }, () => ({
    id: Math.random().toString(36).slice(2, 10),
    emoji: FLOWERS[Math.floor(Math.random() * FLOWERS.length)],
    left: Math.random() * 100,
    size: 24 + Math.random() * 14,
    delay: Math.random() * 1100,
    duration: 2200 + Math.random() * 1400,
    sway: 18 + Math.random() * 40,
    driftDirection: Math.random() > 0.5 ? 1 : -1,
    rotateZero: Math.random() * 360,
    rotateFull: 420 + Math.random() * 360,
  }));
}

export default function FlowerCelebration() {
  const [flowers, setFlowers] = useState([]);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const handleCelebrate = () => {
      if (!isLoginCelebrationEnabled()) return;
      const count = Math.min(35, Math.max(22, Math.floor(window.innerWidth / 34)));
      setFlowers(createFlowers(count));
      setActive(true);
      window.setTimeout(() => setActive(false), 3300);
    };
    window.addEventListener("bp-login-celebrate", handleCelebrate);
    return () => window.removeEventListener("bp-login-celebrate", handleCelebrate);
  }, []);

  if (!active) return null;

  return (
    <div aria-hidden="true" className="flower-celebration">
      {flowers.map((f) => (
        <span
          key={f.id}
          className="flower-item"
          style={{
            left: `${f.left}%`,
            fontSize: `${f.size}px`,
            animationDelay: `${f.delay}ms`,
            animationDuration: `${f.duration}ms`,
            "--sway": `${f.driftDirection * f.sway}px`,
            "--rotate-zero": `${f.rotateZero}deg`,
            "--rotate-full": `${f.rotateFull}deg`,
          }}
        >
          {f.emoji}
        </span>
      ))}
    </div>
  );
}