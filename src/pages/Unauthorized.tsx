import { useMemo } from "react";
import ParticlesBackground from "@/components/ParticlesBackground";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ShieldOff, Home, LogIn, ArrowLeft, Lock } from "lucide-react";

const UNAUTHORIZED_QUIPS = [
  "Nice try, hacker extraordinaire.",
  "401: You're not on the list.",
  "Access denied. It's not personal. (It might be.)",
  "This page requires credentials. Crying doesn't count.",
  "Unauthorized. Like showing up to a party uninvited.",
  "Sorry, this is a members-only treehouse.",
  "You shall not pass! (Wrong password, Gandalf.)",
  "Error 401: This isn't the page you're looking for.",
  "Locked out like you forgot your dorm key at 2 AM.",
  "Authorization required. Begging optional.",
];

const SUBTEXT = [
  "You need to be logged in to view this page. It's exclusive like that.",
  "This content is for registered bees only. Buzz off... then buzz back in.",
  "Login required. We promise it's worth the effort. (Maybe.)",
  "Sign in to unlock this page. Or just accept defeat.",
  "This page is VIP only. Very Important Page-viewers.",
  "Looks like you need an account for this one. Time to commit.",
];

const Unauthorized = () => {
  const quip = useMemo(() => UNAUTHORIZED_QUIPS[Math.floor(Math.random() * UNAUTHORIZED_QUIPS.length)], []);
  const subtext = useMemo(() => SUBTEXT[Math.floor(Math.random() * SUBTEXT.length)], []);
  
  return (
    <div className="min-h-screen bg-stone-50 relative overflow-hidden animate-in fade-in duration-300">
      <ParticlesBackground fullPage hexOpacity={0.10}>
        <div className="absolute inset-0 pointer-events-none opacity-40" aria-hidden>
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-gradient-to-br from-red-500/25 via-orange-500/15 to-amber-500/20 blur-3xl" />
        </div>

        {/* Logo */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
          <Link to="/" className="flex items-center gap-2 font-semibold text-lg sm:text-xl tracking-tight">
            <img src="/beehive-honey-svgrepo-com.svg" alt="IssueHive" className="h-8 w-8 sm:h-9 sm:w-9" />
            <span>Issue<span className="text-orange-500">Hive</span></span>
          </Link>
        </div>

        <div className="relative z-10 min-h-[100svh] max-w-2xl mx-auto px-5 sm:px-8 flex items-center justify-center text-center">
          <div className="w-full">
            {/* Lock Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-100 to-orange-100 shadow-lg mb-4">
              <ShieldOff className="h-10 w-10 text-red-600" />
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50/80 backdrop-blur-xl px-3 py-1 text-[11px] font-semibold text-red-700 shadow-sm mb-3">
              <Lock className="h-3.5 w-3.5" />
              401 Unauthorized
            </div>

            {/* Heading */}
            <h1 className="text-5xl sm:text-6xl font-display font-semibold tracking-tight mb-3">
              Access Denied
            </h1>
            
            {/* Quip */}
            <p className="text-base sm:text-lg text-muted-foreground font-medium mb-2">
              {quip}
            </p>

            {/* Subtext */}
            <p className="text-sm sm:text-base text-muted-foreground/80 mb-8">
              {subtext}
            </p>

            {/* Info Box */}
            <div className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-xl p-5 shadow-lg mb-8 text-left max-w-md mx-auto">
              <h3 className="font-semibold text-sm mb-3 text-center">Why is this happening?</h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold mt-0.5">•</span>
                  <span>You're not logged in (oops)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold mt-0.5">•</span>
                  <span>You don't have permission to view this content</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold mt-0.5">•</span>
                  <span>Your session expired (it happens to the best of us)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold mt-0.5">•</span>
                  <span>You're trying to access someone else's private stuff</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col xs:flex-row items-center justify-center gap-2.5">
              <Link to="/auth">
                <Button className="rounded-full px-5 h-10 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md">
                  <LogIn className="h-4 w-4 mr-2" /> Sign In
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={() => window.history.back()}
                className="rounded-full px-5 h-10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
              </Button>
              <Link to="/">
                <Button variant="ghost" className="rounded-full px-5 h-10">
                  <Home className="h-4 w-4 mr-2" /> Home
                </Button>
              </Link>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-6 border-t border-white/40">
              <p className="text-[10px] text-muted-foreground/60 italic">
                "The only thing standing between you and this content is a login button."
                <br />
                (Dramatic, we know.)
              </p>
            </div>
          </div>
        </div>
      </ParticlesBackground>
    </div>
  );
};

export default Unauthorized;
