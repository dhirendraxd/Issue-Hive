import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import HiveHexParticles from "@/components/HiveHexParticles";
import CommunityNodes from "@/components/CommunityNodes";

type Props = {
  className?: string;
  children: ReactNode;
  // Optional overrides for future tuning
  hexClassName?: string;
  nodesClassName?: string;
  /**
   * When true, extends the vertical fade further down the page so background comb effect
   * gently dissipates near the footer. Useful for full-page sections (e.g. forms, dashboards).
   */
  longFade?: boolean;
  /**
   * When true, covers the entire page with comb effect (no fade mask).
   * Uses soft edges via reduced opacity. Ideal for non-homepage content pages.
   */
  fullPage?: boolean;
  /**
   * Adjust opacity of hex grid for subtle vs strong presence.
   */
  hexOpacity?: number;
};

export default function ParticlesBackground({ className, children, hexClassName, nodesClassName, longFade = false, fullPage = false, hexOpacity = 0.15 }: Props) {
  return (
    <div className={cn("relative", className)}>
      {/* Backgrounds wrapped in a masked container to fade toward the bottom */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={
          fullPage
            ? undefined // No mask for full-page coverage
            : {
                WebkitMaskImage: longFade
                  ? "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 82%, rgba(0,0,0,0) 100%)"
                  : "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 72%, rgba(0,0,0,0) 100%)",
                maskImage: longFade
                  ? "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 82%, rgba(0,0,0,0) 100%)"
                  : "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 72%, rgba(0,0,0,0) 100%)",
              }
        }
      >
        <HiveHexParticles className={cn("absolute inset-0", hexClassName)} opacity={hexOpacity} />
        <CommunityNodes className={cn("absolute inset-0", nodesClassName)} />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
