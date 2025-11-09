export default function HeroRings() {
  // Decorative concentric rings with adjusted radii and a more pronounced orange arc
  const cx = 560; // slightly left-of-center for composition
  const cy = 480;
  const rings = [260, 360, 480, 620, 760];
  const movingRadius = 480; // align animated ring with one of the rings
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden
      viewBox="0 0 1440 860"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        {/* Gradient band for the moving orange color around the ring */}
        <linearGradient
          id="ringSweep"
          gradientUnits="userSpaceOnUse"
          x1={cx - movingRadius}
          y1={cy}
          x2={cx + movingRadius}
          y2={cy}
        >
          {/* Narrow highlight band: short bright window around 50% */}
          <stop offset="0%" stopColor="rgba(228, 219, 214, 0)" />
          <stop offset="47%" stopColor="rgba(255,98,0,0)" />
          <stop offset="50%" stopColor="rgba(255,98,0,0.95)" />
          <stop offset="53%" stopColor="rgba(149, 120, 101, 0)" />
          <stop offset="100%" stopColor="rgba(255,98,0,0)" />
        </linearGradient>

        {/* Soft glow for the outer moving ring */}
        <filter id="ringGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {rings.map((r, i) => (
        <circle
          key={r}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={i % 2 === 0 ? "#634f4414" : "#dda22a7a"}
          strokeOpacity={0.7}
          strokeWidth={1}
        />
      ))}
      {/* Single static highlight ring (no motion), shorter band */}
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={movingRadius - 4}
          fill="none"
          stroke="url(#ringSweep)"
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.85}
        />
      </g>
    </svg>
  );
}
