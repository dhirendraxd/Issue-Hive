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
  enablePin?: boolean; // allow pin UI in comments for this context
}

export default function IssueDetailDialog({
  issue,
  open,
  onOpenChange,
  onVisibilityChange,
  enablePin = false,
}: IssueDetailDialogProps) {
  const { user } = useAuth();
  const { data: userVote } = useUserVote(issue?.id);
  const { data: creatorProfile } = useUserProfile(issue?.createdBy);
  const { upvoteIssue, downvoteIssue } = useIssuesFirebase();
  const [commentsExpanded, setCommentsExpanded] = useState(true);
  const [visibility, setVisibility] = useState<'public' | 'private' | 'draft'>('public');
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  
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

            {/* Attachments */}
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
                  <p className={`text-sm font-semibold break-words ${issue.college ? '' : 'text-muted-foreground'}`}>
                    {issue.college?.trim() || 'College not provided'}
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

            {/* Progress Updates Section */}
            {issue.progressUpdates && issue.progressUpdates.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-orange-500" />
                    <h3 className="text-base font-semibold">Progress Updates</h3>
                    <Badge variant="secondary" className="ml-auto">
                      {issue.progressUpdates.length} {issue.progressUpdates.length === 1 ? 'update' : 'updates'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {issue.progressUpdates.slice().reverse().map((update, idx) => (
                      <div 
                        key={idx} 
                        className="rounded-lg bg-orange-50 border border-orange-200 p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs text-orange-700">
                          <span className="font-medium">
                            Update {issue.progressUpdates!.length - idx}
                          </span>
                          <span title={new Date(update.updatedAt).toLocaleString()}>
                            {formatRelativeTime(update.updatedAt)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-orange-900 whitespace-pre-wrap break-words bg-white rounded p-3 border border-orange-200">
                          {update.message}
                        </p>

                        {update.photos && update.photos.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 pt-2">
                            {update.photos.map((photo, photoIdx) => (
                              <img
                                key={photoIdx}
                                src={photo}
                                alt={`Progress ${photoIdx + 1}`}
                                className="rounded border border-orange-200 w-full h-24 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(photo, '_blank', 'noopener,noreferrer')}
                              />
                            ))}
                          </div>
                        )}
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
    </Dialog>
  );
}
