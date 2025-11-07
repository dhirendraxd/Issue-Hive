import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createComment, getCommentsForIssue, Timestamp, type CommentDoc } from '@/integrations/firebase/firestore';
import { useAuth } from './use-auth';

export function useComments(issueId: string | undefined) {
  const qc = useQueryClient();
  const { user } = useAuth();

  const commentsQuery = useQuery({
    enabled: !!issueId,
    queryKey: ['comments', issueId],
    queryFn: async () => {
      if (!issueId) return [] as CommentDoc[];
      return await getCommentsForIssue(issueId);
    }
  });

  const addComment = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error('Must be signed in');
      if (!issueId) throw new Error('No issueId');
      const id = await createComment({
        issueId,
        userId: user.uid,
        userName: user.displayName || user.email || 'Anonymous',
        content,
      });
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', issueId] })
  });

  return { ...commentsQuery, addComment };
}
