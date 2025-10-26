import { useEffect, useRef } from "react";

type Props = {
  className?: string;
  count?: number;
  color?: string; // node color
  linkColor?: string; // line color
};

export default function CommunityNodes({ className, count = 42, color = "#fef3c7", linkColor = "#fb923c" }: Props) {
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

    type Node = { x: number; y: number; vx: number; vy: number; r: number };
    const nodes: Node[] = [];

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

    function initNodes() {
      nodes.length = 0;
      const n = prefersReduced ? Math.max(12, Math.floor(count * 0.4)) : count;
      for (let i = 0; i < n; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          r: 1.2 + Math.random() * 1.8,
        });
      }
    }

    function step() {
      ctx.clearRect(0, 0, width, height);
      // Links first
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist2 = dx * dx + dy * dy;
          const max = 120; // px
          if (dist2 < max * max) {
            const dist = Math.sqrt(dist2);
            const alpha = Math.max(0, 1 - dist / max) * 0.15;
            ctx.strokeStyle = rgba(linkColor, alpha);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Nodes
      for (const p of nodes) {
        // move
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // draw
        ctx.fillStyle = rgba(color, 0.9);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function loop() {
      step();
      if (!prefersReduced) rafRef.current = requestAnimationFrame(loop);
    }

    const onResize = () => {
      resize();
      initNodes();
    };

    resize();
    initNodes();
    if (!prefersReduced) rafRef.current = requestAnimationFrame(loop); else step();
    window.addEventListener("resize", onResize);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, [count, color, linkColor]);

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
