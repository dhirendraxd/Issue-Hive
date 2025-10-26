import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import HiveHexParticles from "@/components/HiveHexParticles";
import CommunityNodes from "@/components/CommunityNodes";
import { useIssues } from "@/hooks/use-issues";
import { ISSUE_STATUSES } from "@/types/issue";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ThumbsUp } from "lucide-react";

export default function Issues() {
  const { data: issues = [], upvote } = useIssues();

  // Filter to show only 'in_progress' and 'resolved' issues
  const filteredIssues = issues.filter((i) => i.status === "in_progress" || i.status === "resolved");

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "received":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "in_progress":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "resolved":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <main className="relative px-4 md:px-6 pt-32 pb-24">
        {/* Background decorative layers for Issues page */}
        <HiveHexParticles className="absolute inset-0 z-0 pointer-events-none" />
        <CommunityNodes className="absolute inset-0 z-0 pointer-events-none" />
        <section className="mx-auto max-w-7xl">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Campus Issues</h1>
            <p className="mt-3 text-muted-foreground">Browse top issues and show support by upvoting.</p>
          </div>

          <div className="mt-8 grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredIssues.length === 0 && (
              <div className="col-span-full rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg p-8 text-center text-muted-foreground">
                No active issues. All resolved!
              </div>
            )}

            {filteredIssues.map((i) => (
              <Card key={i.id} className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg transition-all hover:bg-white/70 hover:shadow-md hover:border-orange-200/60 flex flex-col h-full">
                <CardContent className="p-6 md:p-7 flex flex-col h-full">
                  {/* Header: User Info */}
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={i.user?.avatar} alt={i.user?.name} />
                      <AvatarFallback className="bg-orange-500 text-white text-xs">
                        {getInitials(i.user?.name ?? "User")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{i.user?.name ?? "Anonymous"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(i.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Issue Title & Description */}
                  <div className="mb-4 flex-1">
                    <h3 className="text-lg font-semibold break-words leading-snug mb-2">{i.title}</h3>
                    <p className="text-sm text-muted-foreground break-words line-clamp-3">{i.description}</p>
                  </div>

                  {/* Status & Category Tags */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusColor(i.status)}`}>
                      {ISSUE_STATUSES.find((s) => s.value === i.status)?.label ?? i.status}
                    import { useMemo, useState } from "react";
                    import { ISSUE_CATEGORIES, type IssueCategory } from "@/types/issue";
                    import { Input } from "@/components/ui/input";
                    import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
                    import { ChevronDown } from "lucide-react";
                    </span>
                    <span className="inline-flex items-center rounded-full border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-50">

                      // Filters
                      const [q, setQ] = useState("");
                      const [categories, setCategories] = useState<IssueCategory[]>([]);
                      {i.category}
                    </span>
                      const baseIssues = issues.filter((i) => i.status === "in_progress" || i.status === "resolved");

                      const visibleIssues = useMemo(() => {
                        let arr = baseIssues;
                        if (categories.length > 0) {
                          arr = arr.filter((i) => categories.includes(i.category));
                        }
                        if (q.trim()) {
                          const n = q.trim().toLowerCase();
                          arr = arr.filter((i) => {
                            const title = i.title.toLowerCase();
                            const desc = i.description.toLowerCase();
                            const name = (i.user?.name || "").toLowerCase();
                            return title.includes(n) || desc.includes(n) || name.includes(n);
                          });
                        }
                        return arr;
                      }, [baseIssues, categories, q]);

                  {/* Footer: Votes & Action */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ThumbsUp className="h-4 w-4 text-orange-500" />
                      <span>{i.votes} support{i.votes !== 1 ? "s" : ""}</span>
                    </div>
                    <Button
                      onClick={() => upvote.mutate(i.id)}
                      size="sm"

                              {/* Filters: search by title/description/name + multi-category */}
                              <div className="mb-6 flex flex-col md:flex-row md:items-center gap-3 md:gap-4 justify-between relative z-10">
                                <Input
                                  value={q}
                                  onChange={(e) => setQ(e.target.value)}
                                  placeholder="Search by title, description, or name..."
                                  className="w-full md:w-80"
                                />
                                <div className="flex items-center gap-3">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="outline" className="rounded-full">
                                        {categories.length === 0 ? "All Categories" : `${categories.length} selected`} <ChevronDown className="ml-2 h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                      <DropdownMenuLabel>Categories</DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      {ISSUE_CATEGORIES.map((c) => {
                                        const checked = categories.includes(c);
                                        return (
                                          <DropdownMenuCheckboxItem
                                            key={c}
                                            checked={checked}
                                            onCheckedChange={(v) => {
                                              setCategories((prev) => {
                                                if (v && !prev.includes(c)) return [...prev, c];
                                                if (!v) return prev.filter((x) => x !== c);
                                                return prev;
                                              });
                                            }}
                                          >
                                            {c}
                                          </DropdownMenuCheckboxItem>
                                        );
                                      })}
                                      <DropdownMenuSeparator />
                                      <DropdownMenuCheckboxItem
                                        checked={categories.length === 0}
                                        onCheckedChange={() => setCategories([])}
                                      >
                                        Clear selection
                                      </DropdownMenuCheckboxItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                              <div className="mt-8 grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                {visibleIssues.length === 0 && (
                                  <div className="col-span-full rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg p-8 text-center text-muted-foreground">
                                    No matching issues.
                                  </div>
                                )}

                                {visibleIssues.map((i) => (
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
