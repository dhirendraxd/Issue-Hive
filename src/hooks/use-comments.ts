import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createComment, getCommentsForIssue, subscribeToComments, countUserTopLevelComments, pinComment, Timestamp, type CommentDoc } from '@/integrations/firebase/firestore';
import { useAuth } from './use-auth';
import { logActivity } from '@/lib/activity-tracker';

// Temporary ID generator for optimistic updates
const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
      return { id, commentData };
    },
    onMutate: async ({ content, parentId }) => {
      // Cancel outgoing refetches
      await qc.cancelQueries({ queryKey: ['comments', issueId] });
      
      // Snapshot previous value
      const previousComments = qc.getQueryData<CommentDoc[]>(['comments', issueId]);
      
      // Create optimistic comment
      const tempId = generateTempId();
      const optimisticComment: CommentDoc = {
        id: tempId,
        issueId: issueId!,
        userId: user!.uid,
        userName: user!.displayName || user!.email || 'Anonymous',
        content,
        likes: 0,
        createdAt: Timestamp.now(),
        ...(parentId && { parentId }), // Only add parentId if it exists
      };
      
      // Optimistically update comments list
      qc.setQueryData<CommentDoc[]>(['comments', issueId], (old) => {
        if (!old) return [optimisticComment];
        return [...old, optimisticComment];
      });
      
      return { previousComments, tempId };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousComments) {
        qc.setQueryData(['comments', issueId], context.previousComments);
      }
    },
    onSuccess: (data, variables, context) => {
      // Replace temporary comment with real one from server
      qc.setQueryData<CommentDoc[]>(['comments', issueId], (old) => {
        if (!old) return old;
        
        // Remove the temp comment and let real-time subscription add the real one
        return old.filter(c => c.id !== context?.tempId);
      });
      
      // Still invalidate comment count since it's not real-time
      qc.invalidateQueries({ queryKey: ['user-comment-count', issueId, user?.uid] });
      // Update user activity analytics
      if (user?.uid) {
        qc.invalidateQueries({ queryKey: ['user-activity', user.uid] });
        qc.invalidateQueries({ queryKey: ['local-activity', user.uid] });
        
        // Log activity to local storage
        if (variables.parentId) {
          logActivity(user.uid, 'reply', {
            issueId,
            commentId: data.id,
            parentCommentId: variables.parentId,
            content: variables.content,
          });
        } else {
          logActivity(user.uid, 'comment', {
            issueId,
            commentId: data.id,
            content: variables.content,
          });
        }
      }
    }
  });

  const pinCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      if (!user) throw new Error('Must be signed in');
      if (!issueId) throw new Error('No issueId');
      
      return await pinComment(commentId, issueId, user.uid);
    },
    onMutate: async (commentId: string) => {
      await qc.cancelQueries({ queryKey: ['comments', issueId] });
      const previousComments = qc.getQueryData<CommentDoc[]>(['comments', issueId]);
      
      qc.setQueryData<CommentDoc[]>(['comments', issueId], (old) => {
        if (!old) return old;
        return old.map((comment) => {
          if (comment.id === commentId) {
            if (comment.pinnedAt) {
              const { pinnedAt, pinnedBy, ...rest } = comment;
              return rest as CommentDoc;
            } else {
              return { ...comment, pinnedAt: Timestamp.now(), pinnedBy: user!.uid };
            }
          }
          return comment;
        });
      });
      
      return { previousComments };
    },
    onError: (err, variables, context) => {
      if (context?.previousComments) {
        qc.setQueryData(['comments', issueId], context.previousComments);
      }
    },
  });

  return { 
    ...commentsQuery, 
    addComment,
    pinComment: pinCommentMutation,
    userCommentCount: userCommentCountQuery.data || 0,
    canAddTopLevel: true, // Allow unlimited comments
  };
}
