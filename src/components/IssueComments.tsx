import { useState } from 'react';
import { useComments } from '@/hooks/use-comments';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { cn, formatRelativeTime } from '@/lib/utils';
import { validateCommentData } from '@/lib/security';
import { MessageSquare, Reply, ThumbsUp, Pin, Flag, MoreVertical } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toggleCommentLike, getUserCommentLike, type CommentDoc } from '@/integrations/firebase/firestore';
import { logActivity } from '@/lib/activity-tracker';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import ReportCommentDialog from './ReportCommentDialog';
import PortalErrorBoundary from './PortalErrorBoundary';

interface IssueCommentsProps {
  issueId: string;
  issueTitle?: string; // Title of the issue for report context
  issueOwnerId?: string; // The creator of the issue
  allowPin?: boolean; // Whether pin UI should be shown (context gated)
  disabled?: boolean; // disable add for owner
  className?: string;
  disabledReason?: string; // reason why commenting is disabled
}

export default function IssueComments({ issueId, issueTitle = "Unknown Issue", issueOwnerId, allowPin = false, disabled, className, disabledReason }: IssueCommentsProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: comments, isLoading, error: commentsError, addComment, pinComment, userCommentCount, canAddTopLevel } = useComments(issueId);
  const [value, setValue] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reportedCommentId, setReportedCommentId] = useState<string | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportingCommentData, setReportingCommentData] = useState<{
    id: string;
    text: string;
    authorName: string;
    authorId: string;
  } | null>(null);
  const isIssueOwner = user?.uid === issueOwnerId;

  const canAdd = !!user && !disabled;
  const canAddTopLevelComment = canAdd && !isIssueOwner; // Owners can only reply, not create top-level comments

  // Like mutation with optimistic updates
  const likeMutation = useMutation({
    mutationFn: async (commentId: string) => {
      if (!user) throw new Error('Must be signed in');
      return await toggleCommentLike(commentId, user.uid);
    },
    onMutate: async (commentId: string) => {
      // Cancel outgoing refetches for this specific comment's like status
      await qc.cancelQueries({ queryKey: ['comment-like', commentId, user?.uid] });
      
      // Snapshot previous values
      const previousComments = qc.getQueryData(['comments', issueId]);
      const previousLike = qc.getQueryData(['comment-like', commentId, user?.uid]);
      
      // Optimistically update comments
      qc.setQueryData<CommentDoc[]>(['comments', issueId], (old) => {
        if (!old) return old;
        return old.map((comment) => {
          if (comment.id === commentId) {
            const isLiked = !!previousLike;
            return {
              ...comment,
              likes: Math.max(0, (comment.likes || 0) + (isLiked ? -1 : 1))
            };
          }
          return comment;
        });
      });
      
      // Optimistically update like status
      if (previousLike) {
        qc.setQueryData(['comment-like', commentId, user?.uid], null);
      } else {
        qc.setQueryData(['comment-like', commentId, user?.uid], { userId: user?.uid, likedAt: new Date() });
      }
      
      return { previousComments, previousLike, commentId };
    },
    onError: (err, commentId, context) => {
      // Rollback on error
      if (context?.previousComments) {
        qc.setQueryData(['comments', issueId], context.previousComments);
      }
      if (context?.previousLike !== undefined && context?.commentId) {
        qc.setQueryData(['comment-like', context.commentId, user?.uid], context.previousLike);
      }
    },
    onSettled: (data, error, commentId) => {
      // Only refetch the specific comment's like status, not all comments
      qc.invalidateQueries({ queryKey: ['comment-like', commentId, user?.uid] });
      if (user?.uid) {
        qc.invalidateQueries({ queryKey: ['user-activity', user.uid] });
        qc.invalidateQueries({ queryKey: ['local-activity', user.uid] });
      }
    },
    onSuccess: (result, commentId) => {
      // Log activity to local storage
      if (user?.uid) {
        if (result === 'liked') {
          logActivity(user.uid, 'like_comment', { commentId, issueId });
        } else {
          logActivity(user.uid, 'unlike_comment', { commentId, issueId });
        }
      }
    }
  });

  // Hook to check if user liked a comment
  const useCommentLike = (commentId: string) => {
    return useQuery({
      enabled: !!user && !!commentId,
      queryKey: ['comment-like', commentId, user?.uid],
      queryFn: async () => {
        if (!user || !commentId) return null;
        return await getUserCommentLike(commentId, user.uid);
      }
    });
  };

  // Organize comments into threads
  const topLevelComments = (comments?.filter(c => !c.parentId) || []).sort((a, b) => {
    // Sort pinned comments to the top
    if (a.pinnedAt && !b.pinnedAt) return -1;
    if (!a.pinnedAt && b.pinnedAt) return 1;
    // Then sort by creation time
    const aTime = typeof a.createdAt === 'number' ? a.createdAt : (a.createdAt as unknown as { toDate?: () => Date })?.toDate?.()?.getTime() || 0;
    const bTime = typeof b.createdAt === 'number' ? b.createdAt : (b.createdAt as unknown as { toDate?: () => Date })?.toDate?.()?.getTime() || 0;
    return aTime - bTime;
  });
  const getReplies = (commentId: string) => comments?.filter(c => c.parentId === commentId) || [];

  const handleSubmit = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    setError(null);
    const content = value.trim();
    if (!content) return;
    
    // Validate comment content
    const validation = validateCommentData(content);
    if (!validation.valid) {
      setError(validation.error || 'Invalid comment');
      return;
    }
    
    // Clear the input immediately for better UX
    const submittedContent = content;
    setValue('');
    
    try {
      await addComment.mutateAsync({ content: submittedContent, parentId });
      // Only close reply form after successful submit
      if (parentId) {
        setReplyTo(null);
      }
    } catch (err) {
      setError((err as Error).message);
      // Restore content if error occurs
      setValue(submittedContent);
    }
  };

  return (
    <div className={cn('space-y-3 max-w-full overflow-hidden', className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Comments ({comments?.length || 0})
        </h4>
        {canAdd && !canAddTopLevel && (
          <span className="text-[10px] text-orange-600">
            {userCommentCount}/2 comments used
          </span>
        )}
      </div>
      
      {isLoading && <p className="text-xs text-muted-foreground">Loading comments...</p>}
      
      {commentsError && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
          Error loading comments: {(commentsError as Error).message}
        </div>
      )}
      
      {!isLoading && !commentsError && topLevelComments.length === 0 && (
        <p className="text-xs text-muted-foreground">No comments yet. Be the first!</p>
      )}
      
      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {topLevelComments.map(comment => {
          const replies = getReplies(comment.id);
          const CommentItem = ({ c, isReply = false }: { c: typeof comment; isReply?: boolean }) => {
            const { data: likeData } = useCommentLike(c.id);
            const hasLiked = !!likeData;
            const isOptimistic = c.id.startsWith('temp_');
            
            return (
              <div className={cn(
                "rounded-md px-3 py-2 border transition-all duration-200 w-full overflow-hidden",
                isReply ? "bg-orange-50/50 backdrop-blur border-orange-100" : "bg-white/70 backdrop-blur",
                isOptimistic && "opacity-70 animate-pulse"
              )}>
                <div className="flex justify-between items-start mb-1 gap-2">
                  <span className={cn("font-semibold text-gray-800 flex items-center gap-1.5 flex-wrap min-w-0", isReply ? "text-[10px]" : "text-[11px]")}>
                    <span className={cn("font-medium truncate", isReply ? "text-[11px]" : "text-xs")}>
                      {c.userName}
                    </span>
                    {allowPin && c.pinnedAt && (
                      <span className="text-[9px] text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded flex items-center gap-1 flex-shrink-0">
                        <Pin className="h-2.5 w-2.5" />
                        Pinned
                      </span>
                    )}
                    {isOptimistic && (
                      <span className="text-[9px] text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded flex-shrink-0">
                        Posting...
                      </span>
                    )}
                  </span>
                  <span className={cn("text-gray-500 flex-shrink-0", isReply ? "text-[9px]" : "text-[10px]")}
                        title={(() => { 
                          if (typeof c.createdAt === 'number') return new Date(c.createdAt).toLocaleString();
                          const ts = c as unknown as { createdAt?: { toDate?: () => Date } };
                          return ts.createdAt?.toDate ? ts.createdAt.toDate().toLocaleString() : '';
                        })()}>
                    {(() => { 
                      if (typeof c.createdAt === 'number') return formatRelativeTime(c.createdAt); 
                      const ts = c as unknown as { createdAt?: { toDate?: () => Date } }; 
                      return ts.createdAt?.toDate ? formatRelativeTime(ts.createdAt.toDate() as Date) : ''; 
                    })()}
                  </span>
                </div>
                <p className={cn("text-gray-700 break-words overflow-wrap-anywhere mb-2 max-w-full", isReply ? "text-[11px]" : "text-xs")}>
                  {c.content}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {user && user.uid !== c.userId && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className={cn(
                        "h-6 px-2 text-[10px]",
                        hasLiked && "text-orange-600"
                      )}
                      onClick={() => likeMutation.mutate(c.id)}
                      disabled={likeMutation.isPending}
                    >
                      <ThumbsUp className={cn("h-3 w-3 mr-1", hasLiked && "fill-orange-600")} />
                      {c.likes || 0}
                    </Button>
                  )}
                  {user && user.uid === c.userId && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 cursor-not-allowed opacity-50" title="You cannot vote on your own comment">
                      <ThumbsUp className="h-3 w-3" />
                      {c.likes || 0}
                    </span>
                  )}
                  {!user && c.likes > 0 && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      {c.likes}
                    </span>
                  )}
                  {canAdd && !isReply && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-[10px]"
                      onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
                    >
                      <Reply className="h-3 w-3 mr-1" />
                      Reply
                    </Button>
                  )}
                  {allowPin && isIssueOwner && !isReply && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className={cn(
                        "h-6 px-2 text-[10px]",
                        c.pinnedAt && "text-orange-600"
                      )}
                      onClick={() => pinComment.mutate(c.id)}
                      disabled={pinComment.isPending}
                    >
                      <Pin className={cn("h-3 w-3 mr-1", c.pinnedAt && "fill-orange-600")} />
                      {c.pinnedAt ? 'Unpin' : 'Pin'}
                    </Button>
                  )}
                  {user && user.uid !== c.userId && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-[10px]"
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setReportingCommentData({
                              id: c.id,
                              text: c.content || c.text || '',
                              authorName: c.userName || 'Anonymous',
                              authorId: c.userId,
                            });
                            setReportDialogOpen(true);
                          }}
                          className="text-red-600 focus:text-red-600 cursor-pointer"
                        >
                          <Flag className="h-3 w-3 mr-2" />
                          <span className="text-xs">Report Comment</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            );
          };
          
          return (
            <div key={comment.id} className="space-y-2 w-full overflow-hidden">
              {/* Top-level comment */}
              <CommentItem c={comment} />

              {/* Replies */}
              {replies.length > 0 && (
                <div className="ml-6 space-y-2 border-l-2 border-orange-200 pl-3 overflow-hidden">
                  {replies.map(reply => (
                    <CommentItem key={reply.id} c={reply} isReply />
                  ))}
                </div>
              )}

              {/* Reply form */}
              {replyTo === comment.id && canAdd && (
                <form onSubmit={(e) => handleSubmit(e, comment.id)} className="ml-6 space-y-2">
                  <Textarea
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Write your reply..."
                    className="min-h-[60px] text-xs"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setReplyTo(null);
                        setValue('');
                      }}
                      className="rounded-full text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      type="submit"
                      disabled={addComment.isPending || !value.trim()}
                      className="rounded-full text-xs"
                    >
                      {addComment.isPending ? 'Posting...' : 'Post Reply'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {/* Top-level comment form */}
      {canAddTopLevelComment && !replyTo && (
        <form onSubmit={(e) => {
          if (value.trim() && confirm('Comments cannot be edited or deleted once posted. Are you sure?')) {
            handleSubmit(e, null);
          } else {
            e.preventDefault();
          }
        }} className="space-y-2">
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-2 mb-2">
            <p className="text-[10px] text-amber-800">
              <span className="font-semibold">⚠️ Note:</span> Comments cannot be edited or deleted once posted.
            </p>
          </div>
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Add a comment... (Cannot be edited once posted)"
            className="min-h-[60px] text-xs"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              type="submit"
              disabled={addComment.isPending || !value.trim()}
              className="rounded-full"
            >
              {addComment.isPending ? 'Posting...' : 'Post Comment (Permanent)'}
            </Button>
          </div>
        </form>
      )}
      
      {!canAdd && !replyTo && (
        <p className="text-[10px] text-muted-foreground">
          {disabledReason || 'Sign in to comment.'}
      
              {isIssueOwner && !replyTo && (
                <p className="text-[10px] text-orange-600 bg-orange-50 p-2 rounded">
                  As the issue owner, you can reply to comments but cannot create new top-level comments.
                </p>
              )}
        </p>
      )}

      {/* Report Comment Dialog */}
      {reportingCommentData && (
        <PortalErrorBoundary fallback={<div className="p-4 text-center text-red-600">Failed to load report dialog</div>}>
          <ReportCommentDialog
            open={reportDialogOpen}
            onOpenChange={setReportDialogOpen}
            commentId={reportingCommentData.id}
            commentText={reportingCommentData.text}
            commentAuthorName={reportingCommentData.authorName}
            commentAuthorId={reportingCommentData.authorId}
            issueId={issueId}
            issueTitle={issueTitle}
            issueOwnerId={issueOwnerId || ''}
          />
        </PortalErrorBoundary>
      )}
    </div>
  );
}

