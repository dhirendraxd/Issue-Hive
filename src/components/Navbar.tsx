import { Button } from "@/components/ui/button";

export default function Navbar() {
  return (
    <header className="absolute inset-x-0 top-4 z-30">
      <div className="mx-auto max-w-6xl px-4 h-20 relative">
        {/* Logo left */}
        <a
          href="#"
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
        </a>

        {/* Center floating pill nav */}
        <nav aria-label="Primary" className="hidden md:flex items-center gap-8 text-sm bg-white/95 backdrop-blur border shadow-sm rounded-full px-6 py-2.5 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <a href="#about" className="uppercase font-medium text-black/80 hover:text-orange-500 transition-colors">About</a>
          <a href="#docs" className="uppercase font-medium text-black/80 hover:text-orange-500 transition-colors">Docs</a>
          <a href="#transparency" className="uppercase font-medium text-black/80 hover:text-orange-500 transition-colors">Transparency</a>
          <a href="#news" className="uppercase font-medium text-black/80 hover:text-orange-500 transition-colors">News</a>
          <a href="#features" className="ml-1">
            <Button aria-label="Launch App" className="group h-9 rounded-full px-5 bg-black text-white hover:bg-orange-500 transition-colors uppercase font-medium tracking-wide text-[13px]">
              Launch App
            </Button>
          </a>
        </nav>

        {/* Mobile quick action */}
        <div className="md:hidden absolute right-4 top-1/2 -translate-y-1/2">
          <a href="#features">
            <Button aria-label="Launch App" className="h-9 rounded-full px-5 bg-black text-white hover:bg-orange-500 transition-colors uppercase font-medium tracking-wide text-[13px]">
              Launch App
            </Button>
          </a>
        </div>
      </div>
    </header>
  );
}
