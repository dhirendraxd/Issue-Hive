import { useQuery } from '@tanstack/react-query';
import { getUserVote, type VoteDoc } from '@/integrations/firebase/firestore';
import { useAuth } from './use-auth';

/**
 * Hook to get the current user's vote on an issue
 * Returns null if user hasn't voted, or VoteDoc with vote value (1 or -1)
 */
export function useUserVote(issueId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-vote', issueId, user?.uid],
    queryFn: async (): Promise<VoteDoc | null> => {
      if (!issueId || !user) return null;
      return await getUserVote(issueId, user.uid);
    },
    enabled: !!issueId && !!user,
  });
}
