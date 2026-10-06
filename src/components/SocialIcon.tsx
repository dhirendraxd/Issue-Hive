type SocialPlatform = "github" | "x" | "linkedin" | "instagram" | "google";

const icons: Record<SocialPlatform, string> = {
  github: "https://svgl.app/library/github_light.svg",
  x: "https://svgl.app/library/x.svg",
  linkedin: "https://svgl.app/library/linkedin.svg",
  instagram: "https://svgl.app/library/instagram-icon.svg",
  google: "https://svgl.app/library/google.svg",
};

interface SocialIconProps {
  platform: SocialPlatform;
  className?: string;
}

export default function SocialIcon({ platform, className = "h-4 w-4" }: SocialIconProps) {
  return (
    <img
      src={icons[platform]}
      alt=""
      aria-hidden="true"
      width={16}
      height={16}
      className={`shrink-0 object-contain ${className}`}
    />
  );
}
