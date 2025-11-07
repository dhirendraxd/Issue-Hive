import { useState } from 'react';
import { useComments } from '@/hooks/use-comments';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { MessageSquare, Reply, ThumbsUp } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toggleCommentLike, getUserCommentLike, type CommentDoc } from '@/integrations/firebase/firestore';

interface IssueCommentsProps {
  issueId: string;
  disabled?: boolean; // disable add for owner
  className?: string;
}

export default function IssueComments({ issueId, disabled, className }: IssueCommentsProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: comments, isLoading, addComment, userCommentCount, canAddTopLevel } = useComments(issueId);
  const [value, setValue] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canAdd = !!user && !disabled;

  // Like mutation with optimistic updates
  const likeMutation = useMutation({
    mutationFn: async (commentId: string) => {
      if (!user) throw new Error('Must be signed in');
      return await toggleCommentLike(commentId, user.uid);
    },
    onMutate: async (commentId: string) => {
      // Cancel outgoing refetches
      await qc.cancelQueries({ queryKey: ['comments', issueId] });
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
      
      return { previousComments, previousLike };
    },
    onError: (err, commentId, context) => {
      // Rollback on error
      if (context?.previousComments) {
        qc.setQueryData(['comments', issueId], context.previousComments);
      }
      if (context?.previousLike !== undefined) {
        qc.setQueryData(['comment-like', commentId, user?.uid], context.previousLike);
      }
    },
    onSettled: () => {
      // Refetch to ensure sync with server
      qc.invalidateQueries({ queryKey: ['comments', issueId] });
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
  const topLevelComments = comments?.filter(c => !c.parentId) || [];
  const getReplies = (commentId: string) => comments?.filter(c => c.parentId === commentId) || [];

  const handleSubmit = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    setError(null);
    const content = value.trim();
    if (!content) return;
    
    try {
      await addComment.mutateAsync({ content, parentId });
      setValue('');
      setReplyTo(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
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
      
      {!isLoading && topLevelComments.length === 0 && (
        <p className="text-xs text-muted-foreground">No comments yet. Be the first!</p>
      )}
      
      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {topLevelComments.map(comment => {
          const replies = getReplies(comment.id);
          const CommentItem = ({ c, isReply = false }: { c: typeof comment; isReply?: boolean }) => {
            const { data: likeData } = useCommentLike(c.id);
            const hasLiked = !!likeData;
            
            return (
              <div className={cn(
                "rounded-md px-3 py-2 border",
                isReply ? "bg-orange-50/50 backdrop-blur border-orange-100" : "bg-white/70 backdrop-blur"
              )}>
                <div className="flex justify-between items-start mb-1">
                  <span className={cn("font-medium truncate mr-2", isReply ? "text-[11px]" : "text-xs")}>
                    {c.userName}
                  </span>
                  <span className={cn("text-gray-500 flex-shrink-0", isReply ? "text-[9px]" : "text-[10px]")}>
                    {(() => { 
                      if (typeof c.createdAt === 'number') return new Date(c.createdAt).toLocaleDateString(); 
                      const ts = c as unknown as { createdAt?: { toDate?: () => Date } }; 
                      return ts.createdAt?.toDate ? ts.createdAt.toDate().toLocaleDateString() : ''; 
                    })()}
                  </span>
                </div>
                <p className={cn("text-gray-700 break-words mb-2", isReply ? "text-[11px]" : "text-xs")}>
                  {c.content}
                </p>
                <div className="flex items-center gap-2">
                  {user && (
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
                </div>
              </div>
            );
          };
          
          return (
            <div key={comment.id} className="space-y-2">
              {/* Top-level comment */}
              <CommentItem c={comment} />

              {/* Replies */}
              {replies.length > 0 && (
                <div className="ml-6 space-y-2 border-l-2 border-orange-200 pl-3">
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
      {canAdd && !replyTo && (
        <form onSubmit={(e) => handleSubmit(e, null)} className="space-y-2">
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={canAddTopLevel ? "Add a comment..." : "You've reached the 2-comment limit. Reply to existing comments instead."}
            className="min-h-[60px] text-xs"
            disabled={!canAddTopLevel}
          />
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground">
              {canAddTopLevel ? `${2 - userCommentCount} comment${2 - userCommentCount !== 1 ? 's' : ''} remaining` : 'Reply to comments instead'}
            </span>
            <Button
              size="sm"
              type="submit"
              disabled={addComment.isPending || !value.trim() || !canAddTopLevel}
              className="rounded-full"
            >
              {addComment.isPending ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </form>
      )}
      
      {!canAdd && (
        <p className="text-[10px] text-muted-foreground">
          {user ? 'You cannot comment on your own issue.' : 'Sign in to comment.'}
        </p>
      )}
    </div>
  );
}
