/**
 * DEPRECATED: This component was an early pass at issue filtering and is not used anymore.
 * Please use `IssuesFilterBar` in `src/components/IssuesFilterBar.tsx` instead.
 * Safe to delete when convenient.
 */
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ISSUE_CATEGORIES, ISSUE_STATUSES, type IssueCategory, type IssueStatus } from "@/types/issue";

export default function FilterBar({
  active,
  onActiveChange,
  category,
  onCategoryChange,
  q,
  onQChange,
}: {
  active: IssueStatus | "all";
  onActiveChange: (v: IssueStatus | "all") => void;
  category: IssueCategory | "All";
  onCategoryChange: (v: IssueCategory | "All") => void;
  q: string;
  onQChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 justify-between">
      <Tabs value={active} onValueChange={(v) => onActiveChange(v as IssueStatus | "all") }>
        <TabsList className="grid grid-cols-4 max-w-full overflow-x-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          {ISSUE_STATUSES.map((s) => (
            <TabsTrigger key={s.value} value={s.value}>{s.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="flex items-center gap-3 w-full md:w-auto">
        <Input
          placeholder="Search issues..."
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          className="w-full md:w-64"
        />
        <Select value={category} onValueChange={(v) => onCategoryChange(v as IssueCategory | "All") }>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Categories</SelectItem>
            {ISSUE_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
