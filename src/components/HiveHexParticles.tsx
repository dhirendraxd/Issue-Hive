import { useEffect, useRef } from "react";

type Props = {
  className?: string;
  density?: number; // smaller = denser grid (pixel spacing between centers)
  color?: string; // stroke color
  opacity?: number; // base opacity
};

// Canvas-based subtle animated hexagon grid backdrop.
export default function HiveHexParticles({ className, density = 48, color = "#fb923c", opacity = 0.08 }: Props) {
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

    // Hexagon spacing & grid
    const spacing = Math.max(28, density); // clamp reasonable
    const hexR = spacing / Math.sqrt(3); // radius for pointy-top hexes

    const centers: { x: number; y: number; phase: number }[] = [];

    function resize() {
      const rect = canvas.parentElement?.getBoundingClientRect();
      width = Math.floor((rect?.width || window.innerWidth));
      height = Math.floor((rect?.height || window.innerHeight));
      dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Build hex centers to slightly overscan edges
      centers.length = 0;
      const horiz = spacing;
      const vert = hexR * 1.5;
      for (let y = -vert; y < height + vert; y += vert) {
        for (let x = -horiz; x < width + horiz; x += horiz) {
          const offsetX = ((Math.round(y / vert) % 2) ? horiz / 2 : 0);
          centers.push({ x: x + offsetX, y, phase: Math.random() * Math.PI * 2 });
        }
      }
    }

    function drawHex(cx: number, cy: number, r: number) {
      const a = Math.PI / 3; // 60deg
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = a * i + Math.PI / 6; // pointy-top orientation
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
    }

    function render(t: number) {
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 1;
      for (const c of centers) {
        const pulse = 0.5 + 0.5 * Math.sin(c.phase + t * 0.0007);
        const localOpacity = opacity * (0.6 + 0.4 * pulse);
        ctx.strokeStyle = hexStroke(color, localOpacity);
        drawHex(c.x, c.y, hexR);
        ctx.stroke();
      }
    }

    function loop(ts: number) {
      render(ts);
      if (!prefersReduced) rafRef.current = requestAnimationFrame(loop);
    }

    const onResize = () => resize();
    resize();
    if (!prefersReduced) rafRef.current = requestAnimationFrame(loop); else render(0);
    window.addEventListener("resize", onResize);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, [density, color, opacity]);

  return <canvas ref={ref} className={className} aria-hidden />;
}

function hexStroke(hex: string, alpha: number) {
  // Accept hex color like #fb923c and apply alpha
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
