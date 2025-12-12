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
import { getUserAvatarUrl } from '@/lib/avatar';
import { useAvatarUrl } from '@/hooks/use-avatar-url';
import { LayoutDashboard, LogOut } from "lucide-react";
import { signOut } from "@/integrations/firebase/auth";

export default function Navbar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { user } = useAuth();
  const avatarUrl = useAvatarUrl(user?.photoURL, user?.uid || '');
  
  const isActive = (path: string) => {
    return currentPath === path;
  };

  return (
    <header className="absolute inset-x-0 top-4 z-30">
      <div className="mx-auto max-w-6xl px-4 h-20 relative flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 font-display font-semibold text-xl tracking-tight select-none transition-opacity hover:opacity-90"
        >
          <img
            src="/beehive-honey-svgrepo-com.svg"
            alt="IssueHive Logo"
            className="h-10 w-10"
          />
          IssueHive
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-8">
          <Link
            to="/"
            className={`font-medium transition-colors ${
              isActive('/') 
                ? 'text-black border-b-2 border-orange-500' 
                : 'text-black/70 hover:text-black'
            }`}
          >
            Home
          </Link>
          <Link
            to="/issues"
            className={`font-medium transition-colors ${
              isActive('/issues')
                ? 'text-black border-b-2 border-orange-500'
                : 'text-black/70 hover:text-black'
            }`}
          >
            Issues
          </Link>
          <Link
            to="/raise-issue"
            className={`font-medium transition-colors ${
              isActive('/raise-issue')
                ? 'text-black border-b-2 border-orange-500'
                : 'text-black/70 hover:text-black'
            }`}
          >
            Raise Issue
          </Link>
        </nav>

        {/* Right side: Auth */}
        <div className="flex items-center gap-4">
          {user ? (
            <Link to="/dashboard" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-full">
              <Avatar className="h-9 w-9 border-2 border-orange-500 hover:border-orange-400 transition-colors cursor-pointer">
                <AvatarImage src={avatarUrl} alt={user.displayName || user.email || 'User'} />
                <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-500 text-white font-semibold">
                  <img src={getUserAvatarUrl(user.uid)} alt="" className="w-full h-full" />
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Link to="/auth">
              <Button className="rounded-full px-4 bg-black text-white hover:bg-orange-500 transition-colors font-medium text-sm">
                Join Now
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
