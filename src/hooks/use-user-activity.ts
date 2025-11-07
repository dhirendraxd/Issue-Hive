import { useQuery } from '@tanstack/react-query';
import { getUserActivity, type UserActivity } from '@/integrations/firebase/firestore';
import { useAuth } from './use-auth';

/**
 * Hook to get the current user's activity (votes, comments, likes)
 */
export function useUserActivity() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-activity', user?.uid],
    queryFn: async () => {
      if (!user) {
        return {
          votedIssues: [],
          comments: [],
          likedComments: [],
        };
      }
      return await getUserActivity(user.uid);
    },
    enabled: !!user,
    staleTime: 5000, // Refresh every 5 seconds
    refetchInterval: 10000, // Poll every 10 seconds for fresh data
  });
}
