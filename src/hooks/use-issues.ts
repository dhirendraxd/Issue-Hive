import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Issue, IssueCategory, IssueStatus } from "@/types/issue";
import { loadIssues, saveIssues, seedIfEmpty } from "@/lib/storage";

// Provide a few starter issues for first-run experience
const rid = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`);

const seed: Issue[] = [
  {
    id: rid(),
    title: "Wi‑Fi is unreliable in Library 2nd Floor",
    description:
      "Connectivity drops frequently during peak hours making it hard to access online resources.",
    category: "Facilities",
    status: "received",
    createdAt: new Date().toISOString(),
    votes: 12,
  },
  {
    id: rid(),
    title: "Extend cafeteria hours during exams",
    description:
      "Many students study late; having warm food options until 11 PM would help.",
    category: "Administration",
    status: "in_progress",
    createdAt: new Date().toISOString(),
    votes: 34,
  },
  {
    id: rid(),
    title: "More charging stations in classrooms",
    description:
      "Outlets are limited and far from desks; add charging rails along walls.",
    category: "Facilities",
    status: "resolved",
    createdAt: new Date().toISOString(),
    votes: 21,
  },
];

seedIfEmpty(seed);

export function useIssues() {
  const qc = useQueryClient();

  const issuesQuery = useQuery({
    queryKey: ["issues"],
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
        id: rid(),
        title: data.title,
        description: data.description,
        category: data.category,
        status: "received",
        createdAt: new Date().toISOString(),
        votes: 0,
        attachments: data.attachments,
      };
      saveIssues([newIssue, ...current]);
      return newIssue;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["issues"] }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["issues"] }),
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
