import { useMemo } from "react";
import ParticlesBackground from "@/components/ParticlesBackground";
import { Button } from "@/components/ui/button";
import { Wrench, Coffee, Sparkles, Home, AlertTriangle } from "lucide-react";

const MAINTENANCE_QUIPS = [
  "We're not broken. We're just... in character development.",
  "Currently debugging. Translation: crying and recompiling.",
  "Our servers are taking a mental health day.",
  "Error 503: Developers still learning how to code.",
  "Be back soon! (We hope. No promises.)",
  "Maintenance mode: Engaged. Panic mode: Also engaged.",
  "Currently under construction. Like our self-esteem.",
  "The hamsters need a break. They've earned it.",
  "We're experiencing technical difficulties. Aka: Tuesday.",
  "Scheduled maintenance. Unscheduled chaos.",
];

const MAINTENANCE_DETAILS = [
  "We're making things better. Or at least trying not to make them worse.",
  "Probably adding bugs while fixing bugs. It's the circle of life.",
  "Our DevOps team is arguing about semicolons.",
  "Expected downtime: 30 minutes. Actual downtime: Ask us later.",
  "We're basically performing open-heart surgery on a live system. What could go wrong?",
  "This is what happens when you push to production on a Friday.",
  "The good news: We know what's wrong. The bad news: Everything else.",
];

const Maintenance = () => {
  const quip = useMemo(() => MAINTENANCE_QUIPS[Math.floor(Math.random() * MAINTENANCE_QUIPS.length)], []);
  const detail = useMemo(() => MAINTENANCE_DETAILS[Math.floor(Math.random() * MAINTENANCE_DETAILS.length)], []);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-stone-50 relative overflow-hidden animate-in fade-in duration-500">
      <ParticlesBackground fullPage hexOpacity={0.08}>
        <div className="absolute inset-0 pointer-events-none opacity-30" aria-hidden>
          <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-orange-400/30 via-amber-400/20 to-yellow-400/20 blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/3 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-red-400/20 via-orange-400/20 to-amber-400/30 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative z-10 min-h-[100svh] max-w-3xl mx-auto px-5 sm:px-8 flex items-center justify-center text-center">
          <div className="w-full">
            {/* Animated Icon */}
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 shadow-2xl mb-6 animate-bounce">
              <Wrench className="h-12 w-12 text-white" />
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50/80 backdrop-blur-xl px-4 py-2 text-xs font-semibold text-orange-700 shadow-sm mb-4">
              <AlertTriangle className="h-3.5 w-3.5" />
              Scheduled Maintenance
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl sm:text-7xl font-display font-bold tracking-tight mb-4 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 bg-clip-text text-transparent">
              We'll Bee Right Back
            </h1>

            {/* Sarcastic Quip */}
            <p className="text-lg sm:text-xl text-muted-foreground font-medium mb-2">
              {quip}
            </p>

            {/* Details */}
            <p className="text-sm sm:text-base text-muted-foreground/80 mb-3">
              {detail}
            </p>

            {/* Timeline (fake, for dramatic effect) */}
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground/70 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 border border-white/80 mb-8">
              <Coffee className="h-3.5 w-3.5" />
              Estimated downtime: Until we fix it
            </div>

            {/* What You Can Do */}
            <div className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-2xl p-6 sm:p-8 shadow-xl mb-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                While You Wait...
              </h2>
              <div className="space-y-3 text-sm text-muted-foreground text-left max-w-md mx-auto">
                <div className="flex items-start gap-3">
                  <span className="text-orange-500 font-bold">☕</span>
                  <span>Grab a coffee. Or five. This might take a while.</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-orange-500 font-bold">🐝</span>
                  <span>Google "why are bees disappearing" and get existential.</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-orange-500 font-bold">💻</span>
                  <span>Refresh this page obsessively. We get it.</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-orange-500 font-bold">🎮</span>
                  <span>Play tic-tac-toe on paper like it's 1999.</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-orange-500 font-bold">📱</span>
                  <span>Check Twitter to see if everyone else is also panicking.</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button 
                onClick={() => location.reload()} 
                className="rounded-full px-6 h-11 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg"
              >
                <Wrench className="h-4 w-4 mr-2" /> 
                Refresh (Worth a Shot)
              </Button>
              <Button 
                variant="outline" 
                onClick={() => location.href = '/'} 
                className="rounded-full px-6 h-11 border-2"
              >
                <Home className="h-4 w-4 mr-2" /> 
                Go Home Anyway
              </Button>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-6 border-t border-white/40">
              <p className="text-xs text-muted-foreground/70 italic">
                "Maintenance is just a fancy word for 'we broke something and are frantically fixing it.'"
                <br />
                — Ancient Developer Proverb
              </p>
            </div>
          </div>
        </div>
      </ParticlesBackground>
    </div>
  );
};

export default Maintenance;
