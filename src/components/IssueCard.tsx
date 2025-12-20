import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Issue } from '@/types/issue';
import { ISSUE_VISIBILITIES, type IssueVisibility } from '@/types/issue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { TrendingUp, Clock, MessageSquare, ThumbsUp, ThumbsDown, CheckCircle2, MoreHorizontal, Globe, Lock, FileText, Eye } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { isFirebaseConfigured } from '@/integrations/firebase/config';
import { cn } from '@/lib/utils';

interface IssueCardProps {
  issue: Issue;
  engagement?: {
    comments: number;
    commentLikes: number;
    upvotes?: number;
    downvotes?: number;
  };
  onSetVisibility: (id: string, visibility: IssueVisibility) => void;
  onSetStatus?: (id: string, status: 'received' | 'in_progress' | 'resolved') => void;
  onAddProgress?: (issue: Issue) => void;
  onResolve?: (issue: Issue) => void;
}

const statusColors = {
  received: 'bg-blue-500',
  in_progress: 'bg-yellow-500',
  resolved: 'bg-green-500',
};

export default function IssueCard({ issue, engagement, onSetVisibility, onSetStatus, onAddProgress, onResolve }: IssueCardProps) {
  const getVisibilityIcon = (visibility: IssueVisibility) => {
    switch (visibility) {
      case 'public':
        return <Globe className="h-3.5 w-3.5 text-green-600" />;
      case 'private':
        return <Lock className="h-3.5 w-3.5 text-orange-600" />;
      case 'draft':
        return <FileText className="h-3.5 w-3.5 text-gray-600" />;
      default:
        return <Globe className="h-3.5 w-3.5 text-green-600" />;
    }
  };

  const getVisibilityBadgeClass = (visibility: IssueVisibility) => {
    switch (visibility) {
      case 'public':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'private':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'draft':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      default:
        return 'bg-green-100 text-green-700 border-green-300';
    }
  };

  return (
    <div className="p-4 rounded-lg glass-card hover:shadow-lg hover:shadow-orange-400/20 hover:border-orange-200/40 transition-all duration-300">
      <div className="flex items-start gap-3">
        <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${statusColors[issue.status]}`} />
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Link 
                to="/issues" 
                className="font-display font-medium text-sm truncate hover:text-orange-600 transition-colors"
              >
                {issue.title}
              </Link>
              {issue.visibility && issue.visibility !== 'public' && (
                <Badge 
                  variant="outline"
                  className={cn("text-[10px] px-2 py-0.5 flex items-center gap-1 flex-shrink-0 border", getVisibilityBadgeClass(issue.visibility))}
                >
                  {getVisibilityIcon(issue.visibility)}
                  {issue.visibility}
                </Badge>
              )}
              {issue.status !== 'received' && (
                <Badge 
                  variant={issue.status === 'resolved' ? 'default' : 'secondary'}
                  className="text-[10px] capitalize flex-shrink-0"
                >
                  {issue.status.replace('_', ' ')}
                </Badge>
              )}
            </div>
            {onSetStatus && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 flex-shrink-0 hover:bg-emerald-100 hover:text-emerald-600 transition-colors"
                    title="Change status"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex items-center gap-2 pb-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Change Status</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup
                    value={issue.status}
                    onValueChange={(value) => onSetStatus(issue.id, value as 'received' | 'in_progress' | 'resolved')}
                  >
                    <DropdownMenuRadioItem 
                      value="received"
                      className="cursor-pointer py-2 px-3 focus:bg-blue-50"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="font-medium text-sm">Pending</span>
                      </div>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem 
                      value="in_progress"
                      className="cursor-pointer py-2 px-3 focus:bg-amber-50"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="font-medium text-sm">In Progress</span>
                      </div>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem 
                      value="resolved"
                      className="cursor-pointer py-2 px-3 focus:bg-emerald-50"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="font-medium text-sm">Resolved</span>
                      </div>
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 flex-shrink-0 hover:bg-orange-100 hover:text-orange-600 transition-colors"
                  title="Change visibility"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="flex items-center gap-2 pb-2">
                  <Eye className="h-4 w-4 text-orange-600" />
                  <span>Change Visibility</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={issue.visibility || 'public'}
                  onValueChange={(value) => onSetVisibility(issue.id, value as IssueVisibility)}
                >
                  <DropdownMenuRadioItem 
                    value="public"
                    className="cursor-pointer py-3 px-3 focus:bg-green-50"
                  >
                    <div className="flex items-start gap-3">
                      <Globe className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-semibold text-sm">Public</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Visible to everyone on the platform
                        </div>
                      </div>
                    </div>
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem 
                    value="private"
                    className="cursor-pointer py-3 px-3 focus:bg-orange-50"
                  >
                    <div className="flex items-start gap-3">
                      <Lock className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-semibold text-sm">Private</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Only you can see this issue
                        </div>
                      </div>
                    </div>
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem 
                    value="draft"
                    className="cursor-pointer py-3 px-3 focus:bg-gray-50"
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-semibold text-sm">Draft</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Save as draft, edit before publishing
                        </div>
                      </div>
                    </div>
                  </DropdownMenuRadioItem>
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
            {isFirebaseConfigured && engagement && (
              <>
                <span className="flex items-center gap-1" title="Upvotes">
                  <ThumbsUp className="h-3 w-3 text-green-600" /> {engagement.upvotes || 0}
                </span>
                <span className="flex items-center gap-1" title="Downvotes">
                  <ThumbsDown className="h-3 w-3 text-red-600" /> {engagement.downvotes || 0}
                </span>
                <span className="flex items-center gap-1" title="Comments on this issue">
                  <MessageSquare className="h-3 w-3 text-blue-600" /> {engagement.comments}
                </span>
              </>
            )}
            {(!isFirebaseConfigured || !engagement) && (
              <span className="flex items-center gap-1" title="Net votes">
                <TrendingUp className="h-3 w-3" /> {issue.votes}
              </span>
            )}
            {issue.progressUpdates?.length ? (
              <span className="flex items-center gap-1" title="Progress updates">
                <Clock className="h-3 w-3" /> {issue.progressUpdates.length}
              </span>
            ) : null}
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
