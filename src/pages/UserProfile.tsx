import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useIssuesFirebase } from '@/hooks/use-issues-firebase';
import { useAuth } from '@/hooks/use-auth';
import { useUserActivity } from '@/hooks/use-user-activity';
import { useActivityTracker } from '@/hooks/use-activity-tracker';
import { useReceivedMessages } from '@/hooks/use-messaging';
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
import { Edit2, Check, Settings, MapPin, Github, Twitter, Linkedin, Instagram, Link2, Calendar, Activity as ActivityIcon, ThumbsUp, ThumbsDown, MessageSquare, TrendingUp, Plus, AlertCircle, LogOut, Mail, Send, Image as ImageIcon, GraduationCap } from 'lucide-react';
import ResolveIssueDialog from '@/components/ResolveIssueDialog';
import AddProgressDialog from '@/components/AddProgressDialog';
import IssueDetailDialog from '@/components/IssueDetailDialog';
import IssueAnalyticsDialog from '@/components/IssueAnalyticsDialog';
import SendMessageDialog from '@/components/SendMessageDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatRelativeTime } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { isFirebaseConfigured } from '@/integrations/firebase/config';
import { Separator } from '@/components/ui/separator';
import { useIssueEngagement } from '@/hooks/use-issue-engagement';
import { ISSUE_STATUSES } from '@/types/issue';
import { useIsFollowing, useFollowUser, useUnfollowUser, useFollowCounts } from '@/hooks/use-follow';
import { toast } from 'sonner';
import ParticlesBackground from '@/components/ParticlesBackground';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAvatarUrl } from '@/hooks/use-avatar-url';

export default function UserProfile() {
  const { uid } = useParams();
  
  // Early validation
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
  
  const [search] = useSearchParams();
  const { user } = useAuth();
  const { data: issues, isLoading, stats, setVisibility, resolveIssue, addProgress } = useIssuesFirebase();
  const { data: userActivity, isLoading: isActivityLoading } = useUserActivity();
  const activityTracker = useActivityTracker();
  
  // Conditionally call useReceivedMessages only if user is authenticated
  const { data: receivedMessages, isLoading: messagesLoading, error: messagesError } = useReceivedMessages();
  
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // Get user profile data
  const { data: ownerProfile, isLoading: profileLoading } = useUserProfile(uid);
  
  // Resolve avatar URL (handles firestore:// references)
  const avatarUrl = useAvatarUrl(ownerProfile?.photoURL, uid || '');
  const hasSocialLinks = !!(
    ownerProfile?.social && (
      ownerProfile.social.website ||
      ownerProfile.social.github ||
      ownerProfile.social.twitter ||
      ownerProfile.social.linkedin ||
      ownerProfile.social.instagram
    )
  );

  const socialIcons = hasSocialLinks ? (
    <div className="flex flex-wrap gap-3 justify-end">
      {ownerProfile?.social?.website && (
        <a 
          href={ownerProfile?.social?.website} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-orange-600 hover:text-orange-700 transition-all hover:shadow-md"
          title="Website"
        >
          <Link2 className="h-5 w-5" />
        </a>
      )}
      {ownerProfile?.social?.github && (
        <a 
          href={ownerProfile?.social?.github} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 text-slate-800 hover:text-slate-900 transition-all hover:shadow-md"
          title="GitHub"
        >
          <Github className="h-5 w-5" />
        </a>
      )}
      {ownerProfile?.social?.twitter && (
        <a 
          href={ownerProfile?.social?.twitter} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 text-blue-500 hover:text-blue-600 transition-all hover:shadow-md"
          title="Twitter"
        >
          <Twitter className="h-5 w-5" />
        </a>
      )}
      {ownerProfile?.social?.linkedin && (
        <a 
          href={ownerProfile?.social?.linkedin} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 hover:text-blue-800 transition-all hover:shadow-md"
          title="LinkedIn"
        >
          <Linkedin className="h-5 w-5" />
        </a>
      )}
      {ownerProfile?.social?.instagram && (
        <a 
          href={ownerProfile?.social?.instagram} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-pink-50 to-rose-50 hover:from-pink-100 hover:to-rose-100 text-pink-600 hover:text-pink-700 transition-all hover:shadow-md"
          title="Instagram"
        >
          <Instagram className="h-5 w-5" />
        </a>
      )}
    </div>
  ) : null;
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);

  // Filter issues belonging to this user
  const owned = (issues || []).filter(i => i.createdBy === uid);
  const previewVisitor = search.get('previewVisitor') === '1' || search.get('as') === 'visitor';
  const rawIsOwner = user?.uid === uid;
  const isOwner = previewVisitor ? false : rawIsOwner;
  const { data: isFollowing = false } = useIsFollowing(!isOwner ? uid : undefined);
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();
  
  const { data: followCounts = { followers: 0, following: 0 } } = useFollowCounts(uid);
  
  // Fetch engagement metrics for all owned issues
  const ownedIssueIds = useMemo(() => owned.map(i => i.id), [owned]);
  const { data: engagementMap = {} } = useIssueEngagement(ownedIssueIds);
  type WithVisibility = { visibility?: 'public' | 'private' | 'draft' };
  const publicIssues = owned.filter(i => {
    const vis = (i as unknown as WithVisibility).visibility;
    return vis === 'public';
  });
  // Private issues visible to follower if owner opted in
  const followerPrivateIssues = !isOwner && isFollowing && ownerProfile?.showPrivateToFollowers
    ? owned.filter(i => (i as unknown as WithVisibility).visibility === 'private')
    : [];
  const privateCount = owned.filter(i => (i as unknown as WithVisibility).visibility === 'private').length;
  const draftCount = owned.filter(i => (i as unknown as WithVisibility).visibility === 'draft').length;
  
  // Calculate total analytics from engagement data
  const analytics = useMemo(() => {
    let totalUpvotes = 0;
    let totalDownvotes = 0;
    let totalComments = 0;
    let totalSupports = 0;
    
    owned.forEach(issue => {
      const engagement = engagementMap[issue.id];
      if (engagement) {
        totalUpvotes += engagement.upvotes;
        totalDownvotes += engagement.downvotes;
        totalComments += engagement.comments;
      }
      totalSupports += issue.votes || 0;
    });
    
    const totalEngagement = totalUpvotes + totalDownvotes + totalComments;
    
    return {
      totalIssues: owned.length,
      totalUpvotes,
      totalDownvotes,
      totalComments,
      totalSupports,
      totalEngagement,
      resolvedIssues: owned.filter(i => i.status === 'resolved').length,
    };
  }, [owned, engagementMap]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
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

  const handleViewDetails = (issue: Issue) => {
    setSelectedIssue(issue);
    setDetailDialogOpen(true);
  };

  const handleViewAnalytics = (issue: Issue) => {
    setSelectedIssue(issue);
    setAnalyticsDialogOpen(true);
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

  return (
    <div className="min-h-screen bg-stone-50 animate-in fade-in duration-300">
      <ParticlesBackground fullPage hexOpacity={0.10}>
        <Navbar />
        <main className="pt-24 pb-24 px-4 mx-auto max-w-5xl">
          {/* Unified Twitter/X Style Profile for everyone */}
          <div className="max-w-4xl mx-auto">
            {/* Profile Section */}
            <div className="relative pt-8">
              {/* Profile Picture */}
              <div className="flex flex-col items-start gap-3 mb-8">
                <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-orange-500 to-amber-500 text-white">
                    {ownerProfile?.displayName?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                {isOwner && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full bg-white/80 backdrop-blur-xl border border-white/60 hover:bg-white/95 text-stone-900 shadow-lg shadow-black/10"
                    onClick={() => navigate(`/profile/${uid}/edit`)}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
              
              {/* Action Buttons with Glassmorphism */}
              <div className="absolute top-4 right-4 flex flex-wrap justify-end gap-2 backdrop-blur-md">
                {socialIcons}
                {!isOwner && user && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full bg-white/80 backdrop-blur-xl border border-white/60 hover:bg-white/95 text-stone-900 shadow-lg shadow-black/10"
                      onClick={() => setMessageDialogOpen(true)}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                    {isFollowing ? (
                      <Button
                        size="sm"
                        className="rounded-full bg-white/80 backdrop-blur-xl border border-white/60 hover:bg-white/95 text-stone-900 shadow-lg shadow-black/10"
                        disabled={unfollowMutation.isPending}
                        onClick={() => unfollowMutation.mutate(uid!)}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        {unfollowMutation.isPending ? 'Unfollowing...' : 'Following'}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white backdrop-blur-xl shadow-lg shadow-orange-500/30 hover:shadow-lg hover:shadow-orange-600/40 transition-all"
                        disabled={followMutation.isPending}
                        onClick={() => followMutation.mutate(uid!)}
                      >
                        {followMutation.isPending ? 'Following...' : 'Follow'}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Profile Info Section with Glassmorphism */}
            <div className="mt-20 px-6 pb-4 border-b border-white/30">
              <div className="mb-4">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <h1 className="text-2xl font-bold tracking-tight">{ownerProfile?.displayName || 'User'}</h1>
                  {ownerProfile?.pronouns && (
                    <span className="text-sm text-muted-foreground font-normal">({ownerProfile.pronouns})</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-3">@{ownerProfile?.username || ownerProfile?.displayName?.toLowerCase().replace(/\s+/g, '') || 'user'}</p>
              </div>
              
              {ownerProfile?.bio && (
                <p className="text-sm text-stone-900 mb-3 leading-relaxed">{ownerProfile.bio}</p>
              )}
              
              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3 mt-1">
                {ownerProfile?.college && (
                  <span className="inline-flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4" /> {ownerProfile.college}
                  </span>
                )}
                {ownerProfile?.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" /> {ownerProfile.location}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" /> Joined {ownerProfile?.createdAt ? new Date(ownerProfile.createdAt as number | string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown'}
                </span>
              </div>
              
              {/* Follower Counts */}
              <div className="flex gap-6 text-sm">
                <div className="flex flex-col">
                  <span className="font-semibold text-stone-900">{followCounts.followers}</span>
                  <span className="text-muted-foreground text-xs">Followers</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-stone-900">{followCounts.following}</span>
                  <span className="text-muted-foreground text-xs">Following</span>
                </div>
              </div>
            </div>
            
            {/* Unified Tabs for Content */}
            <Tabs defaultValue="issues" className="w-full">
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
                      value="analytics" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-transparent px-6 py-4"
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Analytics & Activity
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
                {isOwner ? (
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
                                  className="rounded-2xl border border-white/60 bg-white/50 backdrop-blur-2xl flex flex-col hover:shadow-2xl hover:shadow-orange-300/30 hover:border-orange-300/60 hover:bg-white/60 transition-all cursor-pointer"
                                  onClick={() => handleViewDetails(issue)}
                                >
                                  <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-2">
                                      <CardTitle className="text-base font-semibold leading-snug line-clamp-2">{issue.title}</CardTitle>
                                      {vis && vis !== 'public' && (
                                        <Badge variant="outline" className="text-xs capitalize shrink-0 border-orange-300/60 text-orange-700/80 bg-orange-50/50">{vis}</Badge>
                                      )}
                                    </div>
                                  </CardHeader>
                                  <CardContent className="flex flex-col gap-3 text-sm flex-1">
                                    <p className="text-muted-foreground line-clamp-3">{issue.description}</p>
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
                ) : (
                  /* Visitor view - show public and follower-accessible private issues */
                  <>
                    {isLoading && (
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <Skeleton key={i} className="h-40 rounded-2xl" />
                        ))}
                      </div>
                    )}
                    {!isLoading && publicIssues.length === 0 && followerPrivateIssues.length === 0 && (
                      <Card className="rounded-2xl border border-white/60 bg-white/50 backdrop-blur-2xl shadow-xl shadow-orange-100/20 p-10 text-center">
                        <p className="text-muted-foreground">No public issues yet.</p>
                      </Card>
                    )}
                    {!isLoading && (publicIssues.length > 0 || followerPrivateIssues.length > 0) && (
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {[...publicIssues, ...followerPrivateIssues].map(issue => {
                          const vis = (issue as unknown as WithVisibility).visibility;
                          const engagement = engagementMap[issue.id] || { upvotes: 0, downvotes: 0, comments: 0, commentLikes: 0 };
                          return (
                            <Card 
                              key={issue.id} 
                              className="rounded-2xl border border-white/60 bg-white/50 backdrop-blur-2xl flex flex-col hover:shadow-2xl hover:shadow-orange-300/30 hover:border-orange-300/60 hover:bg-white/60 transition-all cursor-pointer"
                              onClick={() => handleViewDetails(issue)}
                            >
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-2">
                                  <CardTitle className="text-base font-semibold leading-snug line-clamp-2">{issue.title}</CardTitle>
                                  {vis && vis !== 'public' && (
                                    <Badge variant="outline" className="text-xs capitalize shrink-0 border-orange-300/60 text-orange-700/80 bg-orange-50/50">{vis}</Badge>
                                  )}
                                </div>
                              </CardHeader>
                              <CardContent className="flex flex-col gap-3 text-sm flex-1">
                                <p className="text-muted-foreground line-clamp-3">{issue.description}</p>
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
                  </>
                )}
              </TabsContent>
              
              {/* Messages Tab (Owner Only) */}
              {isOwner && (
                <TabsContent value="messages" className="mt-6">
                  <div className="max-w-4xl space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold tracking-tight mb-2">Your Messages</h2>
                      <p className="text-sm text-muted-foreground mb-4">Messages sent to you by other users</p>
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
                                            message.createdAt?.toDate?.() || new Date(message.createdAt || Date.now())
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
                  </div>
                </TabsContent>
              )}
              
              {/* Analytics & Activity Tab (Owner Only) */}
              {isOwner && (
                <TabsContent value="analytics" className="mt-6">
                  <div className="space-y-6">
                    {/* Analytics Section */}
                    <div>
                      <h2 className="text-xl font-semibold tracking-tight mb-4">Analytics</h2>
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <Card className="rounded-2xl border border-white/60 bg-white/50 backdrop-blur-2xl shadow-lg shadow-orange-100/20 p-6 hover:shadow-xl hover:shadow-orange-200/30 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-full bg-orange-100">
                              <TrendingUp className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Total Issues</p>
                              <p className="text-2xl font-bold">{analytics.totalIssues}</p>
                            </div>
                          </div>
                        </Card>
                        
                        <Card className="rounded-2xl border border-white/60 bg-white/50 backdrop-blur-2xl shadow-lg shadow-green-100/20 p-6 hover:shadow-xl hover:shadow-green-200/30 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-full bg-green-100">
                              <ThumbsUp className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Total Upvotes</p>
                              <p className="text-2xl font-bold">{analytics.totalUpvotes}</p>
                            </div>
                          </div>
                        </Card>
                        
                        {(!ownerProfile?.hideDislikeCounts || isOwner) && (
                          <Card className="rounded-2xl border border-white/60 bg-white/50 backdrop-blur-2xl shadow-lg shadow-red-100/20 p-6 hover:shadow-xl hover:shadow-red-200/30 transition-all">
                            <div className="flex items-center gap-4">
                              <div className="p-3 rounded-full bg-red-100">
                                <ThumbsDown className="h-6 w-6 text-red-600" />
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Total Downvotes</p>
                                <p className="text-2xl font-bold">{analytics.totalDownvotes}</p>
                              </div>
                            </div>
                          </Card>
                        )}
                        
                        <Card className="rounded-2xl border border-white/60 bg-white/50 backdrop-blur-2xl shadow-lg shadow-blue-100/20 p-6 hover:shadow-xl hover:shadow-blue-200/30 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-full bg-blue-100">
                              <MessageSquare className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Total Comments</p>
                              <p className="text-2xl font-bold">{analytics.totalComments}</p>
                            </div>
                          </div>
                        </Card>
                        
                        <Card className="rounded-2xl border border-white/60 bg-white/50 backdrop-blur-2xl shadow-lg shadow-purple-100/20 p-6 hover:shadow-xl hover:shadow-purple-200/30 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-full bg-purple-100">
                              <TrendingUp className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Total Supports</p>
                              <p className="text-2xl font-bold">{analytics.totalSupports}</p>
                            </div>
                          </div>
                        </Card>
                        
                        <Card className="rounded-2xl border border-white/60 bg-white/50 backdrop-blur-2xl shadow-lg shadow-amber-100/20 p-6 hover:shadow-xl hover:shadow-amber-200/30 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-full bg-amber-100">
                              <Check className="h-6 w-6 text-amber-600" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Resolved Issues</p>
                              <p className="text-2xl font-bold">{analytics.resolvedIssues}</p>
                            </div>
                          </div>
                        </Card>
                      </div>
                    </div>

                    {/* Activity Section */}
                    <div>
                      <h2 className="text-xl font-semibold tracking-tight mb-2">Activity</h2>
                      <p className="text-sm text-muted-foreground mb-4">Your latest interactions and updates</p>
                    </div>
                    
                    {isActivityLoading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Skeleton key={i} className="h-16 rounded-xl" />
                        ))}
                      </div>
                    ) : userActivity ? (
                      <div className="space-y-4">
                        {/* Activity Summary - Always show */}
                        <Card className="rounded-2xl border border-white/60 bg-white/50 backdrop-blur-2xl shadow-lg shadow-orange-100/20 p-6">
                          <h3 className="font-semibold text-lg mb-4">Activity Summary</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="text-center p-3 rounded-lg bg-orange-50 border border-orange-200">
                              <div className="text-2xl font-bold text-orange-600">{owned.length}</div>
                              <div className="text-xs text-muted-foreground mt-1">Total Issues</div>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-200">
                              <div className="text-2xl font-bold text-blue-600">{followCounts.followers}</div>
                              <div className="text-xs text-muted-foreground mt-1">Followers</div>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-indigo-50 border border-indigo-200">
                              <div className="text-2xl font-bold text-indigo-600">{followCounts.following}</div>
                              <div className="text-xs text-muted-foreground mt-1">Following</div>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-purple-50 border border-purple-200">
                              <div className="text-2xl font-bold text-purple-600">{userActivity.likedComments.length}</div>
                              <div className="text-xs text-muted-foreground mt-1">Likes Given</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="text-center p-3 rounded-lg bg-green-50 border border-green-200">
                              <div className="text-2xl font-bold text-green-600">{userActivity.votedIssues.filter(v => v.vote === 1).length}</div>
                              <div className="text-xs text-muted-foreground mt-1">Upvotes</div>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-red-50 border border-red-200">
                              <div className="text-2xl font-bold text-red-600">{userActivity.votedIssues.filter(v => v.vote === -1).length}</div>
                              <div className="text-xs text-muted-foreground mt-1">Downvotes</div>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-sky-50 border border-sky-200">
                              <div className="text-2xl font-bold text-sky-600">{userActivity.comments.length}</div>
                              <div className="text-xs text-muted-foreground mt-1">Comments</div>
                            </div>
                          </div>
                        </Card>
                        
                        {/* Activity Feed - Only show if there's activity */}
                        {(userActivity.comments.length > 0 || userActivity.votedIssues.length > 0 || owned.length > 0) ? (
                        <Card className="rounded-2xl border border-white/60 bg-white/50 backdrop-blur-2xl shadow-lg shadow-orange-100/20">
                          <CardHeader>
                            <CardTitle className="text-lg">Activity Feed</CardTitle>
                            <p className="text-xs text-muted-foreground">Recent updates on your issues and interactions</p>
                          </CardHeader>
                          <CardContent className="p-0">
                            <div className="divide-y divide-stone-200/60">
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
                                      timestamp: new Date(issue.createdAt || Date.now()),
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
                                      timestamp: new Date(issue.createdAt || Date.now()),
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
                        ) : (
                          <Card className="rounded-2xl border border-white/60 bg-white/50 backdrop-blur-2xl shadow-lg shadow-orange-100/20 p-10 text-center">
                            <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
                            <p className="text-muted-foreground">No recent activity to show</p>
                          </Card>
                        )}
                      </div>
                    ) : (
                      <Card className="rounded-2xl border border-white/60 bg-white/50 backdrop-blur-2xl shadow-lg shadow-orange-100/20 p-10 text-center">
                        <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
                        <p className="text-muted-foreground">No activity data available</p>
                      </Card>
                    )}
                  </div>
                </TabsContent>
              )}
              
              {/* Settings Tab (Owner Only) */}
              {isOwner && (
                <TabsContent value="settings" className="mt-6">
                  <div className="max-w-2xl space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold tracking-tight mb-2">Quick Actions</h2>
                      <p className="text-sm text-muted-foreground mb-4">Manage your profile and issues</p>
                      <div className="flex flex-wrap gap-3">
                        <Link to="/raise-issue">
                          <Button className="rounded-full bg-gradient-to-r from-orange-500 to-amber-500">
                            <Plus className="h-4 w-4 mr-2" />
                            Create New Issue
                          </Button>
                        </Link>
                        <Link to="/issues">
                          <Button variant="outline" className="rounded-full">
                            Browse All Issues
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          className="rounded-full"
                          onClick={() => navigate(`/profile/${uid}/edit`)}
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Button>
                      </div>
                    </div>
                    
                    <Card className="rounded-2xl border border-white/60 bg-white/50 backdrop-blur-2xl shadow-lg shadow-orange-100/20 p-6">
                      <h3 className="font-semibold text-lg mb-2">Profile Overview</h3>
                      <div className="space-y-2 text-sm">
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
                    
                    <Card className="rounded-2xl border border-red-300/60 bg-red-50/50 backdrop-blur-2xl shadow-lg shadow-red-100/20 p-6">
                      <h3 className="font-semibold text-lg mb-2 text-red-900">Account Actions</h3>
                      <p className="text-sm text-red-700 mb-4">Manage your account settings</p>
                      <Button 
                        variant="destructive" 
                        className="rounded-full"
                        onClick={handleSignOut}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </Card>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </main>
        
        {/* Dialogs */}
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
            />
            <IssueAnalyticsDialog
              open={analyticsDialogOpen}
              onOpenChange={setAnalyticsDialogOpen}
              issue={selectedIssue}
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
      </ParticlesBackground>
    </div>
  );
}

