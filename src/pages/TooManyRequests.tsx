import { useMemo } from "react";
import ParticlesBackground from "@/components/ParticlesBackground";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Zap, Home, Timer, Coffee, TrendingDown } from "lucide-react";

const RATE_LIMIT_QUIPS = [
  "Whoa there, speed racer.",
  "Error 429: Chill out, maybe?",
  "You're clicking faster than our servers can handle.",
  "Slow your roll. The internet isn't going anywhere.",
  "Too many requests. Even bees need a break.",
  "Rate limit exceeded. Translation: Take a breather.",
  "Your enthusiasm is appreciated but overwhelming.",
  "Easy there, tiger. Rome wasn't built in a refresh.",
  "You're doing too much. Like, way too much.",
  "This isn't a speed-running competition.",
];

const SUGGESTIONS = [
  "Touch grass. Seriously, it helps.",
  "Pet a dog. Or a cat. Or a bee (don't actually).",
  "Make some tea. Earl Grey. Hot.",
  "Do some stretches. Your back is probably screaming.",
  "Blink 20 times. Your eyes are crying digital tears.",
  "Take a walk. Your chair misses you when you're gone.",
];

const TooManyRequests = () => {
  const quip = useMemo(() => RATE_LIMIT_QUIPS[Math.floor(Math.random() * RATE_LIMIT_QUIPS.length)], []);
  const suggestion = useMemo(() => SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)], []);
  
  // Countdown timer (cosmetic, for effect)
  const [timeLeft, setTimeLeft] = React.useState(60);
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(t => t > 0 ? t - 1 : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 relative overflow-hidden animate-in fade-in duration-300">
      <ParticlesBackground fullPage hexOpacity={0.08}>
        <div className="absolute inset-0 pointer-events-none opacity-30" aria-hidden>
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-yellow-400/30 via-orange-400/20 to-red-400/25 blur-3xl animate-pulse" />
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
            {/* Speed Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-100 to-orange-100 shadow-lg mb-4 animate-pulse">
              <TrendingDown className="h-10 w-10 text-orange-600" />
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50/80 backdrop-blur-xl px-3 py-1 text-[11px] font-semibold text-orange-700 shadow-sm mb-3">
              <Zap className="h-3.5 w-3.5" />
              429 Too Many Requests
            </div>

            {/* Heading */}
            <h1 className="text-5xl sm:text-6xl font-display font-semibold tracking-tight mb-3">
              Slow Down There, Champ
            </h1>
            
            {/* Quip */}
            <p className="text-base sm:text-lg text-muted-foreground font-medium mb-2">
              {quip}
            </p>

            {/* Subtext */}
            <p className="text-sm sm:text-base text-muted-foreground/80 mb-6">
              You've hit our rate limit. Our servers need a moment to catch their breath.
            </p>

            {/* Countdown Timer */}
            <div className="inline-flex items-center gap-3 bg-white/70 backdrop-blur-xl border border-white/80 rounded-2xl px-6 py-4 shadow-lg mb-8">
              <Timer className="h-6 w-6 text-orange-500" />
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold">
                  Cool down period
                </div>
                <div className="text-2xl font-bold text-orange-600 tabular-nums">
                  {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </div>
              </div>
            </div>

            {/* Suggestion Box */}
            <div className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl border border-white/90 rounded-xl p-6 shadow-xl mb-8">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Coffee className="h-5 w-5 text-amber-600" />
                <h3 className="font-semibold text-base">While You Wait...</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4 italic">
                "{suggestion}"
              </p>
              <div className="space-y-2 text-xs text-muted-foreground/80">
                <p>💡 Pro tip: Refresh less, zen more</p>
                <p>⏱️ Rate limits reset automatically</p>
                <p>🧘 This is a sign to take a break</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col xs:flex-row items-center justify-center gap-2.5">
              <Button 
                onClick={() => location.reload()} 
                className="rounded-full px-5 h-10 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md"
                disabled={timeLeft > 0}
              >
                <Zap className="h-4 w-4 mr-2" /> 
                {timeLeft > 0 ? `Wait ${timeLeft}s` : 'Try Again'}
              </Button>
              <Link to="/">
                <Button variant="outline" className="rounded-full px-5 h-10">
                  <Home className="h-4 w-4 mr-2" /> Go Home
                </Button>
              </Link>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-6 border-t border-white/40">
              <p className="text-[10px] text-muted-foreground/60">
                Rate limits exist so our servers don't melt into a puddle of regret.
                <br />
                We appreciate your patience. (And your chill vibes.)
              </p>
            </div>
          </div>
        </div>
      </ParticlesBackground>
    </div>
  );
};

// Fix React import for hooks
import React from "react";

export default TooManyRequests;
