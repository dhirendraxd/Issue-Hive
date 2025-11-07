import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createComment, getCommentsForIssue, subscribeToComments, countUserTopLevelComments, Timestamp, type CommentDoc } from '@/integrations/firebase/firestore';
import { useAuth } from './use-auth';

export function useComments(issueId: string | undefined) {
  const qc = useQueryClient();
  const { user } = useAuth();

  // Set up real-time subscription for comments
  useEffect(() => {
    if (!issueId) return;

    const unsubscribe = subscribeToComments(
      issueId,
      (comments) => {
        // Update React Query cache with real-time data
        qc.setQueryData(['comments', issueId], comments);
      },
      (error) => {
        console.error('Real-time comments subscription error:', error);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [issueId, qc]);

  const commentsQuery = useQuery({
    enabled: !!issueId,
    queryKey: ['comments', issueId],
    queryFn: async () => {
      if (!issueId) return [] as CommentDoc[];
      return await getCommentsForIssue(issueId);
    },
    staleTime: Infinity, // Real-time updates handle freshness
    gcTime: Infinity, // Keep data in cache
  });

  // Query to get user's top-level comment count for this issue
  const userCommentCountQuery = useQuery({
    enabled: !!issueId && !!user,
    queryKey: ['user-comment-count', issueId, user?.uid],
    queryFn: async (): Promise<number> => {
      if (!issueId || !user) return 0;
      return await countUserTopLevelComments(issueId, user.uid);
    }
  });

  const addComment = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: string | null }) => {
      if (!user) throw new Error('Must be signed in');
      if (!issueId) throw new Error('No issueId');
      
      // Check if trying to add top-level comment and already at limit
      if (!parentId) {
        const count = userCommentCountQuery.data || 0;
        if (count >= 2) {
          throw new Error('You can only post 2 comments per issue. You can reply to existing comments instead.');
        }
      }
      
      const commentData: {
        issueId: string;
        userId: string;
        userName: string;
        content: string;
        parentId?: string;
      } = {
        issueId,
        userId: user.uid,
        userName: user.displayName || user.email || 'Anonymous',
        content,
      };
      
      // Only add parentId if it exists (for replies)
      if (parentId) {
        commentData.parentId = parentId;
      }
      
      const id = await createComment(commentData);
      return id;
    },
    // No need to invalidate - real-time subscription handles updates
    onSuccess: () => {
      // Still invalidate comment count since it's not real-time
      qc.invalidateQueries({ queryKey: ['user-comment-count', issueId, user?.uid] });
    }
  });

  return { 
    ...commentsQuery, 
    addComment,
    userCommentCount: userCommentCountQuery.data || 0,
    canAddTopLevel: (userCommentCountQuery.data || 0) < 2,
  };
}
