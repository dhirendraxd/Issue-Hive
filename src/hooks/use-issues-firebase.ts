import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Issue, IssueCategory, IssueStatus, IssueVisibility } from "@/types/issue";
import { 
  getIssues,
  getIssue,
  createIssue, 
  updateIssue,
  getUserVote,
  setVote,
  where,
  orderBy,
  Timestamp,
} from "@/integrations/firebase";
import { useAuth } from "./use-auth";

/**
 * Firebase-enabled version of useIssues hook
 * This replaces local storage with Firestore for persistent cloud storage
 */
export function useIssuesFirebase() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const issuesQuery = useQuery({
    queryKey: ["issues-firebase"],
    queryFn: async () => {
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["issues-firebase"] }),
  });

  const upvote = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Must be signed in');
      await setVote(id, user.uid, 1);
      return id;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["issues-firebase"] });
      await qc.invalidateQueries({ queryKey: ["user-vote"] });
      await qc.refetchQueries({ queryKey: ["issues-firebase"] });
    },
  });

  const upvoteIssue = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Must be signed in');
      await setVote(id, user.uid, 1);
      return id;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["issues-firebase"] });
      await qc.invalidateQueries({ queryKey: ["user-vote"] });
      await qc.refetchQueries({ queryKey: ["issues-firebase"] });
    },
  });

  const downvoteIssue = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Must be signed in');
      await setVote(id, user.uid, -1);
      return id;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["issues-firebase"] });
      await qc.invalidateQueries({ queryKey: ["user-vote"] });
      await qc.refetchQueries({ queryKey: ["issues-firebase"] });
    },
  });

  const setStatus = useMutation({
    mutationFn: async (params: { id: string; status: IssueStatus }) => {
      await updateIssue(params.id, { status: params.status });
      return params.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["issues-firebase"] }),
  });

  const setVisibility = useMutation({
    mutationFn: async (params: { id: string; visibility: IssueVisibility }) => {
      await updateIssue(params.id, { visibility: params.visibility });
      return params.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["issues-firebase"] }),
  });

  const resolveIssue = useMutation({
    mutationFn: async (params: { id: string; message: string; photos?: string[] }) => {
      if (!user) throw new Error('Must be signed in');
      
      await updateIssue(params.id, {
        status: 'resolved' as IssueStatus,
        resolution: {
          message: params.message,
          photos: params.photos && params.photos.length > 0 ? params.photos : undefined,
          resolvedAt: Date.now(),
          resolvedBy: user.uid,
        },
      });
      return params.id;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["issues-firebase"] });
      await qc.refetchQueries({ queryKey: ["issues-firebase"] });
    },
  });

  const addProgress = useMutation({
    mutationFn: async (params: { id: string; message: string; photos?: string[] }) => {
      if (!user) throw new Error('Must be signed in');
      
      // Get current issue to append to existing progressUpdates
      const issueDoc = await getIssue(params.id);
      if (!issueDoc) throw new Error('Issue not found');
      
      const existingUpdates = issueDoc.progressUpdates || [];
      const newUpdate = {
        message: params.message,
        photos: params.photos && params.photos.length > 0 ? params.photos : undefined,
        updatedAt: Date.now(),
        updatedBy: user.uid,
      };
      
      await updateIssue(params.id, {
        progressUpdates: [...existingUpdates, newUpdate],
        hasRecentProgress: true,
        updatedAt: Date.now(),
      });
      return params.id;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["issues-firebase"] });
      await qc.refetchQueries({ queryKey: ["issues-firebase"] });
    },
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
