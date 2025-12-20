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
  urgency?: "low" | "medium" | "high";
  votes: number;
  status: IssueStatus;
  /** Visibility of the issue content. 'public' visible to all; 'private' masked for non-owner; 'draft' hidden from listings except owner */
  visibility?: IssueVisibility;
  createdBy: string;
  createdByName: string;
  /** Profile photo URL of the user who created the issue */
  createdByPhotoURL?: string;
  /** Optional college name for context */
  college?: string;
  anonymous?: boolean;
  createdAt: number;
  updatedAt: number;
  attachments?: string[]; // store URLs for now
  /** Status change history - tracks when status was changed and by whom */
  statusHistory?: Array<{
    status: IssueStatus;
    changedAt: number;
    changedBy: string;
    message?: string;
    photos?: string[];
  }>;
  /** Resolution details when issue is marked as resolved by owner */
  resolution?: {
    message: string;
    photos?: string[];
    resolvedAt: number;
    resolvedBy: string;
  };
  /** Progress updates - array of updates added by the issue owner */
  progressUpdates?: Array<{
    message: string;
    photos?: string[];
    updatedAt: number;
    updatedBy: string;
  }>;
  /** Flag to indicate if issue has recent progress updates (for badge display) */
  hasRecentProgress?: boolean;
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

export type IssueVisibility = 'public' | 'private' | 'draft';

export const ISSUE_VISIBILITIES: { value: IssueVisibility; label: string }[] = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
  { value: 'draft', label: 'Draft' },
];
