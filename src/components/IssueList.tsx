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
