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
import { LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { signOut } from "@/integrations/firebase/auth";
import { useState } from "react";

export default function Navbar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { user } = useAuth();
  const avatarUrl = useAvatarUrl(user?.photoURL, user?.uid || '');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isActive = (path: string) => {
    return currentPath === path;
  };

  return (
    <header className="absolute inset-x-0 top-4 z-30">
      <div className="mx-auto max-w-6xl px-4 h-16 md:h-20 relative flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 font-display font-semibold text-lg md:text-xl tracking-tight select-none transition-opacity hover:opacity-90"
          onClick={() => setMobileMenuOpen(false)}
        >
          <img
            src="/beehive-honey-svgrepo-com.svg"
            alt="IssueHive Logo"
            className="h-8 w-8 md:h-10 md:w-10"
          />
          <span className="hidden xs:inline">IssueHive</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
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

        {/* Right side: Auth + Mobile Menu Toggle */}
        <div className="flex items-center gap-3">
          {user ? (
            <Link to="/dashboard" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-full">
              <Avatar className="h-8 w-8 md:h-9 md:w-9 border-2 border-orange-500 hover:border-orange-400 transition-colors cursor-pointer">
                <AvatarImage src={avatarUrl} alt={user.displayName || user.email || 'User'} />
                <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-500 text-white font-semibold">
                  <img src={getUserAvatarUrl(user.uid)} alt="" className="w-full h-full" />
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Link to="/auth" className="hidden md:inline-block">
              <Button className="rounded-full px-4 bg-black text-white hover:bg-orange-500 transition-colors font-medium text-sm">
                Join Now
              </Button>
            </Link>
          )}
          
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-black/5 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 mt-2 mx-4 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
          <nav className="flex flex-col p-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                isActive('/') 
                  ? 'bg-orange-500 text-white' 
                  : 'text-black/70 hover:bg-gray-100'
              }`}
            >
              Home
            </Link>
            <Link
              to="/issues"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                isActive('/issues')
                  ? 'bg-orange-500 text-white'
                  : 'text-black/70 hover:bg-gray-100'
              }`}
            >
              Issues
            </Link>
            <Link
              to="/raise-issue"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                isActive('/raise-issue')
                  ? 'bg-orange-500 text-white'
                  : 'text-black/70 hover:bg-gray-100'
              }`}
            >
              Raise Issue
            </Link>
            {!user && (
              <Link
                to="/auth"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2"
              >
                <Button className="w-full rounded-full bg-black text-white hover:bg-orange-500 transition-colors font-medium">
                  Join Now
                </Button>
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
