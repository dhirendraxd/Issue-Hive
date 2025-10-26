import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";

export default function Navbar() {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto max-w-6xl px-4 h-16 relative">
        {/* Logo left */}
        <a
          href="#"
          className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-xl tracking-tight select-none"
        >
          Issue<span className="text-orange-600">Hive</span><span className="text-orange-600">.</span>
        </a>

        {/* Center floating pill nav */}
        <div className="hidden md:flex items-center gap-6 text-sm bg-white/90 backdrop-blur border shadow-sm rounded-full px-4 py-2 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <a href="#about" className="hover:text-foreground text-muted-foreground">About</a>
          <a href="#docs" className="hover:text-foreground text-muted-foreground">Docs</a>
          <a href="#transparency" className="hover:text-foreground text-muted-foreground">Transparency</a>
          <a href="#news" className="hover:text-foreground text-muted-foreground">News</a>
          <a href="#issues" className="ml-1">
            <Button className="h-8 rounded-full px-3 bg-black text-white hover:bg-black/90">
              Launch App <ArrowUpRight className="ml-1 h-3 w-3" />
            </Button>
          </a>
        </div>
      </div>
    </header>
  );
}
