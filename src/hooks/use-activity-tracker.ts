import { useQuery } from '@tanstack/react-query';
import { useAuth } from './use-auth';
import { getActivitySummary, type ActivitySummary } from '@/lib/activity-tracker';
import { getUserActivity } from '@/integrations/firebase/firestore';
import { isFirebaseConfigured } from '@/integrations/firebase/config';

/**
 * Hook to get user activity with local tracking + Firebase sync
 * Uses local storage for instant updates and Firebase for accuracy
 */
export function useActivityTracker() {
  const { user } = useAuth();
  const firebaseEnabled = isFirebaseConfigured;

  // Local activity query (instant updates)
  const localActivityQuery = useQuery({
    queryKey: ['local-activity', user?.uid],
    queryFn: () => {
      if (!user) {
        return {
          upvotesGiven: 0,
          downvotesGiven: 0,
          commentsMade: 0,
          repliesMade: 0,
          commentsLiked: 0,
          totalEngagement: 0,
          activities: [],
        } as ActivitySummary;
      }
      
      const summary = getActivitySummary(user.uid);
      console.log('[ActivityTracker] 📊 Local Activity Summary:', summary);
      return summary;
    },
    enabled: !!user,
    staleTime: 0, // Always fresh from localStorage
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Firebase activity query (accurate counts with comment likes received)
  const firebaseActivityQuery = useQuery({
    queryKey: ['firebase-activity', user?.uid],
    queryFn: async () => {
      if (!user || !firebaseEnabled) {
        return null;
      }
      
      try {
        const activity = await getUserActivity(user.uid);
        
        // Calculate metrics
        const commentLikesReceived = activity.comments.reduce((sum, c) => sum + (c.likes || 0), 0);
        
        console.log('[ActivityTracker] ☁️  Firebase Activity:', {
          votedIssues: activity.votedIssues.length,
          comments: activity.comments.length,
          likedComments: activity.likedComments.length,
          commentLikesReceived,
        });
        
        return {
          votedIssues: activity.votedIssues,
          comments: activity.comments,
          likedComments: activity.likedComments,
          commentLikesReceived,
        };
      } catch (error) {
        console.error('[ActivityTracker] Error fetching Firebase activity:', error);
        return null;
      }
    },
    enabled: !!user && firebaseEnabled,
    staleTime: 10000, // Refresh every 10 seconds
    refetchInterval: 30000, // Poll every 30 seconds
    retry: 2,
  });

  // Combine local and Firebase data for complete picture
  const combinedData = {
    // Local data for instant counts
    local: localActivityQuery.data || {
      upvotesGiven: 0,
      downvotesGiven: 0,
      commentsMade: 0,
      repliesMade: 0,
      commentsLiked: 0,
      totalEngagement: 0,
      activities: [],
    },
    // Firebase data for accurate verification and comment likes received
    firebase: firebaseActivityQuery.data,
    // Loading states
    isLoadingLocal: localActivityQuery.isLoading,
    isLoadingFirebase: firebaseActivityQuery.isLoading,
    isLoading: localActivityQuery.isLoading || firebaseActivityQuery.isLoading,
  };

  return combinedData;
}
