import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
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
        updatedAt: new Date(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports-against-me'] });
      queryClient.invalidateQueries({ queryKey: ['reports-for-issue'] });
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
        updatedAt: new Date(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports-against-me'] });
      queryClient.invalidateQueries({ queryKey: ['reports-for-issue'] });
    },
  });
}
