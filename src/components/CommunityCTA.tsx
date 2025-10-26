import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Twitter, Linkedin, Send, MessageCircle, Mail } from "lucide-react";

export default function CommunityCTA() {
  const items = [
    { icon: Twitter, label: "X (Twitter)", href: "#" },
    { icon: Linkedin, label: "LinkedIn", href: "#" },
    { icon: Send, label: "Telegram", href: "#" },
    { icon: MessageCircle, label: "Discord", href: "#" },
    { icon: Mail, label: "Email", href: "#" },
  ];

  return (
    <section className="px-4 py-12">
      <Card className="mx-auto max-w-5xl bg-white/90">
        <div className="px-6 py-8 text-center">
          <h3 className="text-xl md:text-2xl font-semibold">
            Join the <span className="text-orange-600">IssueHive</span> Community
          </h3>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-5 gap-4">
            {items.map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl"
              >
                <div className="rounded-xl border bg-muted/30 p-6 text-center hover:bg-muted/50 transition-colors">
                  <Icon className="mx-auto h-6 w-6" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </Card>
    </section>
  );
}
