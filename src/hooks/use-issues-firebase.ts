import { useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Issue, IssueCategory, IssueStatus, IssueVisibility } from "@/types/issue";
import { 
  getIssues,
  getIssue,
  createIssue, 
  updateIssue,
  getUserVote,
  setVote,
  subscribeToIssues,
  where,
  orderBy,
  Timestamp,
} from "@/integrations/firebase";
import { useAuth } from "./use-auth";
import { isFirebaseConfigured } from "@/integrations/firebase/config";

/**
 * Firebase-enabled version of useIssues hook
 * This replaces local storage with Firestore for persistent cloud storage
 * Now with REAL-TIME updates using onSnapshot
 */
export function useIssuesFirebase() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const firebaseEnabled = isFirebaseConfigured;

  // Use real-time subscription for issues
  useEffect(() => {
    if (!firebaseEnabled) return;

    const unsubscribe = subscribeToIssues(
      (issues) => {
        // Convert Firestore Timestamps to numbers for consistency
        const isTimestamp = (v: unknown): v is Timestamp =>
          typeof v === 'object' && v !== null && 'toMillis' in (v as Record<string, unknown>);
        const toMillis = (v: unknown): number => {
          if (typeof v === 'number') return v;
          if (isTimestamp(v)) return v.toMillis();
          return Date.now();
        };
        const normalizedIssues = issues.map((issue) => ({
          ...issue,
          createdAt: toMillis((issue as unknown as { createdAt?: unknown }).createdAt),
          updatedAt: toMillis((issue as unknown as { updatedAt?: unknown }).updatedAt),
        } as Issue));
        
        // Update React Query cache with real-time data
        qc.setQueryData(["issues-firebase"], normalizedIssues);
      },
      (error) => {
        console.error('Real-time issues subscription error:', error);
      },
      [orderBy("createdAt", "desc")]
    );

    return () => {
      unsubscribe();
    };
  }, [qc, firebaseEnabled]);

  const issuesQuery = useQuery({
    queryKey: ["issues-firebase"],
    queryFn: async () => {
      if (!firebaseEnabled) return [] as Issue[];
      const issues = await getIssues([orderBy("createdAt", "desc")]);
      // Convert Firestore Timestamps to numbers for consistency
      const isTimestamp = (v: unknown): v is Timestamp =>
        typeof v === 'object' && v !== null && 'toMillis' in (v as Record<string, unknown>);
      const toMillis = (v: unknown): number => {
        if (typeof v === 'number') return v;
        if (isTimestamp(v)) return v.toMillis();
        return Date.now();
      };
      return issues.map((issue) => ({
        ...issue,
        createdAt: toMillis((issue as unknown as { createdAt?: unknown }).createdAt),
        updatedAt: toMillis((issue as unknown as { updatedAt?: unknown }).updatedAt),
      } as Issue));
    },
    staleTime: Infinity, // Real-time updates handle freshness
    gcTime: Infinity, // Keep data in cache
  });

  const addIssue = useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      category: IssueCategory;
      status: string;
      votes: number;
      createdBy: string;
      createdByName: string;
      createdAt: number;
      updatedAt: number;
      urgency?: 'low' | 'medium' | 'high';
      anonymous?: boolean;
      attachments?: string[];
    }) => {
      if (!firebaseEnabled) throw new Error('Cloud features are disabled (Firebase not configured).');
      // Only send fields required by Firestore rules, plus optional UI fields
      const issueData = {
        title: data.title,
        description: data.description,
        category: data.category,
          status: data.status as IssueStatus,
        votes: data.votes,
        createdBy: data.createdBy,
        createdByName: data.createdByName,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        visibility: 'public' as IssueVisibility,
        urgency: data.urgency,
        anonymous: data.anonymous,
        attachments: data.attachments,
      };
      const newIssueId = await createIssue(issueData);
      return { id: newIssueId, ...issueData };
    },
    // No need to invalidate - real-time subscription handles updates
  });

  const upvote = useMutation({
    mutationFn: async (id: string) => {
      if (!firebaseEnabled) throw new Error('Cloud features are disabled (Firebase not configured).');
      if (!user) throw new Error('Must be signed in');
      await setVote(id, user.uid, 1);
      return id;
    },
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["issues-firebase"] });
      await qc.cancelQueries({ queryKey: ["user-vote", id, user?.uid] });
      
      const previousIssues = qc.getQueryData<Issue[]>(["issues-firebase"]);
      const previousVote = qc.getQueryData(["user-vote", id, user?.uid]);
      
      if (previousIssues) {
        qc.setQueryData<Issue[]>(["issues-firebase"], (old) => {
          if (!old) return old;
          return old.map(issue => {
            if (issue.id === id) {
              const currentVote = qc.getQueryData<{ vote: number }>(["user-vote", id, user?.uid]);
              let voteChange = 1;
              if (currentVote?.vote === 1) voteChange = -1;
              else if (currentVote?.vote === -1) voteChange = 2;
              return { ...issue, votes: Math.max(0, issue.votes + voteChange) };
            }
            return issue;
          });
        });
      }
      
      // Update user vote cache
      const currentVote = qc.getQueryData<{ vote: number }>(["user-vote", id, user?.uid]);
      if (currentVote?.vote === 1) {
        // Removing upvote
        qc.setQueryData(["user-vote", id, user?.uid], null);
      } else {
        // Adding or switching to upvote
        qc.setQueryData(["user-vote", id, user?.uid], { vote: 1 });
      }
      
      return { previousIssues, previousVote };
    },
    onError: (err, id, context) => {
      if (context?.previousIssues) {
        qc.setQueryData(["issues-firebase"], context.previousIssues);
      }
      if (context?.previousVote !== undefined) {
        qc.setQueryData(["user-vote", id, user?.uid], context.previousVote);
      }
    },
    // Keep UI in sync for analytics
    onSettled: (_data, _error, id) => {
      if (user?.uid) {
        qc.invalidateQueries({ queryKey: ["user-activity", user.uid] });
      }
    },
  });

  const upvoteIssue = useMutation({
    mutationFn: async (id: string) => {
      if (!firebaseEnabled) throw new Error('Cloud features are disabled (Firebase not configured).');
      if (!user) throw new Error('Must be signed in');
      await setVote(id, user.uid, 1);
      return id;
    },
    onMutate: async (id: string) => {
      // Cancel outgoing refetches
      await qc.cancelQueries({ queryKey: ["issues-firebase"] });
      await qc.cancelQueries({ queryKey: ["user-vote", id, user?.uid] });
      
      // Snapshot previous value
      const previousIssues = qc.getQueryData<Issue[]>(["issues-firebase"]);
      const previousVote = qc.getQueryData(["user-vote", id, user?.uid]);
      
      // Optimistically update the cache
      if (previousIssues) {
        qc.setQueryData<Issue[]>(["issues-firebase"], (old) => {
          if (!old) return old;
          return old.map(issue => {
            if (issue.id === id) {
              // Get current user vote to determine increment
              const currentVote = qc.getQueryData<{ vote: number }>(["user-vote", id, user?.uid]);
              let voteChange = 1;
              if (currentVote?.vote === 1) voteChange = -1; // removing upvote
              else if (currentVote?.vote === -1) voteChange = 2; // switching from downvote
              
              return { ...issue, votes: Math.max(0, issue.votes + voteChange) };
            }
            return issue;
          });
        });
      }
      
      // Update user vote cache
      const currentVote = qc.getQueryData<{ vote: number }>(["user-vote", id, user?.uid]);
      if (currentVote?.vote === 1) {
        // Removing upvote
        qc.setQueryData(["user-vote", id, user?.uid], null);
      } else {
        // Adding or switching to upvote
        qc.setQueryData(["user-vote", id, user?.uid], { vote: 1 });
      }
      
      return { previousIssues, previousVote };
    },
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousIssues) {
        qc.setQueryData(["issues-firebase"], context.previousIssues);
      }
      if (context?.previousVote !== undefined) {
        qc.setQueryData(["user-vote", id, user?.uid], context.previousVote);
      }
    },
    // No onSuccess invalidation needed - real-time subscription handles it
  });

  const downvoteIssue = useMutation({
    mutationFn: async (id: string) => {
      if (!firebaseEnabled) throw new Error('Cloud features are disabled (Firebase not configured).');
      if (!user) throw new Error('Must be signed in');
      await setVote(id, user.uid, -1);
      return id;
    },
    onMutate: async (id: string) => {
      // Cancel outgoing refetches
      await qc.cancelQueries({ queryKey: ["issues-firebase"] });
      await qc.cancelQueries({ queryKey: ["user-vote", id, user?.uid] });
      
      // Snapshot previous value
      const previousIssues = qc.getQueryData<Issue[]>(["issues-firebase"]);
      const previousVote = qc.getQueryData(["user-vote", id, user?.uid]);
      
      // Optimistically update the cache
      if (previousIssues) {
        qc.setQueryData<Issue[]>(["issues-firebase"], (old) => {
          if (!old) return old;
          return old.map(issue => {
            if (issue.id === id) {
              // Get current user vote to determine decrement
              const currentVote = qc.getQueryData<{ vote: number }>(["user-vote", id, user?.uid]);
              let voteChange = -1;
              if (currentVote?.vote === -1) voteChange = 1; // removing downvote
              else if (currentVote?.vote === 1) voteChange = -2; // switching from upvote
              
              return { ...issue, votes: Math.max(0, issue.votes + voteChange) };
            }
            return issue;
          });
        });
      }
      
      // Update user vote cache
      const currentVote = qc.getQueryData<{ vote: number }>(["user-vote", id, user?.uid]);
      if (currentVote?.vote === -1) {
        // Removing downvote
        qc.setQueryData(["user-vote", id, user?.uid], null);
      } else {
        // Adding or switching to downvote
        qc.setQueryData(["user-vote", id, user?.uid], { vote: -1 });
      }
      
      return { previousIssues, previousVote };
    },
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousIssues) {
        qc.setQueryData(["issues-firebase"], context.previousIssues);
      }
      if (context?.previousVote !== undefined) {
        qc.setQueryData(["user-vote", id, user?.uid], context.previousVote);
      }
    },
    // Keep UI in sync for analytics
    onSettled: (_data, _error, id) => {
      if (user?.uid) {
        qc.invalidateQueries({ queryKey: ["user-activity", user.uid] });
      }
    },
  });

  const setStatus = useMutation({
    mutationFn: async (params: { id: string; status: IssueStatus }) => {
      if (!firebaseEnabled) throw new Error('Cloud features are disabled (Firebase not configured).');
      await updateIssue(params.id, { status: params.status });
      return params.id;
    },
    // No invalidation needed - real-time subscription handles it
  });

  const setVisibility = useMutation({
    mutationFn: async (params: { id: string; visibility: IssueVisibility }) => {
      if (!firebaseEnabled) throw new Error('Cloud features are disabled (Firebase not configured).');
      await updateIssue(params.id, { visibility: params.visibility });
      return params.id;
    },
    // No invalidation needed - real-time subscription handles it
  });

  const resolveIssue = useMutation({
    mutationFn: async (params: { id: string; message: string; photos?: string[] }) => {
      if (!firebaseEnabled) throw new Error('Cloud features are disabled (Firebase not configured).');
      if (!user) throw new Error('Must be signed in');
      // 1) Set status first (widely permitted by rules)
      await updateIssue(params.id, { status: 'resolved' as IssueStatus });
      // 2) Then set resolution payload (requires owner and status already resolved)
      const resolutionPayload = {
        resolution: {
          message: params.message,
          photos: params.photos && params.photos.length > 0 ? params.photos : undefined,
          resolvedAt: Date.now(),
          resolvedBy: user.uid,
        },
      } as const;
      try {
        await updateIssue(params.id, resolutionPayload);
      } catch (e) {
        // Don't fail the whole mutation if status already updated; UI stays resolved and
        // real-time snapshot will reconcile resolution field later.
        console.warn('[resolveIssue] Resolution payload failed to save, status updated', e);
      }
      return params.id;
    },
    onMutate: async (params) => {
      // Optimistically mark as resolved in cache
      await qc.cancelQueries({ queryKey: ["issues-firebase"] });
      const previousIssues = qc.getQueryData<Issue[]>(["issues-firebase"]);
      const optimisticAt = Date.now();
      if (previousIssues) {
        qc.setQueryData<Issue[]>(["issues-firebase"], (old) => {
          if (!old) return old;
          return old.map((issue) =>
            issue.id === params.id
              ? {
                  ...issue,
                  status: 'resolved',
                  updatedAt: optimisticAt,
                  resolution: {
                    message: params.message,
                    photos: params.photos && params.photos.length > 0 ? params.photos : undefined,
                    resolvedAt: optimisticAt,
                    resolvedBy: user?.uid || 'me',
                    __optimistic: true,
                  },
                }
              : issue
          );
        });
      }
      return { previousIssues };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previousIssues) {
        qc.setQueryData(["issues-firebase"], ctx.previousIssues);
      }
    },
    onSuccess: (id) => {
      // Strip __optimistic flag once real-time update arrives (best-effort cleanup after slight delay)
      setTimeout(() => {
        qc.setQueryData<Issue[]>(["issues-firebase"], (old) => {
          if (!old) return old;
          return old.map(issue => {
            const res = issue.resolution as (Issue['resolution'] & { __optimistic?: boolean }) | undefined;
            if (issue.id === id && res && res.__optimistic) {
              const { __optimistic: _omit, ...clean } = res;
              return { ...issue, resolution: clean } as Issue;
            }
            return issue;
          });
        });
      }, 2000);
    },
    // No invalidation needed - real-time subscription handles it
  });

  const addProgress = useMutation({
    mutationFn: async (params: { id: string; message: string; photos?: string[] }) => {
      if (!firebaseEnabled) throw new Error('Cloud features are disabled (Firebase not configured).');
      if (!user) throw new Error('Must be signed in');
      
      // Get current issue to append to existing progressUpdates
      const issueDoc = await getIssue(params.id);
      if (!issueDoc) throw new Error('Issue not found');
      
      const existingUpdates = (issueDoc.progressUpdates || []).map((u) => {
        // Strip undefined photos to satisfy Firestore (no undefined allowed)
        const { photos, ...rest } = u as NonNullable<Issue['progressUpdates']>[number] & { photos?: string[] };
        return photos && photos.length > 0 ? { ...rest, photos } : rest;
      });

      const baseUpdate: NonNullable<Issue['progressUpdates']>[number] = {
        message: params.message,
        updatedAt: Date.now(),
        updatedBy: user.uid,
      };
      const newUpdate = (params.photos && params.photos.length > 0)
        ? { ...baseUpdate, photos: params.photos }
        : baseUpdate;

      // Build payload without any undefined fields
      const payload: Partial<Issue> = {
        progressUpdates: [...existingUpdates, newUpdate],
        hasRecentProgress: true,
      };

      await updateIssue(params.id, payload);
      return params.id;
    },
    onMutate: async (params) => {
      // Optimistically append progress update to cache
      await qc.cancelQueries({ queryKey: ["issues-firebase"] });
      const previousIssues = qc.getQueryData<Issue[]>(["issues-firebase"]);
      const optimisticAt = Date.now();
      const optimisticUpdate = {
        message: params.message,
        photos: params.photos && params.photos.length > 0 ? params.photos : undefined,
        updatedAt: optimisticAt,
        updatedBy: user?.uid || 'me',
      } as NonNullable<Issue['progressUpdates']>[number];
      if (previousIssues) {
        qc.setQueryData<Issue[]>(["issues-firebase"], (old) => {
          if (!old) return old;
          return old.map((issue) =>
            issue.id === params.id
              ? {
                  ...issue,
                  updatedAt: optimisticAt,
                  hasRecentProgress: true,
                  progressUpdates: [...(issue.progressUpdates ?? []), optimisticUpdate],
                }
              : issue
          );
        });
      }
      return { previousIssues };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previousIssues) {
        qc.setQueryData(["issues-firebase"], ctx.previousIssues);
      }
    },
    // No invalidation needed - real-time subscription handles it
  });

  const stats = useMemo(() => {
    const list = issuesQuery.data ?? [];
    const total = list.length;
    const open = list.filter((i) => i.status !== "resolved").length;
    const votes = list.reduce((acc, i) => acc + i.votes, 0);
    return { total, open, votes };
  }, [issuesQuery.data]);

  return {
    ...issuesQuery,
    addIssue,
    upvote,
    upvoteIssue,
    downvoteIssue,
    setStatus,
    setVisibility,
    resolveIssue,
    addProgress,
    stats,
  };
}

/**
 * Get issues filtered by category
 */
export function useIssuesByCategory(category: IssueCategory) {
  return useQuery({
    queryKey: ["issues", "category", category],
    queryFn: async () => {
      const issues = await getIssues([
        where("category", "==", category),
        orderBy("createdAt", "desc"),
      ]);
      return issues;
    },
  });
}

/**
 * Get issues filtered by status
 */
export function useIssuesByStatus(status: IssueStatus) {
  return useQuery({
    queryKey: ["issues", "status", status],
    queryFn: async () => {
      const issues = await getIssues([
        where("status", "==", status),
        orderBy("createdAt", "desc"),
      ]);
      return issues;
    },
  });
}
