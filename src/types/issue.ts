export type IssueStatus = "received" | "in_progress" | "resolved";

export type IssueCategory =
  | "Facilities"
  | "Academics"
  | "Administration"
  | "Events"
  | "Other";

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  status: IssueStatus;
  createdAt: string; // ISO date
  updatedAt?: string; // ISO date (for Firebase)
  votes: number;
  attachments?: string[]; // store URLs for now
  user?: {
    name: string;
    avatar?: string;
  };
  userId?: string; // Track the actual user ID even for anonymous posts
}

export const ISSUE_STATUSES: { value: IssueStatus; label: string }[] = [
  { value: "received", label: "Received" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
];

export const ISSUE_CATEGORIES: IssueCategory[] = [
  "Facilities",
  "Academics",
  "Administration",
  "Events",
  "Other",
];
