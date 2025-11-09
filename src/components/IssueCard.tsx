import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Issue } from '@/types/issue';
import { ISSUE_VISIBILITIES, type IssueVisibility } from '@/types/issue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@/components/ui/dropdown-menu';
import { TrendingUp, Clock, MessageSquare, ThumbsUp, CheckCircle2, MoreHorizontal } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { isFirebaseConfigured } from '@/integrations/firebase/config';

interface IssueCardProps {
  issue: Issue;
  engagement?: {
    comments: number;
    commentLikes: number;
  };
  onSetVisibility: (id: string, visibility: IssueVisibility) => void;
  onAddProgress?: (issue: Issue) => void;
  onResolve?: (issue: Issue) => void;
}

const statusColors = {
  received: 'bg-blue-500',
  in_progress: 'bg-yellow-500',
  resolved: 'bg-green-500',
};

export default function IssueCard({ issue, engagement, onSetVisibility, onAddProgress, onResolve }: IssueCardProps) {
  return (
    <div className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-3">
        <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${statusColors[issue.status]}`} />
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Link 
                to="/issues" 
                className="font-medium text-sm truncate hover:text-orange-600 transition-colors"
              >
                {issue.title}
              </Link>
              {issue.visibility && issue.visibility !== 'public' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 uppercase tracking-wide flex-shrink-0">
                  {issue.visibility}
                </span>
              )}
              <Badge 
                variant={issue.status === 'resolved' ? 'default' : 'secondary'}
                className="text-[10px] capitalize flex-shrink-0"
              >
                {issue.status.replace('_', ' ')}
              </Badge>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Visibility</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={issue.visibility || 'public'}
                  onValueChange={(value) => onSetVisibility(issue.id, value as IssueVisibility)}
                >
                  <DropdownMenuRadioItem value="public">Public</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="private">Private</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="draft">Draft</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {issue.description}
          </p>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 mb-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="text-xs">
              {issue.category}
            </Badge>
            <span title={`Updated ${formatRelativeTime(new Date(issue.updatedAt))}`}>
              Updated {formatRelativeTime(new Date(issue.updatedAt))}
            </span>
          </div>

          {/* Engagement Metrics */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1" title="Supports (net votes)">
              <TrendingUp className="h-3 w-3" /> {issue.votes}
            </span>
            {issue.progressUpdates?.length ? (
              <span className="flex items-center gap-1" title="Progress updates">
                <Clock className="h-3 w-3" /> {issue.progressUpdates.length}
              </span>
            ) : null}
            {isFirebaseConfigured && engagement && (
              <>
                <span className="flex items-center gap-1" title="Comments on this issue">
                  <MessageSquare className="h-3 w-3" /> {engagement.comments}
                </span>
                <span className="flex items-center gap-1" title="Total likes across all comments">
                  <ThumbsUp className="h-3 w-3" /> {engagement.commentLikes}
                </span>
              </>
            )}
          </div>

          {/* Actions */}
          {issue.status !== 'resolved' && (onAddProgress || onResolve) && (
            <div className="flex items-center gap-2 flex-wrap">
              {onAddProgress && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAddProgress(issue)}
                  className="text-xs h-7"
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Add Progress
                </Button>
              )}
              {onResolve && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onResolve(issue)}
                  className="text-xs h-7"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Mark Resolved
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
