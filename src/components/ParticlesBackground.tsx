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
};

export default function ParticlesBackground({ className, children, hexClassName, nodesClassName }: Props) {
  return (
    <div className={cn("relative", className)}>
      {/* Backgrounds wrapped in a masked container to fade toward the bottom */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          WebkitMaskImage:
            "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 72%, rgba(0,0,0,0) 100%)",
          maskImage:
            "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 72%, rgba(0,0,0,0) 100%)",
        }}
      >
        <HiveHexParticles className={cn("absolute inset-0", hexClassName)} />
        <CommunityNodes className={cn("absolute inset-0", nodesClassName)} />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
