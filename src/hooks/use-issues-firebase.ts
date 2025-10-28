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
      attachments?: string[];
      user?: { name: string; avatar?: string };
    }) => {
      const issueData: Omit<Issue, "id" | "createdAt" | "updatedAt"> = {
        title: data.title,
        description: data.description,
        category: data.category,
        status: "received" as IssueStatus,
        votes: 0,
        attachments: data.attachments,
        user: data.user,
      };
      const newIssueId = await createIssue(issueData);
      return { id: newIssueId, ...issueData, createdAt: new Date().toISOString() };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["issues"] }),
  });

  const upvote = useMutation({
    mutationFn: async (id: string) => {
      const issues = issuesQuery.data ?? [];
      const issue = issues.find(i => i.id === id);
      if (!issue) throw new Error("Issue not found");
      
      await updateIssue(id, { votes: issue.votes + 1 });
      return id;
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

  return { ...issuesQuery, addIssue, upvote, setStatus, stats };
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
