import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Issue, IssueCategory, IssueStatus } from "@/types/issue";
import { 
  getIssues, 
  createIssue, 
  updateIssue,
  where,
  orderBy,
  Timestamp,
} from "@/integrations/firebase";

/**
 * Firebase-enabled version of useIssues hook
 * This replaces local storage with Firestore for persistent cloud storage
 */
export function useIssuesFirebase() {
  const qc = useQueryClient();

  const issuesQuery = useQuery({
    queryKey: ["issues"],
    queryFn: async () => {
      const issues = await getIssues([orderBy("createdAt", "desc")]);
      // Convert Firestore Timestamps to ISO strings for consistency
      return issues.map(issue => {
        const issueData: Issue = {
          ...issue,
          createdAt: typeof issue.createdAt === 'string' 
            ? issue.createdAt 
            : new Date().toISOString(),
          updatedAt: issue.updatedAt 
            ? (typeof issue.updatedAt === 'string' 
                ? issue.updatedAt 
                : new Date().toISOString())
            : undefined,
        };
        return issueData;
      });
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
        urgency: data.urgency,
        anonymous: data.anonymous,
        attachments: data.attachments,
      };
      const newIssueId = await createIssue(issueData);
      return { id: newIssueId, ...issueData };
    },
      onSuccess: () => qc.invalidateQueries(["issues"]),
  });

  const upvote = useMutation({
    mutationFn: async (id: string) => {
      const issues = issuesQuery.data ?? [];
      const issue = issues.find(i => i.id === id);
      if (!issue) throw new Error("Issue not found");
      
      await updateIssue(id, { votes: issue.votes + 1 });
      return id;
    },
      onSuccess: () => qc.invalidateQueries(["issues"]),
  });

  const upvoteIssue = useMutation({
    mutationFn: async (id: string) => {
      // Implement upvote logic (Firestore/Realtime DB)
      // Example: fetch issue, increment votes, update in DB
    },
      onSuccess: () => qc.invalidateQueries({ queryKey: ["issues"] }),
  });

  const downvoteIssue = useMutation({
    mutationFn: async (id: string) => {
      // Implement downvote logic (Firestore/Realtime DB)
      // Example: fetch issue, decrement votes, update in DB
    },
      onSuccess: () => qc.invalidateQueries({ queryKey: ["issues"] }),
  });

  const setStatus = useMutation({
    mutationFn: async (params: { id: string; status: IssueStatus }) => {
      await updateIssue(params.id, { status: params.status });
      return params.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["issues"] }),
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
    stats 
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
