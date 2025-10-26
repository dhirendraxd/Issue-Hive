import { useEffect, useRef } from "react";

type Props = {
  className?: string;
  count?: number;
  color?: string; // dust color
  maxAlpha?: number; // maximum opacity for a particle
};

// Subtle, tiny floating dust particles drifting upward.
export default function AmbientDust({ className, count = 90, color = "#ffffff", maxAlpha = 0.08 }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    let width = 0;
    let height = 0;
    let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    type Dust = { x: number; y: number; r: number; a: number; vx: number; vy: number; tw: number };
    const dust: Dust[] = [];

    function resize() {
      const rect = canvas.parentElement?.getBoundingClientRect();
      width = Math.floor(rect?.width || window.innerWidth);
      height = Math.floor(rect?.height || window.innerHeight);
      dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function init() {
      dust.length = 0;
      const n = prefersReduced ? Math.max(25, Math.floor(count * 0.35)) : count;
      for (let i = 0; i < n; i++) {
        dust.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 1.4 + 0.3,
          a: Math.random() * maxAlpha,
          vx: (Math.random() - 0.5) * 0.05,
          vy: -0.06 - Math.random() * 0.12,
          tw: Math.random() * Math.PI * 2, // twinkle phase
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      for (const p of dust) {
        // move
        p.x += p.vx;
        p.y += prefersReduced ? 0 : p.vy;
        if (p.y < -4) {
          p.y = height + 2;
          p.x = Math.random() * width;
        }
        p.tw += 0.01;
        const alpha = Math.max(0, Math.min(maxAlpha, p.a * (0.7 + 0.3 * Math.sin(p.tw))));
        ctx.fillStyle = rgba(color, alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function loop() {
      draw();
      if (!prefersReduced) rafRef.current = requestAnimationFrame(loop);
    }

    const onResize = () => { resize(); init(); };
    resize();
    init();
    if (!prefersReduced) rafRef.current = requestAnimationFrame(loop); else draw();
    window.addEventListener("resize", onResize);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, [count, color, maxAlpha]);

  return <canvas ref={ref} className={className} aria-hidden />;
}

function rgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
}

function hexToRgb(hex: string) {
  const s = hex.replace("#", "");
  const bigint = parseInt(s.length === 3 ? s.split("").map((c) => c + c).join("") : s, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}
