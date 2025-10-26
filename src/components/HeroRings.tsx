export default function HeroRings() {
  // Decorative concentric rings with adjusted radii and a more pronounced orange arc
  const cx = 560; // slightly left-of-center for composition
  const cy = 420;
  const rings = [260, 360, 480, 620, 760];
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden
      viewBox="0 0 1440 860"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="arc" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="rgba(255,98,0,0)" />
          <stop offset="100%" stopColor="rgba(255,98,0,0.6)" />
        </linearGradient>
      </defs>
      {rings.map((r, i) => (
        <circle
          key={r}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={i % 2 === 0 ? "#e7e5e4" : "#ececec"}
          strokeOpacity={0.7}
          strokeWidth={1}
        />
      ))}
      {/* Orange arc sweeping across the upper-left quadrant */}
      <path
        d={`M ${cx + 240} ${cy - 220} A 480 480 0 0 0 ${cx - 20} ${cy - 460}`}
        fill="none"
        stroke="url(#arc)"
        strokeWidth={3}
      />
    </svg>
  );
}
