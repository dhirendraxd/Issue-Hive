import { useState } from 'react';
import { useComments } from '@/hooks/use-comments';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

interface IssueCommentsProps {
  issueId: string;
  disabled?: boolean; // disable add for owner
  className?: string;
}

export default function IssueComments({ issueId, disabled, className }: IssueCommentsProps) {
  const { user } = useAuth();
  const { data: comments, isLoading, addComment } = useComments(issueId);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const canAdd = !!user && !disabled;

  return (
    <div className={cn('space-y-3', className)}>
      <h4 className="text-sm font-semibold">Comments</h4>
      {isLoading && <p className="text-xs text-muted-foreground">Loading comments...</p>}
      {!isLoading && (comments?.length ?? 0) === 0 && (
        <p className="text-xs text-muted-foreground">No comments yet.</p>
      )}
      <ul className="space-y-2 max-h-40 overflow-y-auto pr-1">
        {comments?.map(c => (
          <li key={c.id} className="rounded-md bg-white/70 backdrop-blur px-2.5 py-1.5 border text-xs">
            <div className="flex justify-between">
              <span className="font-medium mr-2 truncate">{c.userName}</span>
              <span className="text-[10px] text-gray-500">{(() => { if (typeof c.createdAt === 'number') return new Date(c.createdAt).toLocaleDateString(); const ts = c as unknown as { createdAt?: { toDate?: () => Date } }; return ts.createdAt?.toDate ? ts.createdAt.toDate().toLocaleDateString() : ''; })()}</span>
            </div>
            <p className="mt-0.5 text-gray-700 break-words">{c.content}</p>
          </li>
        ))}
      </ul>
      {canAdd && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            const content = value.trim();
            if (!content) return;
            try {
              await addComment.mutateAsync(content);
              setValue('');
            } catch (err) {
              setError((err as Error).message);
            }
          }}
          className="space-y-2"
        >
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Add a comment on this issue (others' issues only)"
            className="min-h-[60px] text-xs"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end">
            <Button
              size="sm"
              type="submit"
              disabled={addComment.isPending || !value.trim()}
              className="rounded-full"
            >
              {addComment.isPending ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </form>
      )}
      {!canAdd && (
        <p className="text-[10px] text-muted-foreground">{user ? 'You cannot comment on your own issue.' : 'Sign in to comment.'}</p>
      )}
    </div>
  );
}
