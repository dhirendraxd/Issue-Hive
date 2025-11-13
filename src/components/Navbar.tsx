import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getUserAvatarUrl } from "@/lib/avatar";
import { LayoutDashboard, LogOut } from "lucide-react";
import { signOut } from "@/integrations/firebase/auth";

export default function Navbar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { user } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  return (
    <header className="absolute inset-x-0 top-4 z-30">
      <div className="mx-auto max-w-6xl px-4 h-20 relative flex items-center justify-between">
        {/* Logo left */}
        <Link
          to="/"
          className="flex items-center gap-2 font-display font-semibold text-xl tracking-tight select-none transition-opacity hover:opacity-90"
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
            currentPath === '/' ? (
              <button
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-full"
                onClick={() => window.location.assign('/dashboard')}
              >
                <Avatar className="h-9 w-9 border-2 border-orange-500 hover:border-orange-400 transition-colors cursor-pointer">
                  <AvatarImage src={user.photoURL || getUserAvatarUrl(user.uid)} alt={user.displayName || user.email || 'User'} />
                  <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-500 text-white font-semibold">
                    <img src={getUserAvatarUrl(user.uid)} alt="" className="w-full h-full" />
                  </AvatarFallback>
                </Avatar>
              </button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-full">
                    <Avatar className="h-9 w-9 border-2 border-orange-500 hover:border-orange-400 transition-colors cursor-pointer">
                      <AvatarImage src={user.photoURL || getUserAvatarUrl(user.uid)} alt={user.displayName || user.email || 'User'} />
                      <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-500 text-white font-semibold">
                        <img src={getUserAvatarUrl(user.uid)} alt="" className="w-full h-full" />
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white/95 backdrop-blur-lg border border-white/40">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.displayName || 'IssueHive User'}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-full">
                  <Avatar className="h-9 w-9 border-2 border-orange-500 hover:border-orange-400 transition-colors cursor-pointer">
                    <AvatarImage src={user.photoURL || getUserAvatarUrl(user.uid)} alt={user.displayName || user.email || 'User'} />
                    <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-500 text-white font-semibold">
                      <img src={getUserAvatarUrl(user.uid)} alt="" className="w-full h-full" />
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white/95 backdrop-blur-lg border border-white/40">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName || 'IssueHive User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
