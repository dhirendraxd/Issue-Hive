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
      <HiveHexParticles className={cn("absolute inset-0 z-0 pointer-events-none", hexClassName)} />
      <CommunityNodes className={cn("absolute inset-0 z-0 pointer-events-none", nodesClassName)} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
