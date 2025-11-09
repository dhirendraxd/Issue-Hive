import { useEffect, useRef } from "react";

type Props = {
  className?: string;
  count?: number;
  color?: string; // bubble color
};

// Soft floating bubbles with a gentle wobble.
export default function BubbleParticles({ className, count = 26, color = "#fbbf24" }: Props) {
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

    type Bubble = { x: number; y: number; r: number; vy: number; wob: number; phase: number; alpha: number };
    const bubbles: Bubble[] = [];

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
      bubbles.length = 0;
      const n = prefersReduced ? Math.max(8, Math.floor(count * 0.4)) : count;
      for (let i = 0; i < n; i++) {
        bubbles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          // Smaller radius for subtler orange particles
          r: 4 + Math.random() * 8,
          vy: -0.12 - Math.random() * 0.2,
          wob: 6 + Math.random() * 10,
          phase: Math.random() * Math.PI * 2,
          // Slightly lower alpha for a softer look
          alpha: 0.08 + Math.random() * 0.12,
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      for (const b of bubbles) {
        // move
        const wobbleX = Math.sin(b.phase) * (prefersReduced ? 0 : b.wob) * 0.05;
        b.phase += 0.01;
        b.y += prefersReduced ? 0 : b.vy;
        b.x += wobbleX;
        if (b.y < -b.r) {
          b.y = height + b.r;
          b.x = Math.random() * width;
        }
        // draw bubble with soft edge using globalAlpha
        ctx.fillStyle = rgba(color, b.alpha);
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
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
  }, [count, color]);

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
