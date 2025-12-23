import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/integrations/firebase/config';
import { useAuth } from './use-auth';

export interface Report {
  id: string;
  reportedUserId: string;
  reportedUserName: string;
  reporterId: string;
  reporterName: string;
  reporterEmail?: string;
  reason: string;
  details: string;
  context?: {
    issueId?: string;
    issueTitle?: string;
    commentId?: string;
  };
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: { toMillis?: () => number; seconds?: number; nanoseconds?: number } | Date | number;
  updatedAt: { toMillis?: () => number; seconds?: number; nanoseconds?: number } | Date | number;
  upvotes?: number;
  downvotes?: number;
  reportCount?: number;
  reasonCount?: number;
  clarification?: string;
  clarificationBy?: string;
  clarificationAt?: { toMillis?: () => number; seconds?: number; nanoseconds?: number } | Date | number;
  userVote?: 1 | -1 | 0; // 1 for upvote, -1 for downvote, 0 for no vote
}

/**
 * Fetch reports filed against a specific user's content
 * Used by issue owners to see reports on their issues/comments
 */
export function useReportsAgainstMe() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['reports-against-me', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];

      const reportsRef = collection(db, 'reports');
      const q = query(
        reportsRef,
        where('reportedUserId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return await Promise.all(snapshot.docs.map(async (doc) => {
        const reportData = doc.data() as Report;
        
        // Fetch vote counts from subcollection
        const votesRef = collection(db, 'reports', doc.id, 'votes');
        const votesSnapshot = await getDocs(votesRef);
        
        let upvotes = 0;
        let downvotes = 0;
        
        votesSnapshot.docs.forEach(voteDoc => {
          const voteType = voteDoc.data().voteType;
          if (voteType === 'upvote') {
            upvotes++;
          } else if (voteType === 'downvote') {
            downvotes++;
          }
        });
        
        return {
          id: doc.id,
          ...reportData,
          upvotes,
          downvotes
        };
      })) as Report[];
    },
    enabled: !!user?.uid,
  });
}

/**
 * Fetch comment reports filed against a specific user's comments
 */
export function useCommentReportsAgainstMe() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['comment-reports-against-me', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];

      const reportsRef = collection(db, 'comment_reports');
      const q = query(
        reportsRef,
        where('commentAuthorId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return await Promise.all(snapshot.docs.map(async (doc) => {
        const reportData = doc.data() as Report;
        
        // Fetch vote counts from subcollection
        const votesRef = collection(db, 'comment_reports', doc.id, 'votes');
        const votesSnapshot = await getDocs(votesRef);
        
        let upvotes = 0;
        let downvotes = 0;
        
        votesSnapshot.docs.forEach(voteDoc => {
          const voteType = voteDoc.data().voteType;
          if (voteType === 'upvote') {
            upvotes++;
          } else if (voteType === 'downvote') {
            downvotes++;
          }
        });
        
        return {
          id: doc.id,
          ...reportData,
          upvotes,
          downvotes
        };
      })) as Report[];
    },
    enabled: !!user?.uid,
  });
}

/**
 * Fetch comment reports filed on the user's issues
 * Used by issue owners to see reports on comments in their issues
 */
export function useCommentReportsOnMyIssues(issueIds: string[]) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['comment-reports-on-my-issues', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];

      const reportsRef = collection(db, 'comment_reports');
      // Use issueOwnerId instead of issueId to avoid 'in' query limit of 10
      const q = query(
        reportsRef,
        where('issueOwnerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return await Promise.all(snapshot.docs.map(async (doc) => {
        const reportData = doc.data() as Report;
        
        // Fetch vote counts from subcollection
        const votesRef = collection(db, 'comment_reports', doc.id, 'votes');
        const votesSnapshot = await getDocs(votesRef);
        
        let upvotes = 0;
        let downvotes = 0;
        
        votesSnapshot.docs.forEach(voteDoc => {
          const voteType = voteDoc.data().voteType;
          if (voteType === 'upvote') {
            upvotes++;
          } else if (voteType === 'downvote') {
            downvotes++;
          }
        });
        
        return {
          id: doc.id,
          ...reportData,
          upvotes,
          downvotes
        };
      })) as Report[];
    },
    enabled: !!user?.uid,
  });
}

/**
 * Fetch all pending/reviewed reports that the user can review
 * Excludes reports about the user themselves
 */
export function useReviewableReports() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['reviewable-reports', user?.uid],
    queryFn: async () => {
      if (!user?.uid) {
        return [];
      }

      try {
        const reportsRef = collection(db, 'reports');
        const q = query(reportsRef);
        const snapshot = await getDocs(q);
        
        let reports = await Promise.all(snapshot.docs.map(async (doc) => {
          const reportData = doc.data() as Report;
          
          // Fetch vote counts from subcollection
          const votesRef = collection(db, 'reports', doc.id, 'votes');
          const votesSnapshot = await getDocs(votesRef);
          
          let upvotes = 0;
          let downvotes = 0;
          
          votesSnapshot.docs.forEach(voteDoc => {
            const voteType = voteDoc.data().voteType;
            if (voteType === 'upvote') {
              upvotes++;
            } else if (voteType === 'downvote') {
              downvotes++;
            }
          });
          
          return {
            id: doc.id,
            ...reportData,
            upvotes,
            downvotes
          };
        })) as Report[];

        // Filter by status
        reports = reports.filter(r => r.status === 'pending' || r.status === 'reviewed');
        
        // Include all reports (including ones about the current user so they can clarify)

        return reports;
      } catch (error) {
        console.error('[useReviewableReports] Error fetching reports:', error);
        throw error;
      }
    },
    enabled: !!user?.uid,
  });
}

/**
 * Fetch reports for a specific issue
 * Shows all reports filed against an issue and its comments
 */
export function useReportsForIssue(issueId: string) {
  return useQuery({
    queryKey: ['reports-for-issue', issueId],
    queryFn: async () => {
      if (!issueId) return [];

      const reportsRef = collection(db, 'reports');
      const q = query(
        reportsRef,
        where('context.issueId', '==', issueId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Report[];
    },
    enabled: !!issueId,
  });
}

/**
 * Vote on a report's validity
 * upvote = true means the user thinks the report is valid
 * upvote = false means the user disagrees with the report
 */
export function useVoteOnReport() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reportId,
      upvote,
    }: {
      reportId: string;
      upvote: boolean;
    }) => {
      if (!user?.uid) throw new Error('Must be signed in to vote');

      try {
        const votesRef = collection(db, 'reports', reportId, 'votes');
        const existingVoteQuery = query(votesRef, where('userId', '==', user.uid));
        const existingVotes = await getDocs(existingVoteQuery);

        let oldVoteType: 'upvote' | 'downvote' | null = null;
        
        if (existingVotes.docs.length > 0) {
          const existingVote = existingVotes.docs[0];
          oldVoteType = existingVote.data().voteType;
          // Delete old vote
          await deleteDoc(existingVote.ref);
        }

        const newVoteType = upvote ? 'upvote' : 'downvote';
        
        // Add new vote if it's different from old vote
        if (oldVoteType !== newVoteType) {
          await addDoc(votesRef, {
            userId: user.uid,
            voteType: newVoteType,
            createdAt: serverTimestamp(),
          });
          
          return { reportId, upvote, oldVoteType, newVoteType, changed: true };
        }
        
        return { reportId, upvote, oldVoteType, newVoteType, changed: false };
      } catch (error) {
        console.error('[useVoteOnReport] Error:', error);
        throw error;
      }
    },
    onMutate: async ({ reportId, upvote }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['reviewable-reports'] });
      
      // Get previous data
      const previousReports = queryClient.getQueryData<Report[]>(['reviewable-reports', user?.uid]);
      const previousVotes = queryClient.getQueryData<Record<string, 1 | -1 | 0>>(['user-report-votes']) || {};
      
      // Get current user vote to calculate delta correctly
      const currentVote = previousVotes[reportId] || 0;
      
      // Optimistically update the cache
      queryClient.setQueryData<Report[]>(
        ['reviewable-reports', user?.uid],
        (old) => {
          if (!old) return old;
          return old.map(report => {
            if (report.id === reportId) {
              // Calculate new counts based on vote switching
              let upvotes = report.upvotes || 0;
              let downvotes = report.downvotes || 0;
              
              // Remove old vote if it exists
              if (currentVote === 1) {
                upvotes = Math.max(0, upvotes - 1);
              } else if (currentVote === -1) {
                downvotes = Math.max(0, downvotes - 1);
              }
              
              // Add new vote if different from old
              if (currentVote !== (upvote ? 1 : -1)) {
                if (upvote) {
                  upvotes += 1;
                } else {
                  downvotes += 1;
                }
              }
              
              return { ...report, upvotes, downvotes };
            }
            return report;
          });
        }
      );
      
      // Update user votes optimistically
      queryClient.setQueryData<Record<string, 1 | -1 | 0>>(
        ['user-report-votes'],
        (old) => {
          const updated = { ...old };
          if (currentVote === (upvote ? 1 : -1)) {
            // Same vote clicked - toggle off
            updated[reportId] = 0;
          } else {
            // Different vote or first vote
            updated[reportId] = upvote ? 1 : -1;
          }
          return updated;
        }
      );
      
      return { previousReports, previousVotes };
    },
    onError: (err, variables, context) => {
      console.error('[useVoteOnReport] Mutation failed:', err);
      // Rollback on error
      if (context?.previousReports) {
        queryClient.setQueryData(['reviewable-reports', user?.uid], context.previousReports);
      }
      if (context?.previousVotes) {
        queryClient.setQueryData(['user-report-votes'], context.previousVotes);
      }
    },
    onSuccess: () => {
      // Invalidate to fetch fresh data from Firestore
      queryClient.invalidateQueries({ queryKey: ['reviewable-reports'] });
      queryClient.invalidateQueries({ queryKey: ['report-votes-count'] });
      queryClient.invalidateQueries({ queryKey: ['report-vote'] });
      queryClient.invalidateQueries({ queryKey: ['user-report-votes'] });
      queryClient.invalidateQueries({ queryKey: ['reports-for-issue'] });
    },
  });
}

/**
 * Get user's vote on a specific report
 */
export function useReportVote(reportId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['report-vote', reportId, user?.uid],
    queryFn: async () => {
      if (!user?.uid || !reportId) return 0;

      const votesRef = collection(db, 'reports', reportId, 'votes');
      const q = query(votesRef, where('userId', '==', user.uid));
      const snapshot = await getDocs(q);

      if (snapshot.docs.length === 0) return 0;
      
      const voteType = snapshot.docs[0].data().voteType;
      return voteType === 'upvote' ? 1 : -1;
    },
    enabled: !!user?.uid && !!reportId,
  });
}

/**
 * Get vote counts for a specific report
 */
export function useReportVoteCounts(reportId: string) {
  return useQuery({
    queryKey: ['report-votes-count', reportId],
    queryFn: async () => {
      if (!reportId) return { upvotes: 0, downvotes: 0 };

      const votesRef = collection(db, 'reports', reportId, 'votes');
      const snapshot = await getDocs(votesRef);

      let upvotes = 0;
      let downvotes = 0;

      snapshot.docs.forEach(doc => {
        if (doc.data().voteType === 'upvote') {
          upvotes++;
        } else {
          downvotes++;
        }
      });

      return { upvotes, downvotes };
    },
    enabled: !!reportId,
  });
}

/**
 * Update report status (reviewed, resolved, dismissed)
 */
export function useUpdateReportStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reportId,
      status,
    }: {
      reportId: string;
      status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
    }) => {
      const reportRef = doc(db, 'reports', reportId);
      await updateDoc(reportRef, {
        status,
        updatedAt: serverTimestamp(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports-against-me'] });
      queryClient.invalidateQueries({ queryKey: ['reports-for-issue'] });
      queryClient.invalidateQueries({ queryKey: ['reviewable-reports'] });
    },
  });
}

/**
 * Delete a reported comment
 */
export function useDeleteReportedComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      issueId,
      commentId,
    }: {
      issueId: string;
      commentId: string;
    }) => {
      // Delete the comment document
      const commentRef = doc(db, 'issues', issueId, 'comments', commentId);
      await deleteDoc(commentRef);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      queryClient.invalidateQueries({ queryKey: ['reports-against-me'] });
      queryClient.invalidateQueries({ queryKey: ['reports-for-issue'] });
    },
  });
}

/**
 * Keep a reported comment (mark report as dismissed)
 */
export function useKeepReportedComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reportId: string) => {
      const reportRef = doc(db, 'reports', reportId);
      await updateDoc(reportRef, {
        status: 'dismissed',
        updatedAt: serverTimestamp(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports-against-me'] });
      queryClient.invalidateQueries({ queryKey: ['reports-for-issue'] });
    },
  });
}

/**
 * Submit clarification for a report (for reported users)
 */
export function useSubmitClarification() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      reportId,
      clarification,
    }: {
      reportId: string;
      clarification: string;
    }) => {
      if (!user?.uid) throw new Error('User not authenticated');
      
      const reportRef = doc(db, 'reports', reportId);
      await updateDoc(reportRef, {
        clarification: clarification.trim(),
        clarificationBy: user.uid,
        clarificationAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviewable-reports'] });
      queryClient.invalidateQueries({ queryKey: ['reports-against-me'] });
      queryClient.invalidateQueries({ queryKey: ['reports-for-issue'] });
    },
  });
}
