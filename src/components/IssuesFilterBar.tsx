import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ISSUE_CATEGORIES, ISSUE_STATUSES, type IssueCategory, type IssueStatus } from "@/types/issue";
import { ListFilter, Search, X, ChevronDown, SortDesc, Filter, Inbox, Clock, CheckCircle2, Lock } from "lucide-react";
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
  const hasActiveFilters = categories.length > 0 || statuses.length > 0;

  // Include all statuses (users can explicitly include/exclude "Received")
  const statusItems = useMemo(() => ISSUE_STATUSES, []);

  return (
    <div className={cn("rounded-2xl border border-orange-200/50 bg-gradient-to-br from-white/90 to-orange-50/30 backdrop-blur-xl shadow-lg shadow-orange-500/5 p-5 md:p-6", className)}>
      {/* Header with active filters indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-orange-600" />
          <h3 className="text-base font-semibold text-stone-800">Filter Issues</h3>
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-700 border-orange-300">
              {(categories.length + statuses.length)} active
            </Badge>
          )}
        </div>
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              onCategoriesChange([]);
              onStatusesChange([]);
            }}
            className="text-orange-600 hover:text-orange-700 hover:bg-orange-100"
          >
            Clear all
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {/* Search Bar - Full Width */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-500" />
          <Input
            value={q}
            onChange={(e) => onQChange(e.target.value)}
            placeholder="Search by title, description, or author name..."
            className="pl-12 pr-12 h-12 text-base border-orange-200/50 focus:border-orange-400 focus:ring-orange-400/20 rounded-xl bg-white/80"
          />
          {q && (
            <button
              aria-label="Clear search"
              onClick={() => onQChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <X className="h-5 w-5 text-orange-600" />
            </button>
          )}
        </div>

        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Categories Dropdown */}
          <div className="flex-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto h-11 rounded-xl border-orange-200/50 hover:bg-orange-50 hover:border-orange-300 transition-colors justify-start"
                >
                  <ListFilter className="h-4 w-4 mr-2 text-orange-600" />
                  <span className="flex-1 text-left">
                    {allSelected ? "All Categories" : `${categories.length} ${categories.length === 1 ? 'category' : 'categories'}`}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 text-orange-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuLabel className="text-orange-600">Select Categories</DropdownMenuLabel>
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
                      className="cursor-pointer"
                    >
                      {c}
                    </DropdownMenuCheckboxItem>
                  );
                })}
                {!allSelected && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem 
                      checked={false} 
                      onCheckedChange={() => onCategoriesChange([])}
                      className="text-orange-600 cursor-pointer"
                    >
                      Clear selection
                    </DropdownMenuCheckboxItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Status Filter Section */}
          <div className="flex-1">
            <div className="text-xs font-medium text-stone-600 mb-2"></div>
            <ToggleGroup 
              type="multiple" 
              value={statuses} 
              onValueChange={(v) => onStatusesChange(v as IssueStatus[])} 
              className="justify-start gap-2 flex-wrap"
            >
              {statusItems.map((s) => {
                const statusConfig = {
                  received: { icon: Inbox },
                  "in-progress": { icon: Clock },
                  resolved: { icon: CheckCircle2 },
                  closed: { icon: Lock }
                }[s.value] || { icon: Inbox };
                
                const Icon = statusConfig.icon;
                
                return (
                  <ToggleGroupItem 
                    key={s.value} 
                    value={s.value} 
                    aria-label={s.label} 
                    className="rounded-xl data-[state=on]:bg-orange-100 data-[state=on]:text-orange-700 data-[state=on]:border-orange-300 hover:bg-orange-50 transition-colors h-10 px-3 sm:px-4 text-sm font-medium border border-orange-200/50 gap-1.5"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{s.label}</span>
                    <span className="sm:hidden">{s.label.split(' ')[0]}</span>
                  </ToggleGroupItem>
                );
              })}
            </ToggleGroup>
          </div>

          {/* Sort Dropdown */}
          <div className="flex-1 sm:flex-initial">
            <div className="text-xs font-medium text-stone-600 mb-2"></div>
            <Select value={sort} onValueChange={(v) => onSortChange(v as SortKey)}>
              <SelectTrigger className="w-full sm:w-48 h-11 rounded-xl border-orange-200/50 hover:bg-orange-50 hover:border-orange-300 transition-colors">
                <SortDesc className="h-4 w-4 mr-2 text-orange-600" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">🆕 Newest First</SelectItem>
                <SelectItem value="old">📅 Oldest First</SelectItem>
                <SelectItem value="votes">🔥 Most Supported</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Selected Categories Chips */}
        {!allSelected && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-orange-200/50">
            <span className="text-xs font-medium text-stone-600 flex items-center">
              Selected:
            </span>
            {categories.map((c) => (
              <Badge 
                key={c} 
                variant="secondary" 
                className="rounded-full pl-3 pr-2 py-1.5 bg-orange-100 text-orange-700 border border-orange-300 hover:bg-orange-200 transition-colors"
              >
                {c}
                <button
                  className="ml-2 rounded-full hover:bg-orange-300 p-0.5 transition-colors"
                  aria-label={`Remove ${c}`}
                  onClick={() => onCategoriesChange(categories.filter((x) => x !== c))}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
