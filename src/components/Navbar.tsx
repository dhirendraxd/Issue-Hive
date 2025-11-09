import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Navbar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { user } = useAuth();

  return (
    <header className="absolute inset-x-0 top-4 z-30">
      <div className="mx-auto max-w-6xl px-4 h-20 relative flex items-center justify-between">
        {/* Logo left */}
        <Link
          to="/"
          className="flex items-center gap-2 font-semibold text-xl tracking-tight select-none transition-opacity hover:opacity-90"
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

        {/* Right side nav */}
  <nav aria-label="Primary" className="hidden md:flex items-center gap-8 text-sm">
          {currentPath !== "/" && (
            <Link to="/" className="uppercase font-medium text-black/80 hover:text-orange-500 transition-colors">Home</Link>
          )}
          {currentPath !== "/about" && (
            <Link to="/about" className="uppercase font-medium text-black/80 hover:text-orange-500 transition-colors">About</Link>
          )}
          {currentPath !== "/issues" && (
            <Link to="/issues" className="uppercase font-medium text-black/80 hover:text-orange-500 transition-colors">Issues</Link>
          )}
          {currentPath !== "/raise-issue" && (
            <Link to="/raise-issue" className="uppercase font-medium text-black/80 hover:text-orange-500 transition-colors">Raise Issue</Link>
          )}
          
          {user ? (
            <Link to="/dashboard">
              <Avatar className="h-9 w-9 border-2 border-orange-500 hover:border-orange-400 transition-colors cursor-pointer">
                <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
                <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-500 text-white font-semibold">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Link to="/auth">
              <Button aria-label="Join Now" className="h-9 rounded-full px-4 bg-black text-white hover:bg-orange-400/90 transition-colors uppercase font-medium tracking-wide text-[13px]">
                Join Now
              </Button>
            </Link>
          )}
        </nav>

        {/* Mobile quick action */}
  <div className="md:hidden flex items-center gap-2">
          {user ? (
            <Link to="/dashboard">
              <Avatar className="h-9 w-9 border-2 border-orange-500 hover:border-orange-400 transition-colors cursor-pointer">
                <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
                <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-500 text-white font-semibold">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Link to="/auth">
              <Button aria-label="Join Now" className="h-9 rounded-full px-3 bg-black text-white hover:bg-orange-400/90 transition-colors uppercase font-medium tracking-wide text-[12px]">
                Join Now
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
