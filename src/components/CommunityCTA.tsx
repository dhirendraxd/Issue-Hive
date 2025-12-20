import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Twitter, Linkedin, Send, MessageCircle, Mail } from "lucide-react";
import type { ComponentType } from "react";

type CommunityLink = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  to?: string;
  href?: string;
};

export default function CommunityCTA() {
  const items: CommunityLink[] = [
    { icon: MessageCircle, label: "Browse issues", to: "/issues" },
    { icon: Send, label: "Raise an issue", to: "/raise-issue" },
    { icon: Linkedin, label: "Learn more", to: "/about" },
    { icon: Twitter, label: "Updates on X", href: "https://twitter.com" },
    { icon: Mail, label: "Contact", href: "mailto:support@issue-hive.com" },
  ];

  const renderItem = (item: CommunityLink) => {
    const Icon = item.icon;
    const content = (
      <>
        <div className="rounded-xl glass-subtle hover:shadow-md hover:shadow-orange-400/15 hover:border-orange-100/40 transition-all duration-300 p-6 text-center">
          <Icon className="mx-auto h-6 w-6 transition-colors group-hover:text-orange-500" />
        </div>
        <div className="mt-2 text-center text-xs text-muted-foreground transition-colors group-hover:text-orange-500">
          {item.label}
        </div>
      </>
    );

    if (item.to) {
      return (
        <Link
          key={item.label}
          to={item.to}
          className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl"
        >
          {content}
        </Link>
      );
    }

    return (
      <a
        key={item.label}
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={item.label}
        className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl"
      >
        {content}
      </a>
    );
  };

  return (
    <section className="px-4 py-12">
      <Card className="mx-auto max-w-5xl glass-card">
        <div className="px-6 py-8 text-center">
          <h3 className="text-xl md:text-2xl font-display font-semibold">
            Join the <span className="text-orange-600">IssueHive</span> Community
          </h3>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-5 gap-4">
            {items.map(renderItem)}
          </div>
        </div>
      </Card>
    </section>
  );
}
