import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useIssuesFirebase } from '@/hooks/use-issues-firebase';
import { useAuth } from '@/hooks/use-auth';
import { useUserActivity } from '@/hooks/use-user-activity';
import { useReceivedMessages, useSentMessages, useMarkMessagesAsRead } from '@/hooks/use-messaging';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useQueryClient } from '@tanstack/react-query';
import type { Issue } from '@/types/issue';
import { signOut } from '@/integrations/firebase';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit2, Check, Settings, MapPin, Github, Twitter, Linkedin, Instagram, Link2, Calendar, ThumbsUp, ThumbsDown, MessageSquare, TrendingUp, Plus, LogOut, Mail, Send, GraduationCap, Users, Inbox, MailPlus, Flag, AlertCircle, Bell } from 'lucide-react';
import ResolveIssueDialog from '@/components/ResolveIssueDialog';
import AddProgressDialog from '@/components/AddProgressDialog';
import IssueDetailDialog from '@/components/IssueDetailDialog';
import SendMessageDialog from '@/components/SendMessageDialog';
import ReportUserDialog from '@/components/ReportUserDialog';
import { formatRelativeTime, cn } from '@/lib/utils';
import { sanitizeUrl } from '@/lib/security';
import { Separator } from '@/components/ui/separator';
import { useIsFollowing, useFollowUser, useUnfollowUser, useFollowCounts, useFollowersList, useFollowingList } from '@/hooks/use-follow';
import { useIssueEngagement } from '@/hooks/use-issue-engagement';
import { useComments } from '@/hooks/use-comments';
import { useReportsAgainstMe, useReviewableReports, useVoteOnReport, useReportVoteCounts, useReportVote, useUpdateReportStatus } from '@/hooks/use-reports';
import { toast } from 'sonner';
import ParticlesBackground from '@/components/ParticlesBackground';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAvatarUrl } from '@/hooks/use-avatar-url';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PortalErrorBoundary from '@/components/PortalErrorBoundary';

// Helper component to show comments for issues
function CommentNotificationsList({ issues, engagementMap, onIssueClick }: { issues: Issue[], engagementMap: any, onIssueClick: (issue: Issue) => void }) {
  const commentsData: { issue: Issue, comments: any[], timestamp: any }[] = [];
  
  // Collect all comments from all issues
  issues.forEach(issue => {
    const IssueCommentsComponent = ({ issueId }: { issueId: string }) => {
      const { data: comments = [] } = useComments(issueId);
      return null; // This is just to fetch data
    };
    
    // We'll display using a simpler approach - show issue with comment count and link to view
  });

  return (
    <div className="space-y-4">
      {issues.map((issue) => {
        const engagement = engagementMap[issue.id];
        const commentCount = engagement?.comments || 0;
        
        if (commentCount === 0) return null;
        
        return (
          <IssueCommentCard key={issue.id} issue={issue} commentCount={commentCount} onViewIssue={() => onIssueClick(issue)} />
        );
      }).filter(Boolean)}
      {issues.every(issue => (engagementMap[issue.id]?.comments || 0) === 0) && (
        <Card className="rounded-2xl border border-white/60 bg-white/50 backdrop-blur-2xl shadow-lg shadow-orange-100/20 p-12 text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No comments yet. Share your issues to get feedback!</p>
        </Card>
      )}
    </div>
  );
}

// Component to display a single issue's comments
function IssueCommentCard({ issue, commentCount, onViewIssue }: { issue: Issue, commentCount: number, onViewIssue: () => void }) {
  const { data: comments = [] } = useComments(issue.id);
  
  // Helper to convert Firestore timestamp to milliseconds
  const getTimeInMs = (timestamp: any): number => {
    if (!timestamp) return Date.now();
    if (typeof timestamp === 'number') return timestamp;
    if (timestamp instanceof Date) return timestamp.getTime();
    if (timestamp?.toMillis && typeof timestamp.toMillis === 'function') return timestamp.toMillis();
    if (timestamp?.seconds) return timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000;
    return Date.now();
  };
  
  return (
    <div className="space-y-3">
      {/* Issue Header */}
      <Card className="rounded-2xl border border-blue-200/50 bg-blue-50/50 backdrop-blur-2xl shadow-lg shadow-blue-100/20 p-4 cursor-pointer hover:shadow-blue-100/40 transition-all" onClick={onViewIssue}>
        <CardContent className="p-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-stone-900 mb-1">{issue.title}</h3>
              <div className="flex items-center gap-3 text-sm">
                <Badge variant="outline" className="bg-blue-100/50 text-blue-700 border-blue-200">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
                </Badge>
                <span className="text-muted-foreground">{formatRelativeTime(getTimeInMs(issue.createdAt))}</span>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="outline"
              className="rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                onViewIssue();
              }}
            >
              View Issue
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Comments Preview */}
      {comments.slice(0, 3).map((comment: any, idx) => (
        <Card key={comment.id || idx} className="rounded-2xl border border-stone-200/50 bg-white/50 backdrop-blur-xl shadow-lg shadow-stone-100/20 p-4 ml-4 hover:shadow-stone-100/40 transition-all cursor-pointer" onClick={onViewIssue}>
          <CardContent className="p-0">
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 border border-stone-200">
                <AvatarImage src={comment.userAvatar} />
                <AvatarFallback className="bg-stone-100 text-xs font-semibold">
                  {comment.userName?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-stone-900">{comment.userName || 'Anonymous'}</p>
                  <span className="text-xs text-muted-foreground">{formatRelativeTime(getTimeInMs(comment.createdAt))}</span>
                </div>
                <p className="text-sm text-stone-700 line-clamp-2 break-words">{comment.text || comment.content}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {comments.length > 3 && (
        <Button 
          variant="ghost" 
          className="w-full rounded-full text-blue-600 hover:text-blue-700 hover:bg-blue-50/50"
          onClick={onViewIssue}
        >
          View all {comments.length} comments
        </Button>
      )}
    </div>
  );
}

// Component to display a report card with voting
function ReportCard({ report, voteOnReport }: { report: any; voteOnReport: any }) {
  const { data: voteCounts = { upvotes: 0, downvotes: 0 } } = useReportVoteCounts(report.id);
  const { data: userVote = 0 } = useReportVote(report.id);
  const { user } = useAuth();

  const getTimeInMs = (timestamp: any): number => {
    if (!timestamp) return Date.now();
    if (typeof timestamp === 'number') return timestamp;
    if (timestamp instanceof Date) return timestamp.getTime();
    if (timestamp?.toMillis && typeof timestamp.toMillis === 'function') return timestamp.toMillis();
    if (timestamp?.seconds) return timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000;
    return Date.now();
  };

  const handleVote = (isUpvote: boolean) => {
    if (!user) {
      toast.error('Please sign in to vote');
      return;
    }
    voteOnReport.mutate({ reportId: report.id, upvote: isUpvote });
  };

  return (
    <Card className="rounded-2xl border border-amber-200/50 bg-amber-50/50 backdrop-blur-xl shadow-lg shadow-amber-100/20 p-4">
      <CardContent className="p-0 space-y-3">
        {/* Report Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-semibold text-stone-900">
              <span className="font-bold text-red-600">{report.reportedUserName}</span> reported by <span className="font-semibold">{report.reporterName}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {formatRelativeTime(getTimeInMs(report.createdAt))}
            </p>
          </div>
          <Badge 
            variant="outline" 
            className="bg-amber-100 text-amber-700 border-amber-300 whitespace-nowrap"
          >
            {report.reason}
          </Badge>
        </div>

        {/* Report Context */}
        {report.context?.issueTitle && (
          <div className="bg-amber-100/50 border border-amber-200 rounded-lg p-2 text-sm">
            <p className="text-muted-foreground">Issue:</p>
            <p className="font-medium text-stone-900">{report.context.issueTitle}</p>
          </div>
        )}

        {/* Report Details */}
        <div>
          <p className="text-sm text-muted-foreground mb-1">Report Details:</p>
          <p className="text-sm text-stone-700 bg-white/50 rounded p-2">
            {report.details}
          </p>
        </div>

        {/* Status & Voting */}
        <div className="flex items-center justify-between pt-2 border-t border-amber-200/50">
          <Badge
            variant="secondary"
            className={cn(
              "capitalize",
              report.status === 'pending' && 'bg-yellow-100 text-yellow-700',
              report.status === 'reviewed' && 'bg-blue-100 text-blue-700',
              report.status === 'resolved' && 'bg-green-100 text-green-700',
              report.status === 'dismissed' && 'bg-gray-100 text-gray-700',
            )}
          >
            {report.status}
          </Badge>

          {/* Community Vote Buttons */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={userVote === 1 ? "default" : "outline"}
              className={cn(
                "h-8 px-2 gap-1",
                userVote === 1 && "bg-green-600 hover:bg-green-700 border-green-600"
              )}
              onClick={() => handleVote(true)}
              disabled={voteOnReport.isPending}
            >
              <ThumbsUp className="h-4 w-4" />
              <span className="text-xs">{voteCounts.upvotes}</span>
            </Button>
            <Button
              size="sm"
              variant={userVote === -1 ? "default" : "outline"}
              className={cn(
                "h-8 px-2 gap-1",
                userVote === -1 && "bg-red-600 hover:bg-red-700 border-red-600"
              )}
              onClick={() => handleVote(false)}
              disabled={voteOnReport.isPending}
            >
              <ThumbsDown className="h-4 w-4" />
              <span className="text-xs">{voteCounts.downvotes}</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function UserProfile() {
  const { uid } = useParams();
  const [search] = useSearchParams();
  const { user } = useAuth();
  const { data: issues, isLoading, setVisibility, setStatus, resolveIssue, addProgress } = useIssuesFirebase();
  const { data: userActivity, isLoading: isActivityLoading } = useUserActivity();
  const { data: receivedMessages, isLoading: messagesLoading, error: messagesError } = useReceivedMessages();
  const { data: sentMessages, isLoading: sentMessagesLoading } = useSentMessages();
  const markMessagesAsRead = useMarkMessagesAsRead();
  const updateReportStatus = useUpdateReportStatus();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // Get user profile data
  const { data: ownerProfile, isLoading: profileLoading } = useUserProfile(uid || '');
  
  const avatarUrl = useAvatarUrl(ownerProfile?.photoURL, uid || '');
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [followersDialogOpen, setFollowersDialogOpen] = useState(false);
  const [followingDialogOpen, setFollowingDialogOpen] = useState(false);
  const [reportUserDialogOpen, setReportUserDialogOpen] = useState(false);
  const [reportView, setReportView] = useState<'against-me' | 'review'>('against-me');
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('issues');
  const [messagesTab, setMessagesTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [notificationTab, setNotificationTab] = useState<'comments' | 'followers' | 'reports'>('comments');
  const [notificationsCleared, setNotificationsCleared] = useState(false);
  const [commentsCleared, setCommentsCleared] = useState(false);
  const [followersCleared, setFollowersCleared] = useState(false);
  const [reportsCleared, setReportsCleared] = useState(false);

  // Derived state and computed values
  const owned = (issues || []).filter(i => i.createdBy === uid);
  const previewVisitor = search.get('previewVisitor') === '1' || search.get('as') === 'visitor';
  const rawIsOwner = user?.uid === uid;
  const isOwner = previewVisitor ? false : rawIsOwner;
  
  const { data: isFollowing = false } = useIsFollowing(!isOwner ? uid : undefined);
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();
  const { data: followCounts = { followers: 0, following: 0 } } = useFollowCounts(uid);
  const { data: followersList = [] } = useFollowersList(uid);
  const { data: followingList = [] } = useFollowingList(uid);
  
  const ownedIssueIds = useMemo(() => owned.map(i => i.id), [owned]);
  const { data: engagementMap = {} } = useIssueEngagement(ownedIssueIds);
  const { data: reportsAgainstMe = [] } = useReportsAgainstMe();
  const { data: reviewableReports = [] } = useReviewableReports();
  const voteOnReport = useVoteOnReport();
  const totalComments = useMemo(() => {
    return Object.values(engagementMap).reduce((sum: number, e: any) => sum + (e?.comments || 0), 0);
  }, [engagementMap]);

  const hasUnreadNotifications = useMemo(() => {
    if (notificationsCleared) return false;
    const hasReports = reportsAgainstMe.length > 0;
    const hasFollowers = followersList.length > 0;
    const hasComments = totalComments > 0;
    return hasReports || hasFollowers || hasComments;
  }, [notificationsCleared, reportsAgainstMe.length, followersList.length, totalComments]);
  
  type WithVisibility = { visibility?: 'public' | 'private' | 'draft' };
  const publicIssues = owned.filter(i => {
    const vis = (i as unknown as WithVisibility).visibility;
    return vis === 'public';
  });
  const followerPrivateIssues = !isOwner && isFollowing && ownerProfile?.showPrivateToFollowers
    ? owned.filter(i => (i as unknown as WithVisibility).visibility === 'private')
    : [];
  const privateCount = owned.filter(i => (i as unknown as WithVisibility).visibility === 'private').length;
  const draftCount = owned.filter(i => (i as unknown as WithVisibility).visibility === 'draft').length;
  
  // Use cached stats from profile with fallback to real-time calculation
  const analytics = useMemo(() => {
    // Try to use cached stats first (fast)
    if (ownerProfile?.stats) {
      return {
        totalIssues: ownerProfile.stats.totalIssues ?? owned.length,
        totalUpvotes: ownerProfile.stats.totalUpvotesReceived ?? 0,
        totalDownvotes: ownerProfile.stats.totalDownvotesReceived ?? 0,
        totalComments: ownerProfile.stats.totalCommentsReceived ?? 0,
        totalSupports: ownerProfile.stats.totalSupports ?? 0,
        resolvedIssues: ownerProfile.stats.resolvedIssues ?? owned.filter(i => i.status === 'resolved').length,
      };
    }
    
    // Fallback: calculate from engagement data (slower)
    let totalUpvotes = 0;
    let totalDownvotes = 0;
    let totalComments = 0;
    let totalSupports = 0;
    
    owned.forEach(issue => {
      const engagement = engagementMap[issue.id];
      if (engagement) {
        totalUpvotes += engagement.upvotes || 0;
        totalDownvotes += engagement.downvotes || 0;
        totalComments += engagement.comments || 0;
      }
      totalSupports += issue.votes || 0;
    });
    
    return {
      totalIssues: owned.length,
      totalUpvotes,
      totalDownvotes,
      totalComments,
      totalSupports,
      resolvedIssues: owned.filter(i => i.status === 'resolved').length,
    };
  }, [owned, engagementMap, ownerProfile?.stats]);
  
  // Early validation after all hooks
  if (!uid) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <p className="text-center">Invalid user profile</p>
        </Card>
      </div>
    );
  }

  const hasSocialLinks = !!(
    ownerProfile?.social && (
      ownerProfile.social.website?.trim() ||
      ownerProfile.social.github?.trim() ||
      ownerProfile.social.twitter?.trim() ||
      ownerProfile.social.linkedin?.trim() ||
      ownerProfile.social.instagram?.trim()
    )
  );

  const socialIcons = hasSocialLinks ? (
    <div className="inline-flex items-center gap-1.5 bg-white/80 backdrop-blur-xl border border-white/60 rounded-full px-2 py-2 shadow-lg shadow-black/5">
      {ownerProfile?.social?.website?.trim() && (
        <a 
          href={sanitizeUrl(ownerProfile.social.website)} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-orange-100/50 text-orange-600 hover:text-orange-700 transition-all duration-200"
          title="Website"
        >
          <Link2 className="h-4 w-4" />
        </a>
      )}
      {ownerProfile?.social?.github?.trim() && (
        <a 
          href={sanitizeUrl(ownerProfile.social.github)} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-100/50 text-slate-800 hover:text-slate-900 transition-all duration-200"
          title="GitHub"
        >
          <Github className="h-4 w-4" />
        </a>
      )}
      {ownerProfile?.social?.twitter?.trim() && (
        <a 
          href={sanitizeUrl(ownerProfile.social.twitter)} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-blue-100/50 text-blue-500 hover:text-blue-600 transition-all duration-200"
          title="Twitter"
        >
          <Twitter className="h-4 w-4" />
        </a>
      )}
      {ownerProfile?.social?.linkedin?.trim() && (
        <a 
          href={sanitizeUrl(ownerProfile.social.linkedin)} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-blue-100/50 text-blue-700 hover:text-blue-800 transition-all duration-200"
          title="LinkedIn"
        >
          <Linkedin className="h-4 w-4" />
        </a>
      )}
      {ownerProfile?.social?.instagram?.trim() && (
        <a 
          href={sanitizeUrl(ownerProfile.social.instagram)} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-pink-100/50 text-pink-600 hover:text-pink-700 transition-all duration-200"
          title="Instagram"
        >
          <Instagram className="h-4 w-4" />
        </a>
      )}
    </div>
  ) : null;
  
  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      setSignOutConfirmOpen(false);
      navigate('/');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const handleResolve = (issue: Issue) => {
    setSelectedIssue(issue);
    setResolveDialogOpen(true);
  };

  const handleAddProgress = (issue: Issue) => {
    setSelectedIssue(issue);
    setProgressDialogOpen(true);
  };

  const handleMarkNotificationsRead = () => {
    setNotificationsCleared(true);
    setCommentsCleared(true);
    setFollowersCleared(true);
    setReportsCleared(true);
    toast.success('Notifications marked as read');
  };

  const handleMarkCommentsRead = () => {
    setCommentsCleared(true);
    // If other sections are already clear, clear overall badge too
    if (followersCleared && reportsCleared) {
      setNotificationsCleared(true);
    }
  };

  const handleMarkFollowersRead = () => {
    setFollowersCleared(true);
    if (commentsCleared && reportsCleared) {
      setNotificationsCleared(true);
    }
  };

  const handleViewDetails = (issue: Issue) => {
    setSelectedIssue(issue);
    setDetailDialogOpen(true);
  };



  const handleVisibilityChange = async (issueId: string, newVisibility: string) => {
    try {
      await setVisibility.mutateAsync({ id: issueId, visibility: newVisibility as 'public' | 'private' | 'draft' });
      // Invalidate queries to ensure UI updates immediately
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['issueEngagement'] });
      toast.success(`Issue visibility updated to ${newVisibility}`);
    } catch (error) {
      toast.error('Failed to update visibility');
    }
  };

  const handleStatusChange = async (issueId: string, newStatus: 'received' | 'in_progress' | 'resolved', message?: string, photos?: string[]) => {
    try {
      await setStatus.mutateAsync({ id: issueId, status: newStatus, message, photos });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      const statusLabels = { received: 'Pending', in_progress: 'In Progress', resolved: 'Resolved' };
      toast.success(`Issue status updated to ${statusLabels[newStatus]}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  // Show loading state while critical data loads
  if (isLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Navbar />
        <main className="pt-24 pb-24 px-4 mx-auto max-w-5xl">
          <div className="space-y-4">
            <Skeleton className="h-32 w-32 rounded-full" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </main>
      </div>
    );
  }

  // If no uid, redirect to home
  if (!uid) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-stone-50 animate-in fade-in duration-300">
      <ParticlesBackground fullPage hexOpacity={0.10}>
        <Navbar hideProfileIcon={isOwner} />
        <main className="pt-24 pb-24 px-4 mx-auto max-w-5xl">
          {/* Unified Twitter/X Style Profile for everyone */}
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            {/* Profile Section */}
            <div className="relative pt-8">
              {/* Profile Picture */}
              <div className="flex flex-col items-start gap-3 mb-6">
                <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-white shadow-xl">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-orange-500 to-amber-500 text-white">
                    {ownerProfile?.displayName?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                {isOwner && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full bg-white/80 backdrop-blur-xl border border-white/60 hover:bg-white/95 text-stone-900 shadow-lg shadow-black/10 text-xs sm:text-sm"
                    onClick={() => navigate(`/profile/${uid}/edit`)}
                  >
                    <Edit2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
              
              {/* Social Icons - Top Right */}
              <div className="absolute top-2 right-0 sm:right-2">
                {socialIcons}
              </div>
            </div>
            
            {/* Profile Info Section with Glassmorphism */}
            <div className="mt-12 px-4 sm:px-6 pb-4 border-b border-white/30">
              <div className="mb-4">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{ownerProfile?.displayName || 'User'}</h1>
                  {ownerProfile?.pronouns && (
                    <span className="text-xs sm:text-sm text-muted-foreground font-normal">({ownerProfile.pronouns})</span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3">@{ownerProfile?.username || ownerProfile?.displayName?.toLowerCase().replace(/\s+/g, '') || 'user'}</p>
                
                {/* Message and Follow Buttons - Below Username for Visitors */}
                {!isOwner && user && (
                  <div className="flex flex-col xs:flex-row gap-2 mb-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full bg-white/80 backdrop-blur-xl border border-white/60 hover:bg-white/95 text-stone-900 shadow-lg shadow-black/10 w-full xs:w-auto text-xs sm:text-sm"
                      onClick={() => setMessageDialogOpen(true)}
                    >
                      <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Message
                    </Button>
                    {isFollowing ? (
                      <Button
                        size="sm"
                        className="rounded-full bg-white/80 backdrop-blur-xl border border-white/60 hover:bg-white/95 text-stone-900 shadow-lg shadow-black/10 w-full xs:w-auto text-xs sm:text-sm"
                        disabled={unfollowMutation.isPending}
                        onClick={() => unfollowMutation.mutate(uid!)}
                      >
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                        {unfollowMutation.isPending ? 'Unfollowing...' : 'Following'}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white backdrop-blur-xl shadow-lg shadow-orange-500/30 hover:shadow-lg hover:shadow-orange-600/40 transition-all w-full xs:w-auto text-xs sm:text-sm"
                        disabled={followMutation.isPending}
                        onClick={() => followMutation.mutate(uid!)}
                      >
                        {followMutation.isPending ? 'Following...' : 'Follow'}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full bg-white/80 backdrop-blur-xl border border-red-200 hover:bg-red-50 hover:text-red-600 text-red-600 shadow-lg shadow-black/10 w-full xs:w-auto text-xs sm:text-sm"
                      onClick={() => setReportUserDialogOpen(true)}
                    >
                      <Flag className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Report User
                    </Button>
                  </div>
                )}
              </div>
              
              {ownerProfile?.bio && (
                <p className="text-xs sm:text-sm text-stone-900 mb-3 leading-relaxed">{ownerProfile.bio}</p>
              )}
              
              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mb-3 mt-1">
                {ownerProfile?.college && (
                  <span className="inline-flex items-center gap-1.5">
                    <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="truncate max-w-[150px] sm:max-w-none">{ownerProfile.college}</span>
                  </span>
                )}
                {ownerProfile?.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4" /> {ownerProfile.location}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4" /> Joined {ownerProfile?.createdAt ? new Date(ownerProfile.createdAt as number | string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown'}
                </span>
              </div>
              
              {/* Follower Counts */}
              <div className="flex gap-4 sm:gap-6 text-xs sm:text-sm">
                <button 
                  onClick={() => setFollowersDialogOpen(true)}
                  className="flex flex-col hover:bg-stone-100 rounded-lg px-3 py-2 transition-colors cursor-pointer"
                >
                  <span className="font-semibold text-stone-900">{followCounts.followers}</span>
                  <span className="text-muted-foreground text-xs">Followers</span>
                </button>
                <button 
                  onClick={() => setFollowingDialogOpen(true)}
                  className="flex flex-col hover:bg-stone-100 rounded-lg px-3 py-2 transition-colors cursor-pointer"
                >
                  <span className="font-semibold text-stone-900">{followCounts.following}</span>
                  <span className="text-muted-foreground text-xs">Following</span>
                </button>
              </div>
            </div>
            
            {/* Unified Tabs for Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0">
                <TabsTrigger 
                  value="issues" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-transparent px-6 py-4"
                >
                  Issues
                </TabsTrigger>
                {isOwner && (
                  <>
                    <TabsTrigger 
                      value="messages" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-transparent px-6 py-4"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Messages {receivedMessages && receivedMessages.length > 0 && <span className="ml-2 px-2 py-1 rounded-full bg-red-500 text-white text-xs font-bold">{receivedMessages.length}</span>}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="notifications" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-transparent px-6 py-4"
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Notifications {!notificationsCleared && (reportsAgainstMe.length > 0 || followersList.length > 0) && <span className="ml-2 px-2 py-1 rounded-full bg-blue-500 text-white text-xs font-bold">{reportsAgainstMe.length + followersList.length}</span>}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="analytics" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-transparent px-6 py-4"
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Activity
                    </TabsTrigger>
                    <TabsTrigger 
                      value="settings" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-transparent px-6 py-4"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </TabsTrigger>
                  </>
                )}
              </TabsList>
              
              {/* Issues Tab */}
              <TabsContent value="issues" className="mt-6">
                <Tabs defaultValue="all" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 mb-6">
                      <TabsTrigger value="all">All ({owned.length})</TabsTrigger>
                      <TabsTrigger value="public">Public ({publicIssues.length})</TabsTrigger>
                      <TabsTrigger value="private">Private ({privateCount})</TabsTrigger>
                      <TabsTrigger value="draft">Draft ({draftCount})</TabsTrigger>
                    </TabsList>

                    {/* Helper function to render issue cards */}
                    {[
                      { key: 'all', issues: owned, emptyText: 'No issues yet. Create your first issue to get started!' },
                      { key: 'public', issues: publicIssues, emptyText: 'No public issues yet.' },
                      { key: 'private', issues: owned.filter(i => (i as unknown as WithVisibility).visibility === 'private'), emptyText: 'No private issues yet.' },
                      { key: 'draft', issues: owned.filter(i => (i as unknown as WithVisibility).visibility === 'draft'), emptyText: 'No draft issues yet.' }
                    ].map(({ key, issues, emptyText }) => (
                      <TabsContent key={key} value={key}>
                        {isLoading && (
                          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                              <Skeleton key={i} className="h-40 rounded-2xl" />
                            ))}
                          </div>
                        )}
                        {!isLoading && issues.length === 0 && (
                          <Card className="rounded-2xl border border-white/60 bg-white/50 backdrop-blur-2xl shadow-xl shadow-orange-100/20 p-10 text-center">
                            <p className="text-muted-foreground">{emptyText}</p>
                            {key === 'all' && (
                              <Link to="/raise-issue">
                                <Button className="mt-4 rounded-full bg-gradient-to-r from-orange-500 to-amber-500">
                                  Create Your First Issue
                                </Button>
                              </Link>
                            )}
                          </Card>
                        )}
                        {!isLoading && issues.length > 0 && (
                          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {issues.map(issue => {
                              const vis = (issue as unknown as WithVisibility).visibility;
                              const engagement = engagementMap[issue.id] || { upvotes: 0, downvotes: 0, comments: 0, commentLikes: 0 };
                              return (
                                <Card 
                                  key={issue.id} 
                                  className="rounded-2xl border border-white/60 bg-white/50 backdrop-blur-2xl flex flex-col hover:shadow-2xl hover:shadow-orange-300/30 hover:border-orange-300/60 hover:bg-white/60 transition-all group"
                                >
                                  <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-2">
                                      <CardTitle 
                                        className="text-base font-semibold leading-snug line-clamp-2 cursor-pointer hover:text-orange-600"
                                        onClick={() => handleViewDetails(issue)}
                                      >
                                        {issue.title}
                                      </CardTitle>
                                      {vis && vis !== 'public' && (
                                        <Badge variant="outline" className="text-xs capitalize border-orange-300/60 text-orange-700/80 bg-orange-50/50">{vis}</Badge>
                                      )}
                                    </div>
                                  </CardHeader>
                                  <CardContent className="flex flex-col gap-3 text-sm flex-1">
                                    <p 
                                      className="text-muted-foreground line-clamp-3 cursor-pointer"
                                      onClick={() => handleViewDetails(issue)}
                                    >
                                      {issue.description}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-auto">
                                      <Badge variant="outline" className="text-xs border-stone-300 text-stone-700 bg-stone-50">{issue.category}</Badge>
                                      <Badge 
                                        variant={issue.status === 'resolved' ? 'default' : 'secondary'} 
                                        className={`text-xs capitalize ${
                                          issue.status === 'resolved' 
                                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                                            : issue.status === 'in_progress'
                                            ? 'bg-amber-100 text-amber-700 border-amber-200'
                                            : 'bg-stone-100 text-stone-700 border-stone-200'
                                        }`}
                                      >
                                        {issue.status.replace('_',' ')}
                                      </Badge>
                                      <span className="text-xs px-2 py-1 rounded-full bg-orange-50/70 text-orange-700/90 border border-orange-200/60">
                                        {issue.votes} {issue.votes === 1 ? 'support' : 'supports'}
                                      </span>
                                    </div>
                                    <div className="flex gap-3 text-xs pt-2 border-t border-stone-200/60">
                                      <span className="flex items-center gap-1 text-emerald-600/80">
                                        <ThumbsUp className="h-3 w-3" /> {engagement.upvotes}
                                      </span>
                                      {!ownerProfile?.hideDislikeCounts && (
                                        <span className="flex items-center gap-1 text-rose-600/80">
                                          <ThumbsDown className="h-3 w-3" /> {engagement.downvotes}
                                        </span>
                                      )}
                                      <span className="flex items-center gap-1 text-stone-600/80">
                                        <MessageSquare className="h-3 w-3" /> {engagement.comments}
                                      </span>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        )}
                      </TabsContent>
                    ))}
                  </Tabs>
                </TabsContent>
              
              {/* Messages Tab */}
              <TabsContent value="messages" className="mt-6">
                  <div className="max-w-4xl space-y-6">
                    <Tabs value={messagesTab} onValueChange={(val) => setMessagesTab(val as 'incoming' | 'outgoing')} className="w-full">
                      <TabsList className="w-full justify-start bg-stone-100 p-1 rounded-lg">
                        <TabsTrigger value="incoming" className="flex-1 data-[state=active]:bg-white rounded-md">
                          <Inbox className="h-4 w-4 mr-2" />
                          Incoming {receivedMessages && receivedMessages.length > 0 && <span className="ml-2 px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">{receivedMessages.length}</span>}
                        </TabsTrigger>
                        <TabsTrigger value="outgoing" className="flex-1 data-[state=active]:bg-white rounded-md">
                          <MailPlus className="h-4 w-4 mr-2" />
                          Sent {sentMessages && sentMessages.length > 0 && <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-500 text-white text-xs font-bold">{sentMessages.length}</span>}
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="incoming" className="mt-6">
                        <div>
                          <h2 className="text-xl font-semibold tracking-tight mb-2">Incoming Messages</h2>
                          <p className="text-sm text-muted-foreground mb-4">Messages sent to you by other users</p>
                            {receivedMessages && receivedMessages.length > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="mb-4 rounded-full"
                                onClick={() => {
                                  markMessagesAsRead.mutate();
                                  toast.success('All messages marked as read');
                                }}
                                disabled={markMessagesAsRead.isPending}
                              >
                                Mark all as read
                              </Button>
                            )}
                        </div>

                    {messagesLoading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Skeleton key={i} className="h-24 rounded-xl" />
                        ))}
                      </div>
                    ) : messagesError ? (
                      <Card className="rounded-2xl border border-amber-200/60 bg-amber-50/50 backdrop-blur-2xl">
                        <CardContent className="p-6 text-center">
                          <p className="text-sm text-amber-800">Unable to load messages. Please try again later.</p>
                        </CardContent>
                      </Card>
                    ) : receivedMessages && receivedMessages.length > 0 ? (
                      <div className="space-y-4">
                        {receivedMessages.map((message, idx) => {
                          const senderName = message.senderName || 'Anonymous User';
                          const senderAvatar = message.senderAvatar;
                          
                          return (
                            <Card key={idx} className="rounded-2xl border border-white/60 bg-white/50 backdrop-blur-2xl shadow-lg shadow-blue-100/20 hover:shadow-xl hover:shadow-blue-200/30 transition-all overflow-hidden">
                              <CardContent className="p-6">
                                <div className="flex gap-4">
                                  <Avatar className="h-12 w-12 flex-shrink-0 ring-2 ring-blue-200">
                                    <AvatarImage src={senderAvatar} />
                                    <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                                      {senderName.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between mb-2">
                                      <div>
                                        <p className="font-semibold text-stone-900">{senderName}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {formatRelativeTime(
                                            typeof message.createdAt === 'number' ? message.createdAt : (message.createdAt?.toDate ? message.createdAt.toDate() : new Date())
                                          )}
                                        </p>
                                      </div>
                                      <Link to={`/profile/${message.senderId}`}>
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="rounded-full text-xs"
                                        >
                                          View Profile
                                        </Button>
                                      </Link>
                                    </div>
                                    <div className="bg-stone-50 rounded-lg p-4 mt-3 border border-stone-200/50">
                                      <p className="text-sm text-stone-900 leading-relaxed break-words">{message.content}</p>
                                    </div>
                                    <div className="flex gap-2 mt-3">
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="rounded-full text-xs"
                                        onClick={() => {
                                          setMessageDialogOpen(true);
                                          // Store context for reply
                                        }}
                                      >
                                        <Send className="h-3 w-3 mr-1" />
                                        Reply
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <Card className="rounded-2xl border border-white/60 bg-white/50 backdrop-blur-2xl shadow-lg shadow-orange-100/20 p-12 text-center">
                        <Mail className="h-16 w-16 mx-auto mb-4 opacity-40 text-muted-foreground" />
                        <h3 className="text-lg font-semibold text-stone-900 mb-2">No Messages Yet</h3>
                        <p className="text-sm text-muted-foreground mb-6">
                          Messages from other users will appear here. Share your profile with others to receive messages!
                        </p>
                        <Button 
                          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-full"
                          onClick={() => {
                            const url = `${window.location.origin}/profile/${user?.uid}`;
                            navigator.clipboard.writeText(url);
                            toast.success('Profile link copied to clipboard!');
                          }}
                        >
                          Copy Profile Link
                        </Button>
                      </Card>
                    )}
                      </TabsContent>
                      
                      <TabsContent value="outgoing" className="mt-6">
                        <div>
                          <h2 className="text-xl font-semibold tracking-tight mb-2">Sent Messages</h2>
                          <p className="text-sm text-muted-foreground mb-4">Messages you sent to other users</p>
                        </div>

                        {sentMessagesLoading ? (
                          <div className="space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Skeleton key={i} className="h-24 rounded-xl" />
                            ))}
                          </div>
                        ) : sentMessages && sentMessages.length > 0 ? (
                          <div className="space-y-4">
                            {sentMessages.map((message, idx) => {
                              const receiverName = message.receiverName || 'Anonymous User';
                              const receiverAvatar = message.receiverAvatar;
                              
                              return (
                                <Card key={idx} className="rounded-2xl border border-white/60 bg-white/50 backdrop-blur-2xl shadow-lg shadow-green-100/20 hover:shadow-xl hover:shadow-green-200/30 transition-all overflow-hidden">
                                  <CardContent className="p-6">
                                    <div className="flex gap-4">
                                      <Avatar className="h-12 w-12 flex-shrink-0 ring-2 ring-green-200">
                                        <AvatarImage src={receiverAvatar} />
                                        <AvatarFallback className="bg-green-100 text-green-700 font-semibold">
                                          {receiverName.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-2">
                                          <div>
                                            <p className="font-semibold text-stone-900">To: {receiverName}</p>
                                            <p className="text-xs text-muted-foreground">
                                              {formatRelativeTime(
                                                typeof message.createdAt === 'number' ? message.createdAt : (message.createdAt?.toDate ? message.createdAt.toDate() : new Date())
                                              )}
                                            </p>
                                          </div>
                                          <Link to={`/profile/${message.otherUserId}`}>
                                            <Button 
                                              variant="outline" 
                                              size="sm" 
                                              className="rounded-full text-xs"
                                            >
                                              View Profile
                                            </Button>
                                          </Link>
                                        </div>
                                        <div className="bg-stone-50 rounded-lg p-4 mt-3 border border-stone-200/50">
                                          <p className="text-sm text-stone-900 leading-relaxed break-words">{message.content}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        ) : (
                          <Card className="rounded-2xl border border-white/60 bg-white/50 backdrop-blur-2xl shadow-lg shadow-orange-100/20 p-12 text-center">
                            <MailPlus className="h-16 w-16 mx-auto mb-4 opacity-40 text-muted-foreground" />
                            <h3 className="text-lg font-semibold text-stone-900 mb-2">No Sent Messages</h3>
                            <p className="text-sm text-muted-foreground">
                              Messages you send to other users will appear here.
                            </p>
                          </Card>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                </TabsContent>
              
              {/* Notifications Tab */}
              <TabsContent value="notifications" className="mt-6">
                <div className="max-w-4xl space-y-6">
                  <div>
                    <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
                      <div>
                        <h2 className="text-xl font-semibold tracking-tight">Notifications</h2>
                        <p className="text-sm text-muted-foreground">Activity updates and alerts related to your issues</p>
                      </div>
                      {hasUnreadNotifications && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          onClick={handleMarkNotificationsRead}
                        >
                          Mark all as read
                        </Button>
                      )}
                    </div>
                    <Separator className="mb-6" />
                  </div>
                  
                  <Tabs value={notificationTab} onValueChange={(val) => setNotificationTab(val as 'comments' | 'followers' | 'reports')} className="w-full">
                    <TabsList className="w-full justify-start bg-stone-100 p-1 rounded-lg">
                      <TabsTrigger value="comments" className="flex-1 data-[state=active]:bg-white rounded-md">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Comments {!commentsCleared && totalComments > 0 && <span className="ml-2 inline-block w-5 h-5 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center">{totalComments}</span>}
                      </TabsTrigger>
                      <TabsTrigger value="followers" className="flex-1 data-[state=active]:bg-white rounded-md">
                        <Users className="h-4 w-4 mr-2" />
                        Followers {!followersCleared && followersList.length > 0 && <span className="ml-2 inline-block w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">{followersList.length}</span>}
                      </TabsTrigger>
                      <TabsTrigger value="reports" className="flex-1 data-[state=active]:bg-white rounded-md">
                        <Flag className="h-4 w-4 mr-2" />
                        Reports {!reportsCleared && reportsAgainstMe.length > 0 && <span className="ml-2 inline-block w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">{reportsAgainstMe.length}</span>}
                      </TabsTrigger>
                    </TabsList>
                    
                    {/* Comments Notification */}
                    <TabsContent value="comments" className="mt-6">
                      <div>
                        <div className="flex items-center justify-between gap-3 mb-4">
                          <p className="text-sm text-muted-foreground">Comments on your issues</p>
                          {!commentsCleared && totalComments > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full"
                              onClick={() => {
                                handleMarkCommentsRead();
                              }}
                            >
                              Mark as read
                            </Button>
                          )}
                        </div>
                        {owned.length === 0 ? (
                          <Card className="rounded-2xl border border-white/60 bg-white/50 backdrop-blur-2xl shadow-lg shadow-orange-100/20 p-12 text-center">
                            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">No issues yet. Create one to receive comments!</p>
                          </Card>
                        ) : (
                          <CommentNotificationsList issues={owned} engagementMap={engagementMap} onIssueClick={(issue) => {
                            setSelectedIssue(issue);
                            setDetailDialogOpen(true);
                          }} />
                        )}
                      </div>
                    </TabsContent>
                    
                    {/* Followers Notification */}
                    <TabsContent value="followers" className="mt-6">
                      <div>
                        <div className="flex items-center justify-between gap-3 mb-4">
                          <p className="text-sm text-muted-foreground">People following you</p>
                          {!followersCleared && followersList.length > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full"
                              onClick={handleMarkFollowersRead}
                            >
                              Mark as read
                            </Button>
                          )}
                        </div>
                        {followersList.length > 0 ? (
                          <div className="space-y-3">
                            {followersList.map((follower) => (
                              <Card key={follower.userId} className="rounded-2xl border border-purple-200/50 bg-purple-50/50 backdrop-blur-2xl shadow-lg shadow-purple-100/20 p-4 hover:shadow-purple-100/40 transition-all">
                                <CardContent className="p-0">
                                  <div className="flex items-center justify-between">
                                    <Link to={`/profile/${follower.userId}`} className="flex items-center gap-3 flex-1">
                                      <Avatar className="h-10 w-10 ring-2 ring-purple-200">
                                        <AvatarImage src={follower.photoURL} />
                                        <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold">
                                          {follower.displayName.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm text-stone-900 truncate">{follower.displayName}</p>
                                        {follower.username && (
                                          <p className="text-xs text-muted-foreground truncate">@{follower.username}</p>
                                        )}
                                      </div>
                                    </Link>
                                    <Badge variant="secondary" className="bg-purple-100/80 text-purple-700 border-purple-200">
                                      Following
                                    </Badge>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <Card className="rounded-2xl border border-white/60 bg-white/50 backdrop-blur-2xl shadow-lg shadow-orange-100/20 p-12 text-center">
                            <Users className="h-12 w-12 mx-auto mb-3 opacity-30 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">No followers yet. Share your profile to gain followers!</p>
                          </Card>
                        )}
                      </div>
                    </TabsContent>
                    
                    {/* Reports Notification */}
                    <TabsContent value="reports" className="mt-6">
                      {isOwner ? (
                        <div className="space-y-4">
                          {/* Toggle Buttons */}
                          <div className="flex gap-2 mb-6">
                            <Button
                              onClick={() => setReportView('against-me')}
                              className={cn(
                                "flex-1 rounded-lg px-4 py-2 transition-all",
                                reportView === 'against-me'
                                  ? 'bg-red-600 text-white hover:bg-red-700'
                                  : 'bg-stone-200 text-stone-900 hover:bg-stone-300'
                              )}
                            >
                              <Flag className="h-4 w-4 mr-2 inline" />
                              Reports Against You ({reportsAgainstMe.length})
                            </Button>
                            <Button
                              onClick={() => setReportView('review')}
                              className={cn(
                                "flex-1 rounded-lg px-4 py-2 transition-all",
                                reportView === 'review'
                                  ? 'bg-amber-600 text-white hover:bg-amber-700'
                                  : 'bg-stone-200 text-stone-900 hover:bg-stone-300'
                              )}
                            >
                              <Users className="h-4 w-4 mr-2 inline" />
                              Review Reports ({reviewableReports.length})
                            </Button>
                          </div>

                          {/* Section 1: Reports Against You */}
                          {reportView === 'against-me' && (
                            <div className="space-y-4">
                              <div>
                                <h3 className="text-lg font-semibold mb-2">Reports Against Your Content</h3>
                                <div className="flex items-center justify-between gap-3 mb-4">
                                  <p className="text-sm text-muted-foreground">Review reports and take action</p>
                                  {!reportsCleared && reportsAgainstMe.length > 0 && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="rounded-full"
                                      onClick={() => {
                                        setReportsCleared(true);
                                        if (commentsCleared && followersCleared) {
                                          setNotificationsCleared(true);
                                        }
                                      }}
                                    >
                                      Mark as read
                                    </Button>
                                  )}
                                </div>
                                  {reportsAgainstMe && reportsAgainstMe.length > 0 && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="mb-4 rounded-full"
                                      onClick={() => {
                                        reportsAgainstMe.forEach((report: any) => {
                                          if (report.status === 'pending') {
                                            updateReportStatus.mutate({ reportId: report.id, status: 'reviewed' });
                                          }
                                        });
                                        setReportsCleared(true);
                                        setNotificationsCleared(true);
                                        toast.success('Reports marked as reviewed');
                                      }}
                                      disabled={updateReportStatus.isPending}
                                    >
                                      Mark all as reviewed
                                    </Button>
                                  )}
                              </div>
                              
                              {reportsAgainstMe && reportsAgainstMe.length > 0 ? (
                                <div className="space-y-3">
                                  {reportsAgainstMe.map((report: any) => (
                                    <Card key={report.id} className="rounded-2xl border border-red-200/50 bg-red-50/50 backdrop-blur-2xl shadow-lg shadow-red-100/20 p-4">
                                      <CardContent className="p-0 space-y-3">
                                        {/* Report Header */}
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            <p className="text-sm font-semibold text-stone-900">
                                              Reported by <span className="font-bold">{report.reporterName}</span>
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              {formatRelativeTime(
                                                report.createdAt?.toMillis?.() ||
                                                report.createdAt?.seconds * 1000 ||
                                                Date.now()
                                              )}
                                            </p>
                                          </div>
                                          <Badge 
                                            variant="outline" 
                                            className="bg-red-100 text-red-700 border-red-300 whitespace-nowrap"
                                          >
                                            {report.reason}
                                          </Badge>
                                        </div>

                                        {/* Report Context */}
                                        {report.context?.issueTitle && (
                                          <div className="bg-red-100/50 border border-red-200 rounded-lg p-2 text-sm">
                                            <p className="text-muted-foreground">Issue:</p>
                                            <p className="font-medium text-stone-900">{report.context.issueTitle}</p>
                                          </div>
                                        )}

                                        {/* Report Details */}
                                        <div>
                                          <p className="text-sm text-muted-foreground mb-1">Details:</p>
                                          <p className="text-sm text-stone-700 bg-white/50 rounded p-2">
                                            {report.details}
                                          </p>
                                        </div>

                                        {/* Status Badge */}
                                        <div className="flex items-center justify-between pt-2 border-t border-red-200/50">
                                          <Badge
                                            variant="secondary"
                                            className={cn(
                                              "capitalize",
                                              report.status === 'pending' && 'bg-yellow-100 text-yellow-700',
                                              report.status === 'reviewed' && 'bg-blue-100 text-blue-700',
                                              report.status === 'resolved' && 'bg-green-100 text-green-700',
                                              report.status === 'dismissed' && 'bg-gray-100 text-gray-700',
                                            )}
                                          >
                                            {report.status}
                                          </Badge>
                                          <p className="text-xs text-muted-foreground">
                                            View the issue to review and take action
                                          </p>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              ) : (
                                <Card className="rounded-2xl border border-green-200/50 bg-green-50/50 backdrop-blur-2xl shadow-lg shadow-green-100/20 p-12 text-center">
                                  <Check className="h-12 w-12 mx-auto mb-3 opacity-30 text-green-600" />
                                  <p className="text-sm text-muted-foreground">No reports against your content. Great job!</p>
                                </Card>
                              )}
                            </div>
                          )}

                          {/* Section 2: Reports You Can Review */}
                          {reportView === 'review' && (
                            <div className="space-y-4">
                              <div>
                                <h3 className="text-lg font-semibold mb-2">Reports You Can Review</h3>
                                <p className="text-sm text-muted-foreground mb-4">Community moderation - vote on report validity</p>
                              </div>
                              
                              {reviewableReports && reviewableReports.length > 0 ? (
                                <div className="space-y-3">
                                  {reviewableReports.map((report: any) => (
                                    <ReportCard key={report.id} report={report} voteOnReport={voteOnReport} />
                                  ))}
                                </div>
                              ) : (
                                <Card className="rounded-2xl border border-stone-200/50 bg-white/50 backdrop-blur-2xl shadow-lg shadow-stone-100/20 p-12 text-center">
                                  <Flag className="h-12 w-12 mx-auto mb-3 opacity-30 text-muted-foreground" />
                                  <p className="text-sm text-muted-foreground">No reports to review. Check back later!</p>
                                </Card>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                          <Card className="rounded-2xl border border-amber-200/50 bg-amber-50/50 backdrop-blur-2xl shadow-lg shadow-amber-100/20 p-6">
                            <div className="flex items-start gap-4">
                              <AlertCircle className="h-8 w-8 text-amber-600 flex-shrink-0 mt-1" />
                              <div>
                                <h3 className="font-semibold text-stone-900 mb-2">Community Review System</h3>
                                <p className="text-sm text-muted-foreground mb-3">
                                  Help moderate the community by reviewing reports on other users' issues and profiles. The community votes on whether reported content violates guidelines.
                                </p>
                                <ul className="text-sm text-muted-foreground space-y-2">
                                  <li className="flex items-center gap-2">
                                    <Flag className="h-4 w-4 text-amber-500" />
                                    View reports filed against other users' content
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-amber-500" />
                                    Community votes to verify report validity
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-amber-500" />
                                    Moderators make final decisions
                                  </li>
                                </ul>
                                <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-amber-200/50">
                                  Report functionality for non-owners coming soon. Help keep our community safe by reporting problematic content!
                                </p>
                              </div>
                            </div>
                          </Card>
                        )}
                    </TabsContent>
                  </Tabs>
                </div>
              </TabsContent>
              
              {/* Activity Tab */}
              <TabsContent value="analytics" className="mt-6">
                  <div className="space-y-6">
                    {/* Simplified Activity Section */}
                    {isActivityLoading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 2 }).map((_, i) => (
                          <Skeleton key={i} className="h-16 rounded-xl" />
                        ))}
                      </div>
                    ) : userActivity ? (
                      <Card className="rounded-2xl border border-white/60 bg-white/50 backdrop-blur-2xl shadow-lg shadow-orange-100/20 p-6">
                        <h2 className="text-xl font-semibold tracking-tight mb-6">Activity</h2>
                        
                        {/* Simple Activity Metrics */}
                        <div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100/50">
                              <div className="text-2xl font-bold text-orange-600">{analytics.totalIssues}</div>
                              <div className="text-xs text-stone-500 mt-1">Issues</div>
                            </div>
                            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100/50">
                              <div className="text-2xl font-bold text-amber-600">{analytics.resolvedIssues}</div>
                              <div className="text-xs text-stone-500 mt-1">Resolved</div>
                            </div>
                            <div className="text-center p-4 rounded-xl bg-white/80 border border-stone-100">
                              <div className="text-2xl font-bold text-stone-700">{followCounts.followers}</div>
                              <div className="text-xs text-stone-500 mt-1">Followers</div>
                            </div>
                            <div className="text-center p-4 rounded-xl bg-white/80 border border-stone-100">
                              <div className="text-2xl font-bold text-stone-700">{followCounts.following}</div>
                              <div className="text-xs text-stone-500 mt-1">Following</div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ) : null}

                    {/* Activity Feed */}
                    {!isActivityLoading && userActivity && (userActivity.comments.length > 0 || userActivity.votedIssues.length > 0 || owned.length > 0) && (
                        <Card className="rounded-2xl border border-white/60 bg-white/50 backdrop-blur-2xl shadow-lg shadow-orange-100/20 overflow-hidden">
                          <CardHeader className="border-b border-stone-100">
                            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
                            <p className="text-xs text-stone-500">Your latest interactions</p>
                          </CardHeader>
                          <CardContent className="p-0">
                            <div className="divide-y divide-stone-100">
                              {(() => {
                                // Combine all activities with timestamps
                                const activities: Array<{
                                  type: 'comment' | 'upvote' | 'downvote' | 'issue_created' | 'issue_resolved';
                                  content: string;
                                  timestamp: Date;
                                  icon: typeof MessageSquare;
                                  color: string;
                                }> = [];

                                // Add comments
                                userActivity.comments.forEach(comment => {
                                  activities.push({
                                    type: 'comment',
                                    content: `You commented: "${comment.content?.slice(0, 80)}${comment.content && comment.content.length > 80 ? '...' : ''}"`,
                                    timestamp: comment.createdAt?.toDate?.() || new Date(),
                                    icon: MessageSquare,
                                    color: 'text-sky-600'
                                  });
                                });

                                // Add upvotes
                                userActivity.votedIssues.filter(v => v.vote === 1).forEach(vote => {
                                  const issue = issues?.find(i => i.id === vote.issueId);
                                  if (issue) {
                                    activities.push({
                                      type: 'upvote',
                                      content: `You upvoted: "${issue.title?.slice(0, 60)}${issue.title && issue.title.length > 60 ? '...' : ''}"`,
                                      timestamp: vote.voteDate?.toDate?.() || new Date(issue.createdAt || Date.now()),
                                      icon: ThumbsUp,
                                      color: 'text-green-600'
                                    });
                                  }
                                });

                                // Add downvotes
                                userActivity.votedIssues.filter(v => v.vote === -1).forEach(vote => {
                                  const issue = issues?.find(i => i.id === vote.issueId);
                                  if (issue) {
                                    activities.push({
                                      type: 'downvote',
                                      content: `You downvoted: "${issue.title?.slice(0, 60)}${issue.title && issue.title.length > 60 ? '...' : ''}"`,
                                      timestamp: vote.voteDate?.toDate?.() || new Date(issue.createdAt || Date.now()),
                                      icon: ThumbsDown,
                                      color: 'text-red-600'
                                    });
                                  }
                                });

                                // Add user's issues created
                                owned.forEach(issue => {
                                  activities.push({
                                    type: 'issue_created',
                                    content: `You created issue: "${issue.title?.slice(0, 60)}${issue.title && issue.title.length > 60 ? '...' : ''}"`,
                                    timestamp: new Date(issue.createdAt || Date.now()),
                                    icon: Plus,
                                    color: 'text-orange-600'
                                  });
                                });

                                // Add resolved issues
                                owned.filter(i => i.status === 'resolved').forEach(issue => {
                                  activities.push({
                                    type: 'issue_resolved',
                                    content: `You resolved: "${issue.title?.slice(0, 60)}${issue.title && issue.title.length > 60 ? '...' : ''}"`,
                                    timestamp: new Date(issue.createdAt || Date.now()),
                                    icon: Check,
                                    color: 'text-emerald-600'
                                  });
                                });

                                // Sort by timestamp (most recent first)
                                activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

                                // Show top 15 activities
                                return activities.slice(0, 15).map((activity, idx) => {
                                  const Icon = activity.icon;
                                  return (
                                    <div key={idx} className="p-4 hover:bg-white/40 transition-colors flex gap-3">
                                      <div className={`flex-shrink-0 ${activity.color}`}>
                                        <Icon className="h-5 w-5" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm text-stone-900 line-clamp-2">{activity.content}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {formatRelativeTime(activity.timestamp)}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          </CardContent>
                        </Card>
                    )}

                    {!isActivityLoading && userActivity && !(userActivity.comments.length > 0 || userActivity.votedIssues.length > 0 || owned.length > 0) && (
                      <Card className="rounded-2xl border border-white/60 bg-white/50 backdrop-blur-2xl shadow-lg shadow-orange-100/20 p-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center mx-auto mb-4">
                          <AlertCircle className="h-8 w-8 text-orange-500" />
                        </div>
                        <p className="text-stone-600">No recent activity to show</p>
                      </Card>
                    )}
                    
                    {!userActivity && !isActivityLoading && (
                      <Card className="rounded-2xl border border-white/60 bg-white/50 backdrop-blur-2xl shadow-lg shadow-orange-100/20 p-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center mx-auto mb-4">
                          <AlertCircle className="h-8 w-8 text-orange-500" />
                        </div>
                        <p className="text-stone-600">No activity data available</p>
                      </Card>
                    )}
                  </div>
                </TabsContent>
              
              {/* Settings Tab */}
              <TabsContent value="settings" className="mt-6">
                <div className="max-w-2xl space-y-6">
                  {/* Profile Overview */}
                  <Card className="rounded-2xl border border-white/60 bg-white/50 backdrop-blur-2xl shadow-lg shadow-orange-100/20 p-6">
                    <h3 className="font-semibold text-lg mb-4">Profile Overview</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Display Name:</span>
                        <span className="font-medium">{user?.displayName || 'Not set'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium">{user?.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Issues:</span>
                        <span className="font-medium">{owned.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Followers:</span>
                        <span className="font-medium">{followCounts.followers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Following:</span>
                        <span className="font-medium">{followCounts.following}</span>
                      </div>
                    </div>
                  </Card>
                  
                  <Separator />
                  
                  {/* Sign Out */}
                  <Card className="rounded-2xl border border-red-300/60 bg-red-50/50 backdrop-blur-2xl shadow-lg shadow-red-100/20 p-6">
                    <h3 className="font-semibold text-lg mb-2 text-red-900">Account</h3>
                    <Button 
                      variant="destructive" 
                      className="rounded-full"
                      onClick={() => setSignOutConfirmOpen(true)}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
        
        {/* Dialogs - Wrapped in PortalErrorBoundary to prevent removeChild errors */}
        <PortalErrorBoundary>
          {/* Sign Out Confirmation Dialog */}
          <Dialog open={signOutConfirmOpen} onOpenChange={setSignOutConfirmOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  Confirm Sign Out
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-stone-700">
                  Are you sure you want to sign out? You'll need to sign in again to access your account.
                </p>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setSignOutConfirmOpen(false)}
                    className="rounded-full"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleSignOut}
                    className="rounded-full"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {selectedIssue && (
            <>
              <ResolveIssueDialog
                open={resolveDialogOpen}
                onOpenChange={setResolveDialogOpen}
                issueTitle={selectedIssue.title}
                onResolve={async (resolution) => {
                  await resolveIssue.mutateAsync({
                    id: selectedIssue.id,
                    ...resolution
                  });
                }}
              />
              <AddProgressDialog
                open={progressDialogOpen}
                onOpenChange={setProgressDialogOpen}
                issueTitle={selectedIssue.title}
                onAddProgress={(data) => {
                  addProgress.mutate({
                    id: selectedIssue.id,
                    ...data
                  });
                }}
              />
              <IssueDetailDialog
                open={detailDialogOpen}
                onOpenChange={setDetailDialogOpen}
                issue={selectedIssue}
                onVisibilityChange={handleVisibilityChange}
                onSetStatus={isOwner ? handleStatusChange : undefined}
              />
            </>
          )}

          {/* Message Dialog */}
          {!isOwner && user && (
            <SendMessageDialog
              open={messageDialogOpen}
              onOpenChange={setMessageDialogOpen}
              targetUserId={uid!}
              targetUserName={ownerProfile?.displayName || 'User'}
              targetUserAvatar={avatarUrl}
            />
          )}

          {/* Report User Dialog */}
          {!isOwner && user && (
            <ReportUserDialog
              open={reportUserDialogOpen}
              onOpenChange={setReportUserDialogOpen}
              reportedUserId={uid!}
              reportedUserName={ownerProfile?.displayName || 'User'}
            />
          )}

          {/* Followers Dialog */}
          <Dialog open={followersDialogOpen} onOpenChange={setFollowersDialogOpen}>
            <DialogContent className="max-w-md max-h-[600px] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Followers ({followCounts.followers})
                </DialogTitle>
              </DialogHeader>
              <div className="overflow-y-auto flex-1 -mx-6 px-6">
                {followersList.length > 0 ? (
                  <div className="space-y-3">
                    {followersList.map((follower) => (
                      <div key={follower.userId} className="flex items-center gap-3 p-3 hover:bg-stone-50 rounded-lg transition-colors">
                        <Link to={`/profile/${follower.userId}`} className="flex items-center gap-3 flex-1" onClick={() => setFollowersDialogOpen(false)}>
                          <Avatar className="h-10 w-10 ring-2 ring-orange-200">
                            <AvatarImage src={follower.photoURL} />
                            <AvatarFallback className="bg-orange-100 text-orange-700 font-semibold">
                              {follower.displayName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-stone-900 truncate">{follower.displayName}</p>
                            {follower.username && (
                              <p className="text-xs text-muted-foreground truncate">@{follower.username}</p>
                            )}
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-30 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No followers yet</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Following Dialog */}
          <Dialog open={followingDialogOpen} onOpenChange={setFollowingDialogOpen}>
            <DialogContent className="max-w-md max-h-[600px] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Following ({followCounts.following})
                </DialogTitle>
              </DialogHeader>
              <div className="overflow-y-auto flex-1 -mx-6 px-6">
                {followingList.length > 0 ? (
                  <div className="space-y-3">
                    {followingList.map((following) => (
                      <div key={following.userId} className="flex items-center gap-3 p-3 hover:bg-stone-50 rounded-lg transition-colors">
                        <Link to={`/profile/${following.userId}`} className="flex items-center gap-3 flex-1" onClick={() => setFollowingDialogOpen(false)}>
                          <Avatar className="h-10 w-10 ring-2 ring-blue-200">
                            <AvatarImage src={following.photoURL} />
                            <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                              {following.displayName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-stone-900 truncate">{following.displayName}</p>
                            {following.username && (
                              <p className="text-xs text-muted-foreground truncate">@{following.username}</p>
                            )}
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-30 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Not following anyone yet</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </PortalErrorBoundary>
      </ParticlesBackground>
    </div>
  );
}

