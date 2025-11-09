import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThumbsUp, ThumbsDown, Calendar, Tag, AlertCircle, User, FileText, CheckCircle2, TrendingUp } from "lucide-react";
import { ISSUE_STATUSES } from "@/types/issue";
import type { Issue } from "@/types/issue";
import IssueComments from "./IssueComments";
import { useAuth } from "@/hooks/use-auth";
import { useUserVote } from "@/hooks/use-user-vote";
import { isFirebaseConfigured } from "@/integrations/firebase/config";
import { cn, formatRelativeTime } from "@/lib/utils";
import { getUserAvatarUrl } from "@/lib/avatar";

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
  const { data: userVote } = useUserVote(issue?.id);

  if (!issue) return null;

  const isOwner = user?.uid === issue.createdBy;
  const isAnonymous = issue.anonymous === true;
  // Allow comments on anonymous issues even if owner
  const disableComments = isOwner && !isAnonymous;
  const hasUpvoted = userVote?.vote === 1;
  const hasDownvoted = userVote?.vote === -1;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 space-y-3">
          {/* User info header */}
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 flex-shrink-0 border-2 border-orange-500/20">
              <AvatarImage src={user?.photoURL || getUserAvatarUrl(issue.createdBy)} />
              <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-500 text-white text-sm font-semibold">
                <img src={getUserAvatarUrl(issue.createdBy)} alt="" className="w-full h-full" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-display font-semibold truncate">
                {issue.createdByName ?? "Anonymous"}
              </DialogTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span title={new Date(issue.createdAt).toLocaleString()}>{formatRelativeTime(issue.createdAt)}</span>
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
                    variant={hasDownvoted ? "default" : "outline"}
                    className={cn(
                      "rounded-full",
                      hasDownvoted && "bg-orange-500 text-white hover:bg-orange-600"
                    )}
                    onClick={() => onDownvote?.(issue.id)}
                    disabled={(isOwner && !isAnonymous) || isDownvoting || !onDownvote}
                    title={(isOwner && !isAnonymous) ? 'You cannot vote on your own issue' : hasDownvoted ? 'Remove downvote' : 'Downvote this issue'}
                  >
                    <ThumbsDown className="h-4 w-4 mr-1" />
                    {hasDownvoted ? 'Downvoted' : 'Downvote'}
                  </Button>
                  <Button
                    size="sm"
                    variant={hasUpvoted ? "default" : "outline"}
                    className={cn(
                      "rounded-full",
                      hasUpvoted ? "bg-orange-500 text-white hover:bg-orange-600" : "bg-black text-white hover:bg-orange-400/90"
                    )}
                    onClick={() => onUpvote?.(issue.id)}
                    disabled={(isOwner && !isAnonymous) || isUpvoting || !onUpvote}
                    title={(isOwner && !isAnonymous) ? 'You cannot vote on your own issue' : hasUpvoted ? 'Remove upvote' : 'Upvote this issue'}
                  >
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    {hasUpvoted ? 'Upvoted' : 'Upvote'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Resolution Section */}
            {issue.resolution && (
              <>
                <Separator />
                <div className="rounded-lg bg-green-50 border border-green-200 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-green-900">Issue Resolved</div>
                      <div className="text-xs text-green-700" title={new Date(issue.resolution.resolvedAt).toLocaleString()}>
                        {formatRelativeTime(issue.resolution.resolvedAt)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-green-900">Resolution Message:</div>
                    <p className="text-sm text-green-800 whitespace-pre-wrap break-words bg-white rounded p-3 border border-green-200">
                      {issue.resolution.message}
                    </p>
                  </div>

                  {issue.resolution.photos && issue.resolution.photos.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-green-900">Resolution Photos:</div>
                      <div className="grid grid-cols-2 gap-2">
                        {issue.resolution.photos.map((photo, idx) => (
                          <img
                            key={idx}
                            src={photo}
                            alt={`Resolution ${idx + 1}`}
                            className="rounded border border-green-200 w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(photo, '_blank')}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Progress Updates Section */}
            {issue.progressUpdates && issue.progressUpdates.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-orange-500" />
                    <h3 className="text-base font-semibold">Progress Updates</h3>
                    <Badge variant="secondary" className="ml-auto">
                      {issue.progressUpdates.length} {issue.progressUpdates.length === 1 ? 'update' : 'updates'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {issue.progressUpdates.slice().reverse().map((update, idx) => (
                      <div 
                        key={idx} 
                        className="rounded-lg bg-orange-50 border border-orange-200 p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs text-orange-700">
                          <span className="font-medium">
                            Update {issue.progressUpdates!.length - idx}
                          </span>
                          <span title={new Date(update.updatedAt).toLocaleString()}>
                            {formatRelativeTime(update.updatedAt)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-orange-900 whitespace-pre-wrap break-words bg-white rounded p-3 border border-orange-200">
                          {update.message}
                        </p>

                        {update.photos && update.photos.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 pt-2">
                            {update.photos.map((photo, photoIdx) => (
                              <img
                                key={photoIdx}
                                src={photo}
                                alt={`Progress ${photoIdx + 1}`}
                                className="rounded border border-orange-200 w-full h-24 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(photo, '_blank')}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Comments Section */}
            {isFirebaseConfigured && (
              <div className="space-y-3">
                <IssueComments issueId={issue.id} disabled={disableComments} />
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
