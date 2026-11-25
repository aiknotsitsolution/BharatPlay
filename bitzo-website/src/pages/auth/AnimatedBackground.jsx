import React, { useEffect, useRef } from "react";

export default function AnimatedBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationId;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let mouseX = width / 2;
    let mouseY = height / 2;

    const isMobile = width < 768;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const handleMouse = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener("mousemove", handleMouse);

    // ========== LARGE CINEMATIC ORBS ==========
    const orbs = [
      {
        x: width * 0.14, y: height * 0.2,
        radius: isMobile ? 200 : 390,
        r: 205, g: 32, b: 38,
        opacity: 0.2,
        vx: 0.045, vy: 0.03,          // slower
        phase: 0,
        glowRadius: 1.55,
      },
      {
        x: width * 0.86, y: height * 0.75,
        radius: isMobile ? 220 : 420,
        r: 165, g: 22, b: 30,
        opacity: 0.16,
        vx: -0.04, vy: 0.028,
        phase: 2.3,
        glowRadius: 1.6,
      },
      {
        x: width * 0.5, y: height * 0.08,
        radius: isMobile ? 160 : 300,
        r: 225, g: 50, b: 55,
        opacity: 0.12,
        vx: 0.028, vy: 0.04,
        phase: 4.1,
        glowRadius: 1.4,
      },
      {
        x: width * 0.1, y: height * 0.85,
        radius: isMobile ? 150 : 280,
        r: 175, g: 28, b: 35,
        opacity: 0.13,
        vx: -0.035, vy: -0.025,
        phase: 1.2,
        glowRadius: 1.35,
      },
      {
        x: width * 0.72, y: height * 0.18,
        radius: isMobile ? 130 : 240,
        r: 255, g: 80, b: 70,
        opacity: 0.09,
        vx: 0.025, vy: 0.035,
        phase: 3.5,
        glowRadius: 1.3,
      },
      {
        x: width * 0.42, y: height * 0.55,
        radius: isMobile ? 170 : 320,
        r: 110, g: 16, b: 24,
        opacity: 0.09,
        vx: -0.022, vy: 0.025,
        phase: 5.2,
        glowRadius: 1.4,
      },
    ];

    // ========== ENTERTAINMENT ICONS (bigger + brighter) ==========
    const icons = [];
    const iconCount = isMobile ? 10 : 18;
    const types = [
      "play", "headphones", "speaker", "camera",
      "cassette", "radio", "mic", "film", "disc",
      "earphones", "earbuds", "tv", "remote", "clapboard"
    ];

    for (let i = 0; i < iconCount; i++) {
      icons.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 42 + Math.random() * 48,          // BIGGER
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.005, // slower rotation
        vx: (Math.random() - 0.5) * 0.18,        // slower movement
        vy: (Math.random() - 0.5) * 0.14,
        opacity: 0.38 + Math.random() * 0.25,    // BRIGHTER
        type: types[Math.floor(Math.random() * types.length)],
        depth: 0.35 + Math.random() * 0.65,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.18 + Math.random() * 0.3,
      });
    }

    let time = 0;

    // ========== ICON DRAW FUNCTIONS ==========
    const drawPlay = (size, alpha) => {
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = `rgba(255, 130, 120, ${alpha})`;
      ctx.fillStyle = `rgba(235, 55, 60, ${alpha * 0.4})`;

      ctx.beginPath();
      ctx.arc(0, 0, size * 0.55, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-size * 0.18, -size * 0.28);
      ctx.lineTo(size * 0.34, 0);
      ctx.lineTo(-size * 0.18, size * 0.28);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };

    const drawHeadphones = (size, alpha) => {
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = `rgba(255, 125, 115, ${alpha})`;
      ctx.fillStyle = `rgba(225, 50, 55, ${alpha * 0.35})`;

      ctx.beginPath();
      ctx.arc(0, -size * 0.15, size * 0.42, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(-size * 0.38, size * 0.08, size * 0.19, size * 0.27, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(size * 0.38, size * 0.08, size * 0.19, size * 0.27, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    };

    const drawSpeaker = (size, alpha) => {
      ctx.lineWidth = 2.1;
      ctx.strokeStyle = `rgba(255, 130, 120, ${alpha})`;
      ctx.fillStyle = `rgba(215, 48, 52, ${alpha * 0.3})`;

      const w = size * 0.55;
      const h = size * 0.7;
      ctx.strokeRect(-w / 2, -h / 2, w, h);
      ctx.fillRect(-w / 2, -h / 2, w, h);

      ctx.beginPath();
      ctx.arc(0, -size * 0.12, size * 0.17, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, size * 0.18, size * 0.13, 0, Math.PI * 2);
      ctx.stroke();
    };

    const drawCamera = (size, alpha) => {
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = `rgba(255, 130, 120, ${alpha})`;
      ctx.fillStyle = `rgba(220, 48, 52, ${alpha * 0.32})`;

      const w = size * 0.78;
      const h = size * 0.52;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, 5);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, size * 0.19, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.09, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillRect(size * 0.24, -size * 0.3, size * 0.15, size * 0.11);
    };

    const drawCassette = (size, alpha) => {
      ctx.lineWidth = 2.1;
      ctx.strokeStyle = `rgba(255, 125, 115, ${alpha})`;
      ctx.fillStyle = `rgba(205, 42, 48, ${alpha * 0.28})`;

      const w = size * 0.82;
      const h = size * 0.52;
      ctx.strokeRect(-w / 2, -h / 2, w, h);
      ctx.fillRect(-w / 2, -h / 2, w, h);

      ctx.beginPath();
      ctx.arc(-size * 0.2, 0, size * 0.13, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(size * 0.2, 0, size * 0.13, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeRect(-size * 0.3, -size * 0.13, size * 0.6, size * 0.26);
    };

    const drawRadio = (size, alpha) => {
      ctx.lineWidth = 2.1;
      ctx.strokeStyle = `rgba(255, 130, 120, ${alpha})`;
      ctx.fillStyle = `rgba(215, 48, 52, ${alpha * 0.28})`;

      const w = size * 0.72;
      const h = size * 0.48;
      ctx.strokeRect(-w / 2, -h / 2, w, h);
      ctx.fillRect(-w / 2, -h / 2, w, h);

      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * size * 0.09, -size * 0.13);
        ctx.lineTo(i * size * 0.09, size * 0.13);
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.moveTo(size * 0.22, -h / 2);
      ctx.lineTo(size * 0.38, -size * 0.42);
      ctx.stroke();
    };

    const drawMic = (size, alpha) => {
      ctx.lineWidth = 2.3;
      ctx.strokeStyle = `rgba(255, 130, 120, ${alpha})`;
      ctx.fillStyle = `rgba(225, 52, 58, ${alpha * 0.35})`;

      ctx.beginPath();
      ctx.ellipse(0, -size * 0.15, size * 0.23, size * 0.29, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, size * 0.13);
      ctx.lineTo(0, size * 0.45);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-size * 0.2, size * 0.45);
      ctx.lineTo(size * 0.2, size * 0.45);
      ctx.stroke();
    };

    const drawFilm = (size, alpha) => {
      ctx.lineWidth = 2;
      ctx.strokeStyle = `rgba(255, 125, 115, ${alpha})`;
      ctx.fillStyle = `rgba(205, 42, 48, ${alpha * 0.25})`;

      const w = size * 0.78;
      const h = size * 0.48;
      ctx.strokeRect(-w / 2, -h / 2, w, h);
      ctx.fillRect(-w / 2, -h / 2, w, h);

      for (let i = -2; i <= 2; i++) {
        ctx.fillRect(-w / 2 + 5, i * size * 0.09 - 4, 6, 7);
        ctx.fillRect(w / 2 - 11, i * size * 0.09 - 4, 6, 7);
      }
    };

    const drawDisc = (size, alpha) => {
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = `rgba(255, 130, 120, ${alpha})`;
      ctx.fillStyle = `rgba(215, 48, 52, ${alpha * 0.22})`;

      ctx.beginPath();
      ctx.arc(0, 0, size * 0.52, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, size * 0.09, 0, Math.PI * 2);
      ctx.fill();
    };

    // NEW ICONS
    const drawEarphones = (size, alpha) => {
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = `rgba(255, 130, 120, ${alpha})`;
      ctx.fillStyle = `rgba(220, 50, 55, ${alpha * 0.3})`;

      // Left bud
      ctx.beginPath();
      ctx.arc(-size * 0.28, -size * 0.15, size * 0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Right bud
      ctx.beginPath();
      ctx.arc(size * 0.28, -size * 0.15, size * 0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Wire
      ctx.beginPath();
      ctx.moveTo(-size * 0.28, size * 0.0);
      ctx.quadraticCurveTo(0, size * 0.45, size * 0.28, size * 0.0);
      ctx.stroke();
    };

    const drawEarbuds = (size, alpha) => {
      ctx.lineWidth = 2.1;
      ctx.strokeStyle = `rgba(255, 130, 120, ${alpha})`;
      ctx.fillStyle = `rgba(220, 50, 55, ${alpha * 0.32})`;

      // Left
      ctx.beginPath();
      ctx.ellipse(-size * 0.22, 0, size * 0.16, size * 0.22, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Right
      ctx.beginPath();
      ctx.ellipse(size * 0.22, 0, size * 0.16, size * 0.22, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    };

    const drawTV = (size, alpha) => {
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = `rgba(255, 130, 120, ${alpha})`;
      ctx.fillStyle = `rgba(210, 45, 50, ${alpha * 0.28})`;

      const w = size * 0.85;
      const h = size * 0.55;
      ctx.strokeRect(-w / 2, -h / 2, w, h);
      ctx.fillRect(-w / 2, -h / 2, w, h);

      // Stand
      ctx.beginPath();
      ctx.moveTo(-size * 0.15, h / 2);
      ctx.lineTo(0, size * 0.42);
      ctx.lineTo(size * 0.15, h / 2);
      ctx.stroke();
    };

    const drawRemote = (size, alpha) => {
      ctx.lineWidth = 2.1;
      ctx.strokeStyle = `rgba(255, 130, 120, ${alpha})`;
      ctx.fillStyle = `rgba(215, 48, 52, ${alpha * 0.28})`;

      const w = size * 0.35;
      const h = size * 0.75;
      ctx.strokeRect(-w / 2, -h / 2, w, h);
      ctx.fillRect(-w / 2, -h / 2, w, h);

      // Buttons
      ctx.beginPath();
      ctx.arc(0, -size * 0.18, size * 0.08, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillRect(-size * 0.08, size * 0.05, size * 0.16, size * 0.08);
      ctx.fillRect(-size * 0.08, size * 0.2, size * 0.16, size * 0.08);
    };

    const drawClapboard = (size, alpha) => {
      ctx.lineWidth = 2.1;
      ctx.strokeStyle = `rgba(255, 130, 120, ${alpha})`;
      ctx.fillStyle = `rgba(210, 45, 50, ${alpha * 0.28})`;

      const w = size * 0.8;
      const h = size * 0.5;
      ctx.strokeRect(-w / 2, -h / 2 + size * 0.08, w, h);
      ctx.fillRect(-w / 2, -h / 2 + size * 0.08, w, h);

      // Top hinged part
      ctx.beginPath();
      ctx.moveTo(-w / 2, -h / 2 + size * 0.08);
      ctx.lineTo(-w / 2 + size * 0.15, -h / 2 - size * 0.15);
      ctx.lineTo(w / 2, -h / 2 - size * 0.15);
      ctx.lineTo(w / 2, -h / 2 + size * 0.08);
      ctx.stroke();
    };

    const drawIcon = (icon, drawX, drawY, scale, alpha) => {
      ctx.save();
      ctx.translate(drawX, drawY);
      ctx.rotate(icon.rotation);
      ctx.globalAlpha = alpha;

      const size = icon.size * scale;

      switch (icon.type) {
        case "play": drawPlay(size, alpha); break;
        case "headphones": drawHeadphones(size, alpha); break;
        case "speaker": drawSpeaker(size, alpha); break;
        case "camera": drawCamera(size, alpha); break;
        case "cassette": drawCassette(size, alpha); break;
        case "radio": drawRadio(size, alpha); break;
        case "mic": drawMic(size, alpha); break;
        case "film": drawFilm(size, alpha); break;
        case "disc": drawDisc(size, alpha); break;
        case "earphones": drawEarphones(size, alpha); break;
        case "earbuds": drawEarbuds(size, alpha); break;
        case "tv": drawTV(size, alpha); break;
        case "remote": drawRemote(size, alpha); break;
        case "clapboard": drawClapboard(size, alpha); break;
        default: drawPlay(size, alpha);
      }

      ctx.restore();
    };

    // ========== MAIN LOOP ==========
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.0018; // slower overall time

      const grad = ctx.createRadialGradient(
        width * 0.5, height * 0.4, 0,
        width * 0.5, height * 0.4, Math.max(width, height) * 0.85
      );
      grad.addColorStop(0, "rgba(18, 6, 9, 1)");
      grad.addColorStop(0.4, "rgba(10, 3, 6, 1)");
      grad.addColorStop(0.75, "rgba(5, 2, 3, 1)");
      grad.addColorStop(1, "rgba(2, 1, 2, 1)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      const cx = (mouseX - width / 2) * 0.012;
      const cy = (mouseY - height / 2) * 0.012;

      // Orbs
      orbs.forEach((orb) => {
        orb.x += Math.sin(time * 0.35 + orb.phase) * orb.vx;
        orb.y += Math.cos(time * 0.25 + orb.phase * 0.7) * orb.vy;

        const drawX = orb.x + cx * 0.85;
        const drawY = orb.y + cy * 0.85;

        const breathe = Math.sin(time * 0.18 + orb.phase) * 0.11 + 1;
        const r = orb.radius * breathe;
        const gr = r * orb.glowRadius;

        const core = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, r * 0.38);
        core.addColorStop(0, `rgba(${Math.min(orb.r + 45, 255)}, ${orb.g + 22}, ${orb.b + 18}, ${orb.opacity * 0.65})`);
        core.addColorStop(1, `rgba(${orb.r}, ${orb.g}, ${orb.b}, 0)`);
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(drawX, drawY, r * 0.38, 0, Math.PI * 2);
        ctx.fill();

        const glow = ctx.createRadialGradient(drawX, drawY, r * 0.1, drawX, drawY, gr);
        glow.addColorStop(0, `rgba(${orb.r}, ${orb.g}, ${orb.b}, ${orb.opacity * 0.4})`);
        glow.addColorStop(0.35, `rgba(${orb.r}, ${orb.g}, ${orb.b}, ${orb.opacity * 0.15})`);
        glow.addColorStop(0.7, `rgba(${orb.r}, ${orb.g}, ${orb.b}, ${orb.opacity * 0.04})`);
        glow.addColorStop(1, `rgba(${orb.r}, ${orb.g}, ${orb.b}, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(drawX, drawY, gr, 0, Math.PI * 2);
        ctx.fill();
      });

      // Soft waves
      for (let w = 0; w < 3; w++) {
        const waveY = height * (0.2 + w * 0.25) + Math.sin(time * (0.12 + w * 0.03) + w) * 24;
        const amp = 15 + w * 5;
        const freq = 0.0015 + w * 0.0003;
        const speed = 0.22 + w * 0.06;
        const alpha = 0.015 - w * 0.003;

        ctx.beginPath();
        ctx.moveTo(-10, waveY);
        for (let x = 0; x <= width + 10; x += 8) {
          const y =
            waveY +
            Math.sin(x * freq + time * speed) * amp +
            Math.sin(x * freq * 2.1 + time * speed * 1.3 + w) * amp * 0.25;
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(${180 + w * 10}, ${38 + w * 5}, ${42 + w * 4}, ${alpha})`;
        ctx.lineWidth = 1.3 + w * 0.35;
        ctx.stroke();
      }

      // Icons
      icons.forEach((icon) => {
        icon.x += icon.vx;
        icon.y += icon.vy;
        icon.rotation += icon.rotSpeed;

        if (icon.x < -100) icon.x = width + 100;
        if (icon.x > width + 100) icon.x = -100;
        if (icon.y < -100) icon.y = height + 100;
        if (icon.y > height + 100) icon.y = -100;

        const parallax = 0.6 + icon.depth * 0.6;
        const drawX = icon.x + cx * parallax;
        const drawY = icon.y + cy * parallax;

        const pulse = Math.sin(time * icon.pulseSpeed + icon.pulsePhase) * 0.14 + 0.9;
        const alpha = icon.opacity * pulse;

        // Stronger glow
        const glowSize = icon.size * 2.3 * pulse;
        const g = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, glowSize);
        g.addColorStop(0, `rgba(255, 95, 85, ${alpha * 0.38})`);
        g.addColorStop(0.4, `rgba(230, 55, 60, ${alpha * 0.12})`);
        g.addColorStop(1, "rgba(200, 40, 45, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(drawX, drawY, glowSize, 0, Math.PI * 2);
        ctx.fill();

        drawIcon(icon, drawX, drawY, pulse, alpha);
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouse);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: "block" }}
      />

      <div
        className="absolute rounded-full blur-3xl"
        style={{
          width: "65vw", height: "65vw", maxWidth: "750px", maxHeight: "750px",
          top: "-5%", left: "-8%",
          background: "radial-gradient(circle, rgba(185,28,38,0.16) 0%, rgba(140,15,25,0.06) 42%, transparent 70%)",
          animation: "drift1 42s ease-in-out infinite",
        }}
      />
      <div
        className="absolute rounded-full blur-3xl"
        style={{
          width: "55vw", height: "55vw", maxWidth: "650px", maxHeight: "650px",
          bottom: "-10%", right: "-8%",
          background: "radial-gradient(circle, rgba(155,20,30,0.13) 0%, rgba(115,12,20,0.04) 42%, transparent 70%)",
          animation: "drift2 48s ease-in-out infinite",
        }}
      />
      <div
        className="absolute rounded-full blur-2xl"
        style={{
          width: "38vw", height: "38vw", maxWidth: "450px", maxHeight: "450px",
          top: "48%", left: "50%", transform: "translateX(-50%)",
          background: "radial-gradient(circle, rgba(215,48,55,0.09) 0%, rgba(175,28,38,0.025) 45%, transparent 70%)",
          animation: "drift3 36s ease-in-out infinite",
        }}
      />

      <style>{`
        @keyframes drift1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(38px, -25px) scale(1.04); }
          50% { transform: translate(-20px, 34px) scale(0.97); }
          75% { transform: translate(25px, 14px) scale(1.025); }
        }
        @keyframes drift2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(-28px, 22px) scale(1.035); }
          50% { transform: translate(24px, -28px) scale(0.96); }
          75% { transform: translate(-14px, -10px) scale(1.02); }
        }
        @keyframes drift3 {
          0%, 100% { transform: translateX(-50%) translate(0, 0) scale(1); }
          33% { transform: translateX(-50%) translate(18px, -18px) scale(1.03); }
          66% { transform: translateX(-50%) translate(-14px, 14px) scale(0.98); }
        }
      `}</style>
    </div>
  );
}