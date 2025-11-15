import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThumbsUp, MessageSquare, TrendingUp, Calendar, User, AlertCircle } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import type { Issue } from "@/types/issue";

interface IssueAnalyticsDialogProps {
  issue: Issue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  engagement?: { comments: number; commentLikes: number };
  activitySummary?: {
    upvotesGiven: number;
    downvotesGiven: number;
    commentsMade: number;
    repliesMade: number;
    commentsLiked: number;
    totalEngagement: number;
  };
}

export default function IssueAnalyticsDialog({
  issue,
  open,
  onOpenChange,
  engagement,
  activitySummary,
}: IssueAnalyticsDialogProps) {
  if (!issue) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            Insights for: <span className="truncate max-w-[12rem]">{issue.title}</span>
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="pr-2">
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Posted by: <b>{issue.createdByName || "Anonymous"}</b></span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Created: {formatRelativeTime(issue.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">{issue.status}</Badge>
                <Badge variant="outline">{issue.category}</Badge>
                {issue.urgency && <Badge variant="outline">Urgency: {issue.urgency}</Badge>}
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <ThumbsUp className="h-6 w-6 mx-auto text-orange-500" />
                <div className="font-bold text-lg">{issue.votes}</div>
                <div className="text-xs text-muted-foreground">Total Upvotes</div>
              </div>
              <div>
                <MessageSquare className="h-6 w-6 mx-auto text-blue-500" />
                <div className="font-bold text-lg">{engagement?.comments ?? 0}</div>
                <div className="text-xs text-muted-foreground">Comments</div>
              </div>
              <div>
                <ThumbsUp className="h-6 w-6 mx-auto text-green-500" />
                <div className="font-bold text-lg">{engagement?.commentLikes ?? 0}</div>
                <div className="text-xs text-muted-foreground">Comment Likes</div>
              </div>
              <div>
                <TrendingUp className="h-6 w-6 mx-auto text-purple-500" />
                <div className="font-bold text-lg">{activitySummary?.totalEngagement ?? 0}</div>
                <div className="text-xs text-muted-foreground">Your Engagement</div>
              </div>
            </div>
            <Separator />
            <div>
              <div className="font-semibold mb-1">Issue Description</div>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap break-words bg-stone-50 rounded p-3 border border-stone-200">
                {issue.description}
              </div>
            </div>
            {issue.resolution && (
              <div className="bg-green-50 border border-green-200 rounded p-3 mt-2">
                <div className="font-semibold text-green-900 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" /> Resolved
                </div>
                <div className="text-xs text-green-700 mb-1">{formatRelativeTime(issue.resolution.resolvedAt)}</div>
                <div className="text-sm text-green-800 whitespace-pre-wrap break-words">
                  {issue.resolution.message}
                </div>
              </div>
            )}
            {/* Add more analytics/insights here as needed */}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
