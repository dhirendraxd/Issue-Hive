import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThumbsUp, ThumbsDown, Calendar, Tag, AlertCircle, User, FileText } from "lucide-react";
import { ISSUE_STATUSES } from "@/types/issue";
import type { Issue } from "@/types/issue";
import IssueComments from "./IssueComments";
import { useAuth } from "@/hooks/use-auth";
import { isFirebaseConfigured } from "@/integrations/firebase/config";
import { cn } from "@/lib/utils";

interface IssueDetailDialogProps {
  issue: Issue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpvote?: (id: string) => void;
  onDownvote?: (id: string) => void;
  isUpvoting?: boolean;
  isDownvoting?: boolean;
}

export default function IssueDetailDialog({
  issue,
  open,
  onOpenChange,
  onUpvote,
  onDownvote,
  isUpvoting,
  isDownvoting,
}: IssueDetailDialogProps) {
  const { user } = useAuth();

  if (!issue) return null;

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

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case "high":
        return "text-red-600 bg-red-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "low":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const isOwner = user?.uid === issue.createdBy;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 space-y-3">
          {/* User info header */}
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 flex-shrink-0 border-2 border-orange-500/20">
              <AvatarImage src={user?.photoURL || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-500 text-white text-sm font-semibold">
                {getInitials(issue.createdByName ?? "User")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-semibold truncate">
                {issue.createdByName ?? "Anonymous"}
              </DialogTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{new Date(issue.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
            </div>
            {issue.anonymous && (
              <Badge variant="outline" className="text-xs">
                Posted Anonymously
              </Badge>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-6 pb-6">
            {/* Issue Title */}
            <div>
              <h2 className="text-2xl font-bold leading-tight">{issue.title}</h2>
            </div>

            {/* Badges: Status, Category, Urgency */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                <Badge className={cn("text-xs font-medium", getStatusColor(issue.status))}>
                  {ISSUE_STATUSES.find((s) => s.value === issue.status)?.label ?? issue.status}
                </Badge>
              </div>
              
              <Badge variant="outline" className="text-xs font-medium">
                {issue.category}
              </Badge>

              {issue.urgency && (
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  <Badge className={cn("text-xs font-medium border", getUrgencyColor(issue.urgency))}>
                    {issue.urgency.charAt(0).toUpperCase() + issue.urgency.slice(1)} Priority
                  </Badge>
                </div>
              )}
            </div>

            <Separator />

            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>Description</span>
              </div>
              <p className="text-base leading-relaxed whitespace-pre-wrap break-words">
                {issue.description}
              </p>
            </div>

            {/* Attachments */}
            {issue.attachments && issue.attachments.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-muted-foreground">Attachments</div>
                  <div className="flex flex-wrap gap-2">
                    {issue.attachments.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Attachment {idx + 1}
                      </a>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Voting Section */}
            <div className="rounded-lg bg-stone-50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="h-5 w-5 text-orange-500" />
                  <span className="text-lg font-semibold">
                    {issue.votes} {issue.votes === 1 ? 'Support' : 'Supports'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => onDownvote?.(issue.id)}
                    disabled={isOwner || isDownvoting || !onDownvote}
                    title={isOwner ? 'You cannot vote on your own issue' : 'Downvote this issue'}
                  >
                    <ThumbsDown className="h-4 w-4 mr-1" />
                    Downvote
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-full bg-black text-white hover:bg-orange-400/90 transition-colors"
                    onClick={() => onUpvote?.(issue.id)}
                    disabled={isOwner || isUpvoting || !onUpvote}
                    title={isOwner ? 'You cannot vote on your own issue' : 'Upvote this issue'}
                  >
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    Upvote
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Comments Section */}
            {isFirebaseConfigured && (
              <div className="space-y-3">
                <IssueComments issueId={issue.id} disabled={isOwner} />
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
