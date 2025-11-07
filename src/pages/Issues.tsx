import { useMemo, useState } from "react";
import { ThumbsUp, RotateCcw } from "lucide-react";
import Navbar from "@/components/Navbar";
import HiveHexParticles from "@/components/HiveHexParticles";
import CommunityNodes from "@/components/CommunityNodes";
import { useIssues } from "@/hooks/use-issues";
import { useIssuesFirebase } from "@/hooks/use-issues-firebase";
import { isFirebaseConfigured } from "@/integrations/firebase/config";
import { useAuth } from "@/hooks/use-auth";
import { ISSUE_STATUSES, type IssueCategory, type IssueStatus, type Issue } from "@/types/issue";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { IssuesFilterBar, type SortKey } from "@/components/IssuesFilterBar";
import IssueDetailDialog from "@/components/IssueDetailDialog";

export default function Issues() {
  const { user } = useAuth();
  // Choose backend: Firebase when configured, otherwise local storage
  const local = useIssues();
  const cloud = useIssuesFirebase();
  const useCloud = isFirebaseConfigured;

  const upvote = useCloud ? cloud.upvote : local.upvote;
  const downvote = useCloud ? cloud.downvoteIssue : local.downvote;

  // Modal state
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCardClick = (issue: Issue) => {
    setSelectedIssue(issue);
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      // Small delay to allow dialog close animation
      setTimeout(() => setSelectedIssue(null), 150);
    }
  };

  // Filters
  const [q, setQ] = useState("");
  const [categories, setCategories] = useState<IssueCategory[]>([]);
  // Show all statuses by default (empty means no filter)
  const [statuses, setStatuses] = useState<IssueStatus[]>([]);
  const [sort, setSort] = useState<SortKey>("new");
  const visibleIssues = useMemo(() => {
    const base = (useCloud ? cloud.data : local.data) ?? [];
    // Hide private/draft issues unless owned by current user
    type WithVisibility = { visibility?: 'public' | 'private' | 'draft' };
    let arr = base.filter((i) => {
      const vis = (i as unknown as WithVisibility).visibility;
      if (!vis || vis === 'public') return true;
      return i.createdBy === user?.uid; // owner can see theirs
    });
    // status filter (default in_progress + resolved)
    if (statuses.length > 0) {
      arr = arr.filter((i) => (statuses as IssueStatus[]).includes(i.status));
    }
    if (categories.length > 0) {
      arr = arr.filter((i) => categories.includes(i.category));
    }
    if (q.trim()) {
      const n = q.trim().toLowerCase();
      arr = arr.filter((i) => {
        const title = i.title.toLowerCase();
        const desc = i.description.toLowerCase();
        const name = (i.createdByName || "").toLowerCase();
        return title.includes(n) || desc.includes(n) || name.includes(n);
      });
    }
    // sorting
    const byDate = (a: number, b: number) => a - b;
    if (sort === "new") arr = [...arr].sort((a, b) => byDate(b.createdAt, a.createdAt));
    else if (sort === "old") arr = [...arr].sort((a, b) => byDate(a.createdAt, b.createdAt));
    else if (sort === "votes") arr = [...arr].sort((a, b) => b.votes - a.votes);
    return arr;
  }, [useCloud, cloud.data, local.data, categories, q, statuses, sort, user?.uid]);

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

          {/* Filters: improved UX and UI */}
          <div className="mb-6 relative z-10">
            <IssuesFilterBar
              q={q}
              onQChange={setQ}
              categories={categories}
              onCategoriesChange={setCategories}
              statuses={statuses}
              onStatusesChange={setStatuses}
              sort={sort}
              onSortChange={setSort}
            />
          </div>

          <div className="mt-8 grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {visibleIssues.length === 0 && (
              <div className="col-span-full rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg p-8 text-center">
                <p className="text-muted-foreground">No matching issues.</p>
                <Button
                  variant="ghost"
                  className="mt-3 rounded-full"
                  onClick={() => {
                    setQ("");
                    setCategories([]);
                    setStatuses([]);
                    setSort("new");
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" /> Reset filters
                </Button>
              </div>
            )}

            {visibleIssues.map((i) => (
              <Card 
                key={i.id} 
                className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg transition-all hover:bg-white/70 hover:shadow-md hover:border-orange-200/60 flex flex-col h-full cursor-pointer"
                onClick={() => handleCardClick(i)}
              >
                <CardContent className="p-6 md:p-7 flex flex-col h-full">
                  {/* Header: User Info */}
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className="bg-orange-500 text-white text-xs">
                        {getInitials(i.createdByName ?? "User")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{i.createdByName ?? "Anonymous"}</p>
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
                    </span>
                    <span className="inline-flex items-center rounded-full border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-50">
                      {i.category}
                    </span>
                  </div>

                  {/* Footer: Votes & Action */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ThumbsUp className="h-4 w-4 text-orange-500" />
                      <span>{i.votes} support{i.votes !== 1 ? "s" : ""}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardClick(i);
                      }}
                    >
                      View Details →
                    </Button>
                  </div>

                  {/* Urgency & Anonymous Status */}
                  <div className="mt-2 text-xs text-gray-500">
                    Urgency:{" "}
                    <span className={i.urgency === "high" ? "text-red-500" : i.urgency === "medium" ? "text-yellow-500" : "text-green-500"}>
                      {i.urgency}
                    </span>
                  </div>
                  {i.anonymous && (
                    <div className="mt-1 text-xs text-gray-400">Posted anonymously</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      {/* Issue Detail Dialog */}
      <IssueDetailDialog
        issue={selectedIssue}
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        onUpvote={(id) => upvote.mutate(id)}
        onDownvote={(id) => downvote.mutate(id)}
        isUpvoting={upvote.isPending}
        isDownvoting={downvote.isPending}
      />
    </div>
  );
}
