import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="absolute inset-x-0 top-4 z-30">
      <div className="mx-auto max-w-6xl px-4 h-20 relative">
        {/* Logo left */}
        <Link
          to="/"
          className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 font-semibold text-xl tracking-tight select-none transition-opacity hover:opacity-90"
        >
          <img
            src="/beehive-honey-svgrepo-com.svg"
            alt="IssueHive logo"
            className="h-9 w-9 md:h-10 md:w-10"
            loading="eager"
            decoding="async"
          />
          <span>
            Issue<span className="text-orange-500">Hive</span>
          </span>
        </Link>

        {/* Center floating pill nav */}
        <nav aria-label="Primary" className="hidden md:flex items-center gap-8 text-sm bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg rounded-full px-6 py-2.5 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Link to="/" className="uppercase font-medium text-black/80 hover:text-orange-500 transition-colors">Home</Link>
          <Link to="/about" className="uppercase font-medium text-black/80 hover:text-orange-500 transition-colors">About</Link>
          <Link to="/issues" className="uppercase font-medium text-black/80 hover:text-orange-500 transition-colors">Issues</Link>
          <Link to="/issues" className="ml-1">
            <Button aria-label="Join Now" className="h-9 rounded-full px-4 bg-black text-white hover:bg-orange-500 transition-colors uppercase font-medium tracking-wide text-[13px]">
              Join Now
            </Button>
          </Link>
        </nav>

        {/* Mobile quick action */}
        <div className="md:hidden absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
          <Link to="/issues">
            <Button aria-label="Join Now" className="h-9 rounded-full px-3 bg-black text-white hover:bg-orange-500 transition-colors uppercase font-medium tracking-wide text-[12px]">
              Join Now
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
