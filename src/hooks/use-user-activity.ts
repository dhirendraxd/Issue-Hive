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
        } as UserActivity;
      }
      
      try {
        const activity = await getUserActivity(user.uid);
        console.log('[UserActivity] Fetched activity:', activity);
        return activity;
      } catch (error) {
        console.error('[UserActivity] Error fetching activity:', error);
        // Return empty activity on error
        return {
          votedIssues: [],
          comments: [],
          likedComments: [],
        } as UserActivity;
      }
    },
    enabled: !!user,
    staleTime: 30000, // Refresh every 30 seconds
    refetchInterval: 60000, // Poll every 60 seconds for fresh data
    retry: 2, // Retry failed requests twice
  });
}
