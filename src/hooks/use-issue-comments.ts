import { useQuery } from '@tanstack/react-query';
import { getCommentsForIssue, CommentDoc } from '@/integrations/firebase/firestore';
import { isFirebaseConfigured } from '@/integrations/firebase/config';

export function useIssueComments(issueId?: string) {
  return useQuery<CommentDoc[]>({
    queryKey: ['issue-comments', issueId],
    enabled: isFirebaseConfigured && !!issueId,
    queryFn: async () => {
      if (!issueId) return [];
      return await getCommentsForIssue(issueId);
    },
    staleTime: 30000,
  });
}
