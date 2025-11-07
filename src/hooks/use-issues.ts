import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Issue, IssueCategory, IssueStatus } from "@/types/issue";
import { loadIssues, saveIssues } from "@/lib/storage";

export function useIssues() {
  const qc = useQueryClient();

  const issuesQuery = useQuery({
    queryKey: ["issues-local"],
    queryFn: async () => loadIssues(),
  });

  const addIssue = useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      category: IssueCategory;
      attachments?: string[];
    }) => {
      const current = loadIssues();
      const newIssue: Issue = {
        id: (typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`),
        title: data.title,
        description: data.description,
        category: data.category,
        status: "received",
        // Local storage version uses numbers for consistency with Firebase
        createdAt: Date.now(),
        updatedAt: Date.now(),
        votes: 0,
        createdBy: "local",
        createdByName: "Anonymous",
        attachments: data.attachments,
      } as unknown as Issue;
      saveIssues([newIssue, ...current]);
      return newIssue;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["issues-local"] }),
  });

  const upvote = useMutation({
    mutationFn: async (id: string) => {
      const current = loadIssues();
      const updated = current.map((i) =>
        i.id === id ? { ...i, votes: i.votes + 1 } : i
      );
      saveIssues(updated);
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["issues-local"] }),
  });

  const setStatus = useMutation({
    mutationFn: async (params: { id: string; status: IssueStatus }) => {
      const current = loadIssues();
      const updated = current.map((i) =>
        i.id === params.id ? { ...i, status: params.status } : i
      );
      saveIssues(updated);
      return params.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["issues-local"] }),
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
