import { useState } from 'react';
import { useComments } from '@/hooks/use-comments';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { MessageSquare, Reply } from 'lucide-react';

interface IssueCommentsProps {
  issueId: string;
  disabled?: boolean; // disable add for owner
  className?: string;
}

export default function IssueComments({ issueId, disabled, className }: IssueCommentsProps) {
  const { user } = useAuth();
  const { data: comments, isLoading, addComment, userCommentCount, canAddTopLevel } = useComments(issueId);
  const [value, setValue] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canAdd = !!user && !disabled;

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
          return (
            <div key={comment.id} className="space-y-2">
              {/* Top-level comment */}
              <div className="rounded-md bg-white/70 backdrop-blur px-3 py-2 border">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-xs truncate mr-2">{comment.userName}</span>
                  <span className="text-[10px] text-gray-500 flex-shrink-0">
                    {(() => { 
                      if (typeof comment.createdAt === 'number') return new Date(comment.createdAt).toLocaleDateString(); 
                      const ts = comment as unknown as { createdAt?: { toDate?: () => Date } }; 
                      return ts.createdAt?.toDate ? ts.createdAt.toDate().toLocaleDateString() : ''; 
                    })()}
                  </span>
                </div>
                <p className="text-xs text-gray-700 break-words mb-2">{comment.content}</p>
                {canAdd && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-[10px]"
                    onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                  >
                    <Reply className="h-3 w-3 mr-1" />
                    Reply
                  </Button>
                )}
              </div>

              {/* Replies */}
              {replies.length > 0 && (
                <div className="ml-6 space-y-2 border-l-2 border-orange-200 pl-3">
                  {replies.map(reply => (
                    <div key={reply.id} className="rounded-md bg-orange-50/50 backdrop-blur px-2.5 py-1.5 border border-orange-100">
                      <div className="flex justify-between items-start mb-0.5">
                        <span className="font-medium text-[11px] truncate mr-2">{reply.userName}</span>
                        <span className="text-[9px] text-gray-500 flex-shrink-0">
                          {(() => { 
                            if (typeof reply.createdAt === 'number') return new Date(reply.createdAt).toLocaleDateString(); 
                            const ts = reply as unknown as { createdAt?: { toDate?: () => Date } }; 
                            return ts.createdAt?.toDate ? ts.createdAt.toDate().toLocaleDateString() : ''; 
                          })()}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-700 break-words">{reply.content}</p>
                    </div>
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
