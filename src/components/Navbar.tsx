import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";

export default function Navbar() {
  return (
    <header className="absolute inset-x-0 top-4 z-30">
      <div className="mx-auto max-w-6xl px-4 h-20 relative">
        {/* Logo left */}
        <a
          href="#"
          className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-xl tracking-tight select-none transition-opacity hover:opacity-90"
        >
          Issue<span className="text-orange-600">Hive</span><span className="text-orange-600">.</span>
        </a>

        {/* Center floating pill nav */}
        <div className="hidden md:flex items-center gap-7 text-sm bg-white/90 backdrop-blur border shadow-sm rounded-full px-5 py-2.5 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-shadow hover:shadow-md">
          <a href="#about" className="relative text-muted-foreground hover:text-foreground transition-colors after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-px after:w-full after:scale-x-0 after:bg-current after:opacity-40 after:transition-transform after:duration-200 hover:after:scale-x-100">About</a>
          <a href="#docs" className="relative text-muted-foreground hover:text-foreground transition-colors after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-px after:w-full after:scale-x-0 after:bg-current after:opacity-40 after:transition-transform after:duration-200 hover:after:scale-x-100">Docs</a>
          <a href="#transparency" className="relative text-muted-foreground hover:text-foreground transition-colors after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-px after:w-full after:scale-x-0 after:bg-current after:opacity-40 after:transition-transform after:duration-200 hover:after:scale-x-100">Transparency</a>
          <a href="#news" className="relative text-muted-foreground hover:text-foreground transition-colors after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-px after:w-full after:scale-x-0 after:bg-current after:opacity-40 after:transition-transform after:duration-200 hover:after:scale-x-100">News</a>
          <a href="#issues" className="ml-1">
            <Button className="group h-9 rounded-full px-4 bg-black text-white hover:bg-black/90 transition-transform">
              Launch App <ArrowUpRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </a>
        </div>
      </div>
    </header>
  );
}
