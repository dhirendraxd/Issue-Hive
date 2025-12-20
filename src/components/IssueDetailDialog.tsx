import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar, Tag, AlertCircle, User, FileText, CheckCircle2, TrendingUp, Lock, ChevronDown, ChevronUp, MessageSquare, Eye, EyeOff, FileEdit, MoreVertical, Flag, ThumbsUp, ThumbsDown } from "lucide-react";
import { ISSUE_STATUSES } from "@/types/issue";
import type { Issue } from "@/types/issue";
import IssueComments from "./IssueComments";
import ReportUserDialog from "./ReportUserDialog";
import StatusUpdateDialog from "./StatusUpdateDialog";
import { useAuth } from "@/hooks/use-auth";
import { useUserVote } from "@/hooks/use-user-vote";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useIssuesFirebase } from "@/hooks/use-issues-firebase";
import { isFirebaseConfigured } from "@/integrations/firebase/config";
import { cn, formatRelativeTime } from "@/lib/utils";
import { getUserAvatarUrl } from "@/lib/avatar";
import { useState, useEffect } from "react";

interface IssueDetailDialogProps {
  issue: Issue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVisibilityChange?: (issueId: string, visibility: 'public' | 'private' | 'draft') => void;
  onSetStatus?: (issueId: string, status: 'received' | 'in_progress' | 'resolved', message?: string, photos?: string[]) => void;
  enablePin?: boolean; // allow pin UI in comments for this context
}

export default function IssueDetailDialog({
  issue,
  open,
  onOpenChange,
  onVisibilityChange,
  onSetStatus,
  enablePin = false,
}: IssueDetailDialogProps) {
  const { user } = useAuth();
  const { data: userVote } = useUserVote(issue?.id);
  const { data: creatorProfile } = useUserProfile(issue?.createdBy);
  const { upvoteIssue, downvoteIssue, setStatus } = useIssuesFirebase();
  const [commentsExpanded, setCommentsExpanded] = useState(true);
  const [visibility, setVisibility] = useState<'public' | 'private' | 'draft'>('public');
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [statusUpdateDialogOpen, setStatusUpdateDialogOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<'received' | 'in_progress' | 'resolved' | null>(null);
  
  // Sync visibility state with issue prop
  useEffect(() => {
    if (issue) {
      const issueVisibility = (issue as Issue & { visibility?: 'public' | 'private' | 'draft' }).visibility || 'public';
      setVisibility(issueVisibility);
    }
  }, [issue]);

  if (!issue) return null;

  const isOwner = user?.uid === issue.createdBy;
  const isAnonymous = issue.anonymous === true;
  const isPrivate = (issue as Issue & { visibility?: 'public' | 'private' | 'draft' }).visibility === 'private';
  
  // Only disable comments for private issues when user is not the owner
  const disableComments = isPrivate && !isOwner;
  const hasUpvoted = userVote?.vote === 1;
  const hasDownvoted = userVote?.vote === -1;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "received":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "in_progress":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "resolved":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case "high":
        return "text-red-600 bg-red-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "low":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  // Helper function to determine if a status option should be disabled
  // Status progression is one-way: pending → in-progress → resolved
  const isStatusDisabled = (targetStatus: 'received' | 'in_progress' | 'resolved') => {
    const currentStatus = issue.status;
    
    // Can't change to current status
    if (currentStatus === targetStatus) return true;
    
    // If in progress, can only move to resolved (not back to pending)
    if (currentStatus === 'in_progress' && targetStatus === 'received') return true;
    
    // If resolved, can't move back to any status
    if (currentStatus === 'resolved') return true;
    
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 space-y-3">
          {/* User info header */}
          <div className="flex items-center gap-3">
            {isAnonymous ? (
              <Avatar className="h-12 w-12 flex-shrink-0 border-2 border-orange-500/20">
                <AvatarImage src={issue.createdByPhotoURL || getUserAvatarUrl(issue.createdBy)} />
                <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-500 text-white text-sm font-semibold">
                  <img src={issue.createdByPhotoURL || getUserAvatarUrl(issue.createdBy)} alt="" className="w-full h-full" />
                </AvatarFallback>
              </Avatar>
            ) : (
              <Link to={`/u/${issue.createdBy}`} onClick={(e) => e.stopPropagation()}>
                <Avatar className="h-12 w-12 flex-shrink-0 border-2 border-orange-500/20">
                  <AvatarImage src={issue.createdByPhotoURL || getUserAvatarUrl(issue.createdBy)} />
                  <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-500 text-white text-sm font-semibold">
                    <img src={issue.createdByPhotoURL || getUserAvatarUrl(issue.createdBy)} alt="" className="w-full h-full" />
                  </AvatarFallback>
                </Avatar>
              </Link>
            )}
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-display font-semibold truncate">
                {creatorProfile?.displayName || issue.createdByName || "Anonymous"}
              </DialogTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span title={new Date(issue.createdAt).toLocaleString()}>{formatRelativeTime(issue.createdAt)}</span>
              </div>
            </div>
            {issue.anonymous && (
              <Badge variant="outline" className="text-xs">
                Posted Anonymously
              </Badge>
            )}
            {isPrivate && (
              <Badge variant="outline" className="text-xs bg-orange-50 border-orange-300 text-orange-700 flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Private Issue
              </Badge>
            )}
            {isOwner && onSetStatus && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 px-3 py-2 h-auto hover:bg-emerald-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {issue.status === 'received' ? 'Pending' : issue.status === 'in_progress' ? 'In Progress' : 'Resolved'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => {
                      setPendingStatusChange('received');
                      setStatusUpdateDialogOpen(true);
                    }}
                    disabled={isStatusDisabled('received')}
                    className={`cursor-pointer py-3 px-4 ${issue.status === 'received' ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <div className="flex-1">
                        <div className="font-semibold text-sm">Pending</div>
                        <div className="text-xs text-muted-foreground">Issue is waiting for attention</div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setPendingStatusChange('in_progress');
                      setStatusUpdateDialogOpen(true);
                    }}
                    disabled={isStatusDisabled('in_progress')}
                    className={`cursor-pointer py-3 px-4 ${issue.status === 'in_progress' ? 'bg-amber-50' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <div className="flex-1">
                        <div className="font-semibold text-sm">In Progress</div>
                        <div className="text-xs text-muted-foreground">Work is ongoing</div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setPendingStatusChange('resolved');
                      setStatusUpdateDialogOpen(true);
                    }}
                    disabled={isStatusDisabled('resolved')}
                    className={`cursor-pointer py-3 px-4 ${issue.status === 'resolved' ? 'bg-emerald-50' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <div className="flex-1">
                        <div className="font-semibold text-sm">Resolved</div>
                        <div className="text-xs text-muted-foreground">Issue is complete</div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {!isOwner && user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setReportDialogOpen(true)}
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    Report User
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 overflow-y-auto">
          <div className="space-y-6 pb-6 max-w-full">
            {/* Issue Title */}
            <div>
              <h2 className="text-2xl font-bold leading-tight">{issue.title}</h2>
            </div>

            {/* Badges: Status, Category, Urgency */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                <Badge className={cn("text-xs font-medium", getStatusColor(issue.status))}>
                  {ISSUE_STATUSES.find((s) => s.value === issue.status)?.label ?? issue.status}
                </Badge>
              </div>
              
              <Badge variant="outline" className="text-xs font-medium">
                {issue.category}
              </Badge>

              {issue.urgency && (
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  <Badge className={cn("text-xs font-medium border", getUrgencyColor(issue.urgency))}>
                    {issue.urgency.charAt(0).toUpperCase() + issue.urgency.slice(1)} Priority
                  </Badge>
                </div>
              )}
            </div>

            <Separator />

            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>Description</span>
              </div>
              <p className="text-base leading-relaxed whitespace-pre-wrap break-words">
                {issue.description}
              </p>
            </div>

            {/* Status Timeline */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-blue-500" />
                <h3 className="text-base font-semibold">Status Timeline</h3>
              </div>
              
              {/* Timeline */}
              <div className="relative space-y-3 pl-6">
                {/* Timeline line */}
                <div className="absolute left-2 top-2 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 to-blue-200" />
                
                {/* Created event */}
                <div className="relative">
                  <div className="absolute -left-4 top-1.5 w-5 h-5 rounded-full bg-blue-500 border-4 border-white shadow-md" />
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-blue-700">Issue Reported</span>
                      <span className="text-xs text-blue-600" title={new Date(issue.createdAt).toLocaleString()}>
                        {formatRelativeTime(issue.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status history events */}
                {issue.statusHistory && issue.statusHistory.length > 0 && (
                  <>
                    {issue.statusHistory.map((historyItem, idx) => {
                      const statusColors = {
                        received: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', label: 'Pending' },
                        in_progress: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', label: 'In Progress' },
                        resolved: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', label: 'Resolved' },
                      };
                      const colors = statusColors[historyItem.status];
                      return (
                        <div key={idx} className="relative">
                          <div className={`absolute -left-4 top-1.5 w-5 h-5 rounded-full bg-gradient-to-br ${historyItem.status === 'resolved' ? 'from-emerald-500 to-emerald-600' : historyItem.status === 'in_progress' ? 'from-amber-500 to-amber-600' : 'from-gray-500 to-gray-600'} border-4 border-white shadow-md`} />
                          <div className={`rounded-lg ${colors.bg} border ${colors.border} p-3 space-y-2`}>
                            <div className="flex items-center justify-between">
                              <span className={`text-sm font-semibold ${colors.text}`}>{colors.label}</span>
                              <span className={`text-xs ${colors.text}`} title={new Date(historyItem.changedAt).toLocaleString()}>
                                {formatRelativeTime(historyItem.changedAt)}
                              </span>
                            </div>
                            
                            {/* Status update message */}
                            {historyItem.message && (
                              <p className="text-sm text-gray-700 whitespace-pre-wrap break-words mt-2 bg-white/50 rounded p-2 border border-gray-200/50">
                                {historyItem.message}
                              </p>
                            )}

                            {/* Status update photos */}
                            {historyItem.photos && historyItem.photos.length > 0 && (
                              <div className={`grid gap-2 mt-2 ${historyItem.photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                {historyItem.photos.map((photo, photoIdx) => (
                                  <div
                                    key={photoIdx}
                                    className="relative group rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 transition-colors"
                                  >
                                    <img
                                      src={photo}
                                      alt={`Status update ${photoIdx + 1}`}
                                      className="w-full h-32 object-cover cursor-pointer group-hover:opacity-80 transition-opacity"
                                      onClick={() => window.open(photo, '_blank', 'noopener,noreferrer')}
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}

                {/* Resolution event */}
                {issue.resolution && (
                  <div className="relative">
                    <div className="absolute -left-4 top-1.5 w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 border-4 border-white shadow-md" />
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-emerald-700">Issue Resolved</span>
                        <span className="text-xs text-emerald-600" title={new Date(issue.resolution.resolvedAt).toLocaleString()}>
                          {formatRelativeTime(issue.resolution.resolvedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />
            {issue.attachments && issue.attachments.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-muted-foreground">Attachments</div>
                  <div className="flex flex-wrap gap-2">
                    {issue.attachments.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Attachment {idx + 1}
                      </a>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Issue Details Section */}
            <div className="rounded-lg bg-stone-50 p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Category</p>
                  <Badge variant="outline" className="text-xs">{issue.category}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <Badge className={cn("text-xs capitalize", getStatusColor(issue.status))}>
                    {issue.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">College</p>
                  <p className={`text-sm font-semibold break-words ${(issue.college || creatorProfile?.college) ? '' : 'text-muted-foreground'}`}>
                    {creatorProfile?.college?.trim() || issue.college?.trim() || 'College not provided'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Supports</p>
                  <p className="text-sm font-semibold">{issue.votes} {issue.votes === 1 ? 'support' : 'supports'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Created</p>
                  <p className="text-sm">{formatRelativeTime(issue.createdAt)}</p>
                </div>
              </div>
              
              {/* Visibility Control for Owner */}
              {isOwner && onVisibilityChange && (
                <div className="pt-3 border-t border-stone-200">
                  <p className="text-xs text-muted-foreground mb-2">Visibility</p>
                  <Select
                    value={visibility}
                    onValueChange={(value) => {
                      const newVisibility = value as 'public' | 'private' | 'draft';
                      setVisibility(newVisibility);
                      onVisibilityChange(issue.id, newVisibility);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          <span>Public - Everyone can see</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="private">
                        <div className="flex items-center gap-2">
                          <EyeOff className="h-4 w-4" />
                          <span>Private - Only followers can see</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="draft">
                        <div className="flex items-center gap-2">
                          <FileEdit className="h-4 w-4" />
                          <span>Draft - Only you can see</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Voting Section - Available to authenticated users (except issue creator) */}
            {user && user.uid !== issue.createdBy && (
              <>
                <Separator />
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "flex-1 rounded-full transition-all",
                      hasUpvoted 
                        ? "bg-green-100 border-green-300 text-green-700 hover:bg-green-200" 
                        : "hover:bg-green-50 hover:border-green-200"
                    )}
                    onClick={() => upvoteIssue.mutate(issue.id)}
                    disabled={upvoteIssue.isPending}
                  >
                    <ThumbsUp className={cn("h-4 w-4 mr-2", hasUpvoted && "fill-current")} />
                    {hasUpvoted ? 'Upvoted' : 'Upvote'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "flex-1 rounded-full transition-all",
                      hasDownvoted 
                        ? "bg-red-100 border-red-300 text-red-700 hover:bg-red-200" 
                        : "hover:bg-red-50 hover:border-red-200"
                    )}
                    onClick={() => downvoteIssue.mutate(issue.id)}
                    disabled={downvoteIssue.isPending}
                  >
                    <ThumbsDown className={cn("h-4 w-4 mr-2", hasDownvoted && "fill-current")} />
                    {hasDownvoted ? 'Downvoted' : 'Downvote'}
                  </Button>
                </div>
              </>
            )}

            {/* Resolution Section */}
            {issue.resolution && (
              <>
                <Separator />
                <div className="rounded-lg bg-green-50 border border-green-200 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-green-900">Issue Resolved</div>
                      <div className="text-xs text-green-700" title={new Date(issue.resolution.resolvedAt).toLocaleString()}>
                        {formatRelativeTime(issue.resolution.resolvedAt)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-green-900">Resolution Message:</div>
                    <p className="text-sm text-green-800 whitespace-pre-wrap break-words bg-white rounded p-3 border border-green-200">
                      {issue.resolution.message}
                    </p>
                  </div>

                  {issue.resolution.photos && issue.resolution.photos.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-green-900">Resolution Photos:</div>
                      <div className="grid grid-cols-2 gap-2">
                        {issue.resolution.photos.map((photo, idx) => (
                          <img
                            key={idx}
                            src={photo}
                            alt={`Resolution ${idx + 1}`}
                            className="rounded border border-green-200 w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(photo, '_blank', 'noopener,noreferrer')}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Progress Updates Timeline */}
            {issue.progressUpdates && issue.progressUpdates.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-orange-500" />
                    <h3 className="text-base font-semibold">Progress Updates</h3>
                    <Badge variant="secondary" className="ml-auto">
                      {issue.progressUpdates.length} {issue.progressUpdates.length === 1 ? 'update' : 'updates'}
                    </Badge>
                  </div>
                  
                  {/* Timeline */}
                  <div className="relative space-y-4 pl-6">
                    {/* Timeline line */}
                    <div className="absolute left-2 top-2 bottom-0 w-0.5 bg-gradient-to-b from-orange-400 to-orange-200" />
                    
                    {issue.progressUpdates.slice().reverse().map((update, idx) => (
                      <div key={idx} className="relative">
                        {/* Timeline dot */}
                        <div className="absolute -left-4 top-1.5 w-5 h-5 rounded-full bg-orange-500 border-4 border-white shadow-md" />
                        
                        {/* Update card */}
                        <div className="rounded-xl bg-white border border-orange-200 hover:border-orange-300 shadow-sm hover:shadow-md transition-all p-4 space-y-3">
                          {/* Header */}
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-orange-700 bg-orange-50 px-3 py-1 rounded-full">
                              Update {issue.progressUpdates!.length - idx}
                            </span>
                            <span className="text-xs text-muted-foreground" title={new Date(update.updatedAt).toLocaleString()}>
                              {formatRelativeTime(update.updatedAt)}
                            </span>
                          </div>
                          
                          {/* Message */}
                          {update.message && (
                            <p className="text-sm text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
                              {update.message}
                            </p>
                          )}

                          {/* Photos Grid */}
                          {update.photos && update.photos.length > 0 && (
                            <div className={`grid gap-2 ${update.photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                              {update.photos.map((photo, photoIdx) => (
                                <div
                                  key={photoIdx}
                                  className="relative group rounded-lg overflow-hidden border border-orange-100 hover:border-orange-300 transition-colors"
                                >
                                  <img
                                    src={photo}
                                    alt={`Progress ${photoIdx + 1}`}
                                    className="w-full h-48 object-cover cursor-pointer group-hover:opacity-80 transition-opacity"
                                    onClick={() => window.open(photo, '_blank', 'noopener,noreferrer')}
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <span className="text-white text-xs font-medium">Click to view full size</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Private Issue Info Banner */}
            {isPrivate && !isOwner && (
              <>
                <div className="rounded-lg bg-orange-50 border border-orange-200 p-4 flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <Lock className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-orange-900 mb-1">Private Issue</div>
                    <p className="text-xs text-orange-700">
                      This issue is set to private. You can view all existing comments and updates, but only the issue owner can add new comments or updates.
                    </p>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Comments Section */}
            {isFirebaseConfigured && (
              <div className="space-y-3">
                {/* Comments Header with Toggle */}
                <div 
                  className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-orange-50/50 to-amber-50/50 border border-orange-200/50 cursor-pointer hover:bg-orange-50 transition-colors"
                  onClick={() => setCommentsExpanded(!commentsExpanded)}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-orange-600" />
                    <span className="font-semibold text-stone-800">Comments & Discussion</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-orange-100"
                  >
                    {commentsExpanded ? (
                      <ChevronUp className="h-4 w-4 text-orange-600" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-orange-600" />
                    )}
                  </Button>
                </div>

                {/* Collapsible Comments Content */}
                {commentsExpanded && (
                  <div className="animate-in slide-in-from-top-2 duration-200">
                    <IssueComments 
                      issueId={issue.id} 
                                            issueOwnerId={issue.createdBy}
                      allowPin={enablePin}
                      disabled={disableComments}
                      disabledReason={
                        isPrivate && !isOwner 
                          ? 'This is a private issue. Only the owner can add comments or updates.' 
                          : undefined
                      }
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
      
      {/* Report User Dialog */}
      <ReportUserDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        reportedUserId={issue.createdBy}
        reportedUserName={creatorProfile?.displayName || issue.createdByName || "Anonymous"}
        context={{
          issueId: issue.id,
          issueTitle: issue.title,
        }}
      />

      {/* Status Update Dialog */}
      {pendingStatusChange && (
        <StatusUpdateDialog
          open={statusUpdateDialogOpen}
          onOpenChange={setStatusUpdateDialogOpen}
          newStatus={pendingStatusChange}
          onSubmit={async (message, photos) => {
            if (onSetStatus) {
              await onSetStatus(issue.id, pendingStatusChange, message, photos);
            }
            setStatusUpdateDialogOpen(false);
            setPendingStatusChange(null);
            // Close the issue detail dialog to return user to issues section
            onOpenChange(false);
          }}
        />
      )}
    </Dialog>
  );
}
