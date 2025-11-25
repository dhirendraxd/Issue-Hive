  function isDate(obj: unknown): obj is Date {
    return Object.prototype.toString.call(obj) === '[object Date]';
  }
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ThumbsUp, MessageSquare, TrendingUp, Calendar, User, AlertCircle, CheckCircle2, Pin } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import type { Issue } from "@/types/issue";
import { useIssueComments } from "@/hooks/use-issue-comments";
import { useIssueVotes } from "@/hooks/use-issue-votes";
import { useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { pinComment, type CommentDoc, Timestamp } from "@/integrations/firebase/firestore";
import { toast } from "sonner";

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
  const { data: comments = [] } = useIssueComments(issue?.id);
  const { data: votes = [] } = useIssueVotes(issue?.id);
  const { user } = useAuth();
  const { data: creatorProfile } = useUserProfile(issue?.createdBy);
  const qc = useQueryClient();
  const isOwner = !!issue && user?.uid === issue.createdBy;

  const pinMutation = useMutation({
    mutationFn: async (commentId: string) => {
      if (!issue) throw new Error("No issue context");
      return await pinComment(commentId, issue.id, user!.uid);
    },
    onMutate: async (commentId: string) => {
      await qc.cancelQueries({ queryKey: ['issue-comments', issue?.id] });
      const previous = qc.getQueryData<CommentDoc[]>(['issue-comments', issue?.id]);
      qc.setQueryData<CommentDoc[]>(['issue-comments', issue?.id], (old) => {
        if (!old) return old;
        return old.map(c => {
          if (c.id === commentId) {
            if (c.pinnedAt) {
              const { pinnedAt, pinnedBy, ...rest } = c;
              return rest as CommentDoc;
            } else {
              return { ...c, pinnedAt: Timestamp.now(), pinnedBy: user!.uid };
            }
          }
          return c;
        });
      });
      return { previous };
    },
    onError: (err, _commentId, ctx) => {
      if (ctx?.previous) qc.setQueryData(['issue-comments', issue?.id], ctx.previous);
      toast.error(err instanceof Error ? err.message : 'Failed to toggle pin');
    },
    onSuccess: (result) => {
      toast.success(result === 'pinned' ? 'Comment pinned' : 'Comment unpinned');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['issue-comments', issue?.id] });
    }
  });

  // Find when the issue hit the most likes (upvotes)
  const mostLiked = useMemo(() => {
    let max = 0;
    let maxTime: string | null = null;
    let count = 0;
    votes.forEach((v) => {
      if (v.vote === 1) {
        count++;
        if (count > max) {
          max = count;
          const timestamp = typeof v.createdAt === 'number'
            ? new Date(v.createdAt).toISOString()
            : v.createdAt?.toDate?.()
              ? v.createdAt.toDate().toISOString()
              : new Date().toISOString();
          maxTime = timestamp;
        }
      }
    });
    return maxTime;
  }, [votes]);

  // Find users who liked comments
  // Defensive: likedBy may not exist on CommentDoc, so check and fallback
  type LikedByUser = { userId: string; userName?: string; likedAt?: Date | { toDate: () => Date } };
  function isWithToDate(obj: unknown): obj is { toDate: () => Date } {
    return !!obj && typeof obj === 'object' && typeof (obj as { toDate?: unknown }).toDate === 'function';
  }
  const commentLikesInfo = useMemo(() => {
    const likes: { userId: string; userName?: string; commentId: string; time?: string }[] = [];
    comments.forEach((c) => {
      // likedBy is not typed, so check at runtime
      const likedByArr: unknown = (c as { likedBy?: unknown }).likedBy;
      if (c.likes > 0 && Array.isArray(likedByArr)) {
        (likedByArr as LikedByUser[]).forEach((u) => {
          let likeDate: string | undefined = undefined;
          if (u.likedAt) {
            if (isWithToDate(u.likedAt)) {
              likeDate = u.likedAt.toDate().toISOString();
            } else if (u.likedAt instanceof Date) {
              likeDate = u.likedAt.toISOString();
            }
          }
          likes.push({
            userId: u.userId,
            userName: u.userName,
            commentId: c.id,
            time: likeDate,
          });
        });
      }
    });
    return likes;
  }, [comments]);

  if (!issue) return null;

  // Sort comments so pinned appear first (then chronological by createdAt)
  function toMillis(val: unknown): number {
    if (typeof val === 'number') return val;
    if (val instanceof Date) return val.getTime();
    if (val && typeof val === 'object' && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
      try { return (val as { toDate: () => Date }).toDate().getTime(); } catch { return 0; }
    }
    return 0;
  }

  const sortedComments = [...comments].sort((a, b) => {
    const aPinned = !!a.pinnedAt; const bPinned = !!b.pinnedAt;
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    const aTime = toMillis(a.createdAt as unknown);
    const bTime = toMillis(b.createdAt as unknown);
    return aTime - bTime;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                <span>Posted by: <b>{creatorProfile?.displayName || issue.createdByName || "Anonymous"}</b></span>
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
            <Separator />
            <div>
              <div className="font-semibold mb-1 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-500" /> Comments ({sortedComments.length})
              </div>
              <div className="space-y-2">
                {sortedComments.length === 0 && <div className="text-xs text-muted-foreground">No comments yet.</div>}
                {sortedComments.map((c) => {
                  let createdDate: Date | undefined = undefined;
                  if (c.createdAt) {
                    if (isWithToDate(c.createdAt)) {
                      createdDate = c.createdAt.toDate();
                    } else if (isDate(c.createdAt)) {
                      createdDate = c.createdAt;
                    }
                  }
                  return (
                    <div key={c.id} className={`bg-stone-50 border rounded p-2 ${c.pinnedAt ? 'border-orange-300 bg-orange-50/70 shadow-sm' : 'border-stone-200'}`}>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <User className="h-3 w-3" /> {c.userName || c.userId}
                        <Calendar className="h-3 w-3 ml-2" /> {createdDate ? formatRelativeTime(createdDate) : ''}
                        {c.pinnedAt && (
                          <span className="flex items-center gap-1 text-[10px] text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded">
                            <Pin className="h-3 w-3" /> Pinned
                          </span>
                        )}
                      </div>
                      <div className="text-sm mb-1 break-words">{c.content}</div>
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3 text-green-500" /> {c.likes} likes
                        </div>
                        {isOwner && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={pinMutation.isPending}
                            onClick={() => pinMutation.mutate(c.id)}
                            className={`h-6 px-2 text-[10px] ${c.pinnedAt ? 'text-orange-600' : ''}`}
                          >
                            <Pin className={`h-3 w-3 mr-1 ${c.pinnedAt ? 'fill-orange-600' : ''}`} />
                            {c.pinnedAt ? 'Unpin' : 'Pin'}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <Separator />
            <div>
              <div className="font-semibold mb-1 flex items-center gap-2">
                <ThumbsUp className="h-4 w-4 text-green-500" /> Users who liked comments
              </div>
              <div className="space-y-1">
                {commentLikesInfo.length === 0 && <div className="text-xs text-muted-foreground">No comment likes yet.</div>}
                {commentLikesInfo.map((like, idx) => (
                  <div key={idx} className="text-xs text-muted-foreground flex items-center gap-2">
                    <User className="h-3 w-3" /> {like.userName || like.userId}
                    <span>on comment</span> <span className="font-mono">{like.commentId.slice(0, 6)}</span>
                    <Calendar className="h-3 w-3 ml-2" /> {like.time ? formatRelativeTime(new Date(like.time)) : ''}
                  </div>
                ))}
              </div>
            </div>
            <Separator />
            <div>
              <div className="font-semibold mb-1 flex items-center gap-2">
                <ThumbsUp className="h-4 w-4 text-orange-500" /> Most Liked Moment
              </div>
              <div className="text-xs text-muted-foreground">
                {mostLiked ? `Hit most upvotes at ${formatRelativeTime(new Date(mostLiked))}` : 'Not enough upvote data.'}
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
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
