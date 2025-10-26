import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Issue, IssueStatus } from "@/types/issue";
import { ISSUE_STATUSES } from "@/types/issue";

export default function IssueCard({
  issue,
  onUpvote,
  onStatusChange,
}: {
  issue: Issue;
  onUpvote: (id: string) => void;
  onStatusChange?: (id: string, status: IssueStatus) => void;
}) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base md:text-lg leading-tight">
            {issue.title}
          </CardTitle>
          <StatusBadge status={issue.status} />
        </div>
        <div className="text-xs text-muted-foreground">
          {new Date(issue.createdAt).toLocaleDateString()} • {issue.category}
        </div>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground flex-1 break-words">
        {issue.description}
      </CardContent>
      <Separator className="my-2" />
      <CardFooter className="flex items-center justify-between">
        <div className="text-sm">
          <span className="font-semibold">{issue.votes}</span> supports
        </div>
        <div className="flex items-center gap-2">
          {onStatusChange && (
            <select
              className="text-sm border rounded-md px-2 py-1 bg-background"
              value={issue.status}
              onChange={(e) => onStatusChange(issue.id, e.target.value as IssueStatus)}
            >
              {ISSUE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          )}
          <Button size="sm" variant="secondary" onClick={() => onUpvote(issue.id)}>
            Support
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
