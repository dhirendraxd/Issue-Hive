import { useQuery } from '@tanstack/react-query';
import { getUserActivity, type UserActivity } from '@/integrations/firebase/firestore';
import { useAuth } from './use-auth';
import { isFirebaseConfigured } from '@/integrations/firebase/config';

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
        
        console.log('[UserActivity] ✅ Activity Summary:');
        console.log(`  📊 Total Engagement: ${totalEngagement}`);
        console.log(`  👍 Upvotes Given: ${upvotes}`);
        console.log(`  👎 Downvotes Given: ${downvotes}`);
        console.log(`  💬 Comments Made: ${totalComments} (${topLevelComments} top-level, ${replies} replies)`);
        console.log(`  ❤️  Comments Liked: ${commentsLiked}`);
        console.log(`  ⭐ Comment Likes Received: ${commentLikesReceived}`);
        console.log(`  🎯 Impact Score: ${commentLikesReceived}`);
        
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
    enabled: !!user && firebaseEnabled,
    staleTime: 5000, // Consider data fresh for 5 seconds
    refetchInterval: 10000, // Poll every 10 seconds for real-time feel
    retry: 2, // Retry failed requests twice
  });
}
