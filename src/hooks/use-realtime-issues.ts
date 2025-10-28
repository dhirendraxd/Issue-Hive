/**
 * React Hook for Firebase Realtime Database
 * Provides real-time data synchronization with automatic cleanup
 */

import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import {
  subscribeToRealtimeIssues,
  createRealtimeIssue,
  updateRealtimeIssue,
  deleteRealtimeIssue,
  incrementRealtimeIssueVotes,
  getRealtimeIssuesByStatus,
  getRealtimeIssuesByUser,
  RealtimeIssue,
} from '@/integrations/firebase/realtime';
import type { IssueCategory, IssueStatus } from '@/types/issue';

export function useRealtimeIssues() {
  const { user } = useAuth();
  const [issues, setIssues] = useState<RealtimeIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Subscribe to real-time updates
  useEffect(() => {
    setLoading(true);
    
    const unsubscribe = subscribeToRealtimeIssues(
      (updatedIssues) => {
        setIssues(updatedIssues);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Create a new issue
  const addIssue = async (issueData: {
    title: string;
    description: string;
    category: IssueCategory;
  }) => {
    if (!user) {
      throw new Error('Must be logged in to create issues');
    }

    const newIssue = {
      ...issueData,
      status: 'open' as IssueStatus,
      votes: 0,
      createdBy: user.uid,
      createdByName: user.displayName || user.email || 'Anonymous',
    };

    return await createRealtimeIssue(newIssue);
  };

  // Update an issue
  const updateIssue = async (issueId: string, updates: Partial<RealtimeIssue>) => {
    return await updateRealtimeIssue(issueId, updates);
  };

  // Delete an issue
  const removeIssue = async (issueId: string) => {
    return await deleteRealtimeIssue(issueId);
  };

  // Vote on an issue
  const voteIssue = async (issueId: string) => {
    return await incrementRealtimeIssueVotes(issueId);
  };

  // Calculate stats
  const stats = {
    total: issues.length,
    open: issues.filter((i) => i.status === 'open').length,
    inProgress: issues.filter((i) => i.status === 'in_progress').length,
    resolved: issues.filter((i) => i.status === 'resolved').length,
  };

  return {
    issues,
    loading,
    error,
    stats,
    addIssue,
    updateIssue,
    removeIssue,
    voteIssue,
  };
}

// Hook for filtered issues
export function useRealtimeIssuesFiltered(filters?: {
  status?: IssueStatus;
  category?: IssueCategory;
  userId?: string;
}) {
  const [issues, setIssues] = useState<RealtimeIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchFilteredIssues = async () => {
      setLoading(true);
      try {
        let filteredIssues: RealtimeIssue[];

        if (filters?.status) {
          filteredIssues = await getRealtimeIssuesByStatus(filters.status);
          // Apply additional client-side filters
          if (filters?.category) {
            filteredIssues = filteredIssues.filter((i) => i.category === filters.category);
          }
          setIssues(filteredIssues);
          setLoading(false);
        } else if (filters?.userId) {
          filteredIssues = await getRealtimeIssuesByUser(filters.userId);
          // Apply additional client-side filters
          if (filters?.category) {
            filteredIssues = filteredIssues.filter((i) => i.category === filters.category);
          }
          setIssues(filteredIssues);
          setLoading(false);
        } else {
          // Subscribe to all if no filters
          const unsubscribe = subscribeToRealtimeIssues(
            (updatedIssues) => {
              let result = updatedIssues;
              if (filters?.category) {
                result = result.filter((i) => i.category === filters.category);
              }
              setIssues(result);
              setLoading(false);
            },
            (err) => {
              setError(err);
              setLoading(false);
            }
          );
          return unsubscribe;
        }
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    };

    const cleanup = fetchFilteredIssues();
    return () => {
      if (cleanup instanceof Promise) {
        cleanup.then((unsubscribe) => {
          if (typeof unsubscribe === 'function') {
            unsubscribe();
          }
        });
      }
    };
  }, [filters?.status, filters?.category, filters?.userId]);

  return { issues, loading, error };
}
