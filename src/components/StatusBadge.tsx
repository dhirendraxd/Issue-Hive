import { Badge } from "@/components/ui/badge";
import type { IssueStatus } from "@/types/issue";
import { ISSUE_STATUSES } from "@/types/issue";
import { cn } from "@/lib/utils";

function statusColor(status: IssueStatus) {
  switch (status) {
    case "received":
      return "bg-gray-200 text-gray-900";
    case "in_progress":
      return "bg-amber-200 text-amber-900";
    case "resolved":
      return "bg-emerald-200 text-emerald-900";
  }
}

export default function StatusBadge({ status }: { status: IssueStatus }) {
  const label = ISSUE_STATUSES.find((s) => s.value === status)?.label ?? status;
  return <Badge className={cn(statusColor(status))}>{label}</Badge>;
}
