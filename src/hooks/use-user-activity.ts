import { useQuery } from '@tanstack/react-query';
import { getUserActivity, type UserActivity } from '@/integrations/firebase/firestore';
import { useAuth } from './use-auth';
import { isFirebaseConfigured } from '@/integrations/firebase/config';
import { logger } from '@/lib/logger';

/**
 * Hook to get the current user's activity (votes, comments, likes)
 * Automatically refetches data every 10 seconds and has a 5-second stale time
 */
export function useUserActivity() {
  const { user } = useAuth();

  const firebaseEnabled = isFirebaseConfigured;

  return useQuery({
    queryKey: ['user-activity', user?.uid],
    queryFn: async () => {
      if (!user || !firebaseEnabled) {
        return {
          votedIssues: [],
          comments: [],
          likedComments: [],
        } as UserActivity;
      }
      
      try {
        const activity = await getUserActivity(user.uid);
        
        // Calculate all metrics for logging
        const upvotes = activity.votedIssues.filter(v => v.vote === 1).length;
        const downvotes = activity.votedIssues.filter(v => v.vote === -1).length;
        const totalComments = activity.comments.length;
        const replies = activity.comments.filter(c => 'parentId' in c && c.parentId).length;
        const topLevelComments = totalComments - replies;
        const commentsLiked = activity.likedComments.length;
        const commentLikesReceived = activity.comments.reduce((sum, c) => sum + (c.likes || 0), 0);
        const totalEngagement = upvotes + downvotes + totalComments + commentsLiked;
        
        logger.debug('[UserActivity] ✅ Activity Summary:');
        logger.debug(`  📊 Total Engagement: ${totalEngagement}`);
        logger.debug(`  👍 Upvotes Given: ${upvotes}`);
        logger.debug(`  👎 Downvotes Given: ${downvotes}`);
        logger.debug(`  💬 Comments Made: ${totalComments} (${topLevelComments} top-level, ${replies} replies)`);
        logger.debug(`  ❤️  Comments Liked: ${commentsLiked}`);
        logger.debug(`  ⭐ Comment Likes Received: ${commentLikesReceived}`);
        logger.debug(`  🎯 Impact Score: ${commentLikesReceived}`);
        
        return activity;
      } catch (error) {
        // Suppress Firebase index errors - these are expected until indexes are created
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('requires an index') || errorMessage.includes('FirebaseError')) {
          logger.warn('[UserActivity] Firebase index not found - returning empty activity');
        } else {
          logger.error('[UserActivity] Error fetching activity:', error);
        }
        // Return empty activity on error
        return {
          votedIssues: [],
          comments: [],
          likedComments: [],
        } as UserActivity;
      }
    },
    enabled: !!user && firebaseEnabled,
    staleTime: 5000, // Consider data fresh for 5 seconds
    refetchInterval: 10000, // Poll every 10 seconds for real-time feel
    retry: 2, // Retry failed requests twice
  });
}
