/**
 * DEPRECATED/UNUSED: Not referenced by current pages.
 * Prefer custom grid in `src/pages/Issues.tsx`.
 * Safe to remove or move to an `_legacy/` folder if not needed.
 */
import { Card, CardContent } from "@/components/ui/card";
import IssueCard from "@/components/IssueCard";
import type { Issue, IssueStatus } from "@/types/issue";

export default function IssueList({
  issues,
  onUpvote,
  onStatusChange,
}: {
  issues: Issue[];
  onUpvote: (id: string) => void;
  onStatusChange?: (id: string, status: IssueStatus) => void;
}) {
  if (issues.length === 0) {
    return (
      <Card className="col-span-full">
        <CardContent className="py-10 text-center text-muted-foreground">
          No issues yet. Be the first to report a problem!
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {issues.map((issue) => (
        <IssueCard
          key={issue.id}
          issue={issue}
          onUpvote={onUpvote}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  );
}
