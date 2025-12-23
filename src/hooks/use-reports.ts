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
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
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
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
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
      if (!user?.uid) return [];

      try {
        const reportsRef = collection(db, 'reports');
        // Query all reports ordered by creation date
        const q = query(
          reportsRef,
          orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        
        let reports = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Report[];

        // Filter by status in JavaScript
        reports = reports.filter(r => r.status === 'pending' || r.status === 'reviewed');
        
        // Filter out reports about the current user
        reports = reports.filter(r => r.reportedUserId !== user.uid);

        return reports;
      } catch (error) {
        console.error('[useReviewableReports] Query error:', error);
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

      // Add new vote if it's different from old vote
      if (oldVoteType !== (upvote ? 'upvote' : 'downvote')) {
        await addDoc(votesRef, {
          userId: user.uid,
          userName: user.displayName || 'Anonymous',
          voteType: upvote ? 'upvote' : 'downvote',
          createdAt: serverTimestamp(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviewable-reports'] });
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
