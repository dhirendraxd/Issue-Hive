import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ISSUE_CATEGORIES, ISSUE_STATUSES, type IssueCategory, type IssueStatus } from "@/types/issue";
import { ListFilter, Search, X, ChevronDown, SortDesc } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

export type SortKey = "new" | "old" | "votes";

export function IssuesFilterBar({
  q,
  onQChange,
  categories,
  onCategoriesChange,
  statuses,
  onStatusesChange,
  sort,
  onSortChange,
  className,
}: {
  q: string;
  onQChange: (v: string) => void;
  categories: IssueCategory[];
  onCategoriesChange: (v: IssueCategory[]) => void;
  statuses: IssueStatus[];
  onStatusesChange: (v: IssueStatus[]) => void;
  sort: SortKey;
  onSortChange: (v: SortKey) => void;
  className?: string;
}) {
  const allSelected = categories.length === 0;

  // Include all statuses (users can explicitly include/exclude "Received")
  const statusItems = useMemo(() => ISSUE_STATUSES, []);

  return (
    <div className={cn("rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg p-4 md:p-5", className)}>
      <div className="flex flex-col gap-3 md:gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
          {/* Search */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => onQChange(e.target.value)}
              placeholder="Search by title, description, or name..."
              className="pl-9 pr-9"
            />
            {q && (
              <button
                aria-label="Clear search"
                onClick={() => onQChange("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-black/5"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Categories */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-full">
                <ListFilter className="h-4 w-4 mr-2" />
                {allSelected ? "All Categories" : `${categories.length} selected`}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Categories</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ISSUE_CATEGORIES.map((c) => {
                const checked = categories.includes(c);
                return (
                  <DropdownMenuCheckboxItem
                    key={c}
                    checked={checked}
                    onCheckedChange={(v) => {
                      onCategoriesChange(
                        v
                          ? [...categories, c].filter((x, i, arr) => arr.indexOf(x) === i)
                          : categories.filter((x) => x !== c)
                      );
                    }}
                  >
                    {c}
                  </DropdownMenuCheckboxItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked={allSelected} onCheckedChange={() => onCategoriesChange([])}>
                Clear selection
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Status toggles */}
          <ToggleGroup type="multiple" value={statuses} onValueChange={(v) => onStatusesChange(v as IssueStatus[])} className="flex-wrap">
            {statusItems.map((s) => (
              <ToggleGroupItem key={s.value} value={s.value} aria-label={s.label} className="rounded-full">
                {s.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          {/* Sort */}
          <div className="ml-auto">
            <Select value={sort} onValueChange={(v) => onSortChange(v as SortKey)}>
              <SelectTrigger className="w-40 rounded-full">
                <SortDesc className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">Newest</SelectItem>
                <SelectItem value="old">Oldest</SelectItem>
                <SelectItem value="votes">Most Supported</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Selected category chips */}
        {!allSelected && (
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Badge key={c} variant="secondary" className="rounded-full pl-3 pr-2 py-1 bg-orange-50 text-orange-700 border border-orange-200">
                {c}
                <button
                  className="ml-2 rounded hover:bg-black/5 p-0.5"
                  aria-label={`Remove ${c}`}
                  onClick={() => onCategoriesChange(categories.filter((x) => x !== c))}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </Badge>
            ))}
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => onCategoriesChange([])}>
              Clear all
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
