import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useIssuesFirebase } from '@/hooks/use-issues-firebase';
import { useAuth } from '@/hooks/use-auth';
import { useUserActivity } from '@/hooks/use-user-activity';
import { useActivityTracker } from '@/hooks/use-activity-tracker';
import { useQueryClient } from '@tanstack/react-query';
import type { Issue } from '@/types/issue';
import { signOut } from '@/integrations/firebase';
import Navbar from '@/components/Navbar';
import ProfilePictureEditor from '@/components/ProfilePictureEditor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Edit2, Check, X, Loader2, MapPin, Globe, Github, Twitter, Linkedin, Instagram, ThumbsUp, ThumbsDown, MessageSquare, TrendingUp, Calendar, Link2, Settings, LogOut, Plus, Clock, AlertCircle, Activity as ActivityIcon, Eye, MoreVertical } from 'lucide-react';
import ResolveIssueDialog from '@/components/ResolveIssueDialog';
import AddProgressDialog from '@/components/AddProgressDialog';
import IssueDetailDialog from '@/components/IssueDetailDialog';
import IssueAnalyticsDialog from '@/components/IssueAnalyticsDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatRelativeTime } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { isFirebaseConfigured } from '@/integrations/firebase/config';
import { Separator } from '@/components/ui/separator';
import { useIssueEngagement } from '@/hooks/use-issue-engagement';
import { ISSUE_STATUSES } from '@/types/issue';
import { updateUserDisplayName } from '@/integrations/firebase/profile';
import ProfileVisibilitySettings from '@/components/ProfileVisibilitySettings';
import { useIsFollowing, useFollowUser, useUnfollowUser, useFollowCounts } from '@/hooks/use-follow';
import { useUserProfile } from '@/hooks/use-user-profile';
import { toast } from 'sonner';
import ParticlesBackground from '@/components/ParticlesBackground';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getUserAvatarUrl } from '@/lib/avatar';

export default function UserProfile() {
  const { uid } = useParams();
  const [search] = useSearchParams();
  const { user } = useAuth();
  const { data: issues, isLoading, stats, setVisibility, resolveIssue, addProgress } = useIssuesFirebase();
  const { data: userActivity, isLoading: isActivityLoading } = useUserActivity();
  const activityTracker = useActivityTracker();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [editingName, setEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(user?.displayName || '');
  const [savingName, setSavingName] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false);

  // Filter issues belonging to this user
  const owned = (issues || []).filter(i => i.createdBy === uid);
  const previewVisitor = search.get('previewVisitor') === '1' || search.get('as') === 'visitor';
  const rawIsOwner = user?.uid === uid;
  const isOwner = previewVisitor ? false : rawIsOwner;
  const { data: isFollowing = false } = useIsFollowing(!isOwner ? uid : undefined);
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();
  const { data: ownerProfile } = useUserProfile(uid);
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

  const handleSaveDisplayName = async () => {
    if (!user || !newDisplayName.trim()) return;

    setSavingName(true);
    try {
      await updateUserDisplayName(user, newDisplayName.trim());
      toast.success('Display name updated!');
      setEditingName(false);
      // Reload to reflect changes
      setTimeout(() => window.location.reload(), 500);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update display name';
      toast.error(message);
    } finally {
      setSavingName(false);
    }
  };

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
      setVisibility.mutate({ id: issueId, visibility: newVisibility as 'public' | 'private' | 'draft' });
      toast.success(`Issue visibility updated to ${newVisibility}`);
    } catch (error) {
      toast.error('Failed to update visibility');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <ParticlesBackground fullPage hexOpacity={0.10}>
        <Navbar />
        <main className="scroll-mt-20 pt-10 pb-24 px-4 mx-auto max-w-5xl">
          {/* Unified Twitter/X Style Profile for everyone */}
          <div className="max-w-4xl mx-auto">
            {/* Cover Image */}
            <div className="relative -mt-10">
              <div className="h-48 md:h-64 w-full rounded-2xl overflow-hidden border border-white/40 bg-gradient-to-br from-orange-100 via-amber-50 to-orange-50">
                {ownerProfile?.coverUrl ? (
                  <img src={ownerProfile.coverUrl} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-400/20 via-amber-400/10 to-orange-300/20" />
                )}
              </div>
              
              {/* Profile Picture Overlay */}
              <div className="absolute -bottom-16 left-6">
                <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
                  <AvatarImage src={getUserAvatarUrl(uid!, ownerProfile?.photoURL)} />
                  <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-orange-500 to-amber-500 text-white">
                    {ownerProfile?.displayName?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              {/* Action Buttons */}
              <div className="absolute top-4 right-4 flex gap-2">
                {isOwner ? (
                  <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
                    <SheetTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full bg-white/90 backdrop-blur hover:bg-white border-stone-300"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle>Edit Profile</SheetTitle>
                        <SheetDescription>
                          Manage your profile, privacy settings, and visibility preferences
                        </SheetDescription>
                      </SheetHeader>
                      
                      <div className="mt-6 space-y-6">
                        {/* Display Name Editor */}
                        <Card className="rounded-2xl border border-stone-200 p-6">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold text-lg">Display Name</h3>
                                <p className="text-sm text-muted-foreground">This is how others will see you</p>
                              </div>
                              {!editingName && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingName(true);
                                    setNewDisplayName(user?.displayName || '');
                                  }}
                                  className="rounded-full"
                                >
                                  <Edit2 className="w-4 h-4 mr-2" />
                                  Edit
                                </Button>
                              )}
                            </div>

                            {editingName ? (
                              <div className="flex gap-2">
                                <Input
                                  value={newDisplayName}
                                  onChange={(e) => setNewDisplayName(e.target.value)}
                                  placeholder="Enter your display name"
                                  disabled={savingName}
                                  className="flex-1"
                                />
                                <Button
                                  onClick={handleSaveDisplayName}
                                  disabled={savingName || !newDisplayName.trim()}
                                  size="sm"
                                  className="rounded-full bg-gradient-to-r from-orange-500 to-amber-500"
                                >
                                  {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                </Button>
                                <Button
                                  onClick={() => setEditingName(false)}
                                  disabled={savingName}
                                  size="sm"
                                  variant="outline"
                                  className="rounded-full"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <p className="text-lg font-medium">{user?.displayName || 'Not set'}</p>
                            )}
                          </div>
                        </Card>

                        {/* Profile Picture Editor */}
                        <ProfilePictureEditor />

                        {/* Visibility & Privacy Settings */}
                        <ProfileVisibilitySettings />
                      </div>
                    </SheetContent>
                  </Sheet>
                ) : (
                  user && (
                    isFollowing ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="rounded-full bg-white/90 backdrop-blur hover:bg-white"
                        disabled={unfollowMutation.isPending}
                        onClick={() => unfollowMutation.mutate(uid!)}
                      >
                        {unfollowMutation.isPending ? 'Unfollowing...' : 'Following'}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="rounded-full bg-stone-900 text-white hover:bg-stone-800"
                        disabled={followMutation.isPending}
                        onClick={() => followMutation.mutate(uid!)}
                      >
                        {followMutation.isPending ? 'Following...' : 'Follow'}
                      </Button>
                    )
                  )
                )}
              </div>
            </div>
            
            {/* Profile Info Section */}
            <div className="mt-20 px-6 pb-4 border-b border-stone-200/60">
              <div className="mb-3">
                <h1 className="text-2xl font-bold tracking-tight">{ownerProfile?.displayName || 'User'}</h1>
                <p className="text-sm text-muted-foreground">@{ownerProfile?.displayName?.toLowerCase().replace(/\s+/g, '') || 'user'}</p>
              </div>
              
              {ownerProfile?.bio && (
                <p className="text-sm text-stone-900 mb-3 leading-relaxed">{ownerProfile.bio}</p>
              )}
              
              {/* Meta Info */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                {ownerProfile?.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" /> {ownerProfile.location}
                  </span>
                )}
                {ownerProfile?.social?.website && (
                  <a 
                    href={ownerProfile.social.website} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-1.5 hover:text-orange-600 transition-colors"
                  >
                    <Link2 className="h-4 w-4" /> 
                    {ownerProfile.social.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                  </a>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" /> Joined April 2025
                </span>
              </div>
              
              {/* Social Links */}
              {ownerProfile?.social && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {ownerProfile.social.github && (
                    <a 
                      href={ownerProfile.social.github} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-muted-foreground hover:text-stone-900 transition-colors"
                      title="GitHub"
                    >
                      <Github className="h-5 w-5" />
                    </a>
                  )}
                  {ownerProfile.social.twitter && (
                    <a 
                      href={ownerProfile.social.twitter} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-muted-foreground hover:text-stone-900 transition-colors"
                      title="Twitter"
                    >
                      <Twitter className="h-5 w-5" />
                    </a>
                  )}
                  {ownerProfile.social.linkedin && (
                    <a 
                      href={ownerProfile.social.linkedin} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-muted-foreground hover:text-stone-900 transition-colors"
                      title="LinkedIn"
                    >
                      <Linkedin className="h-5 w-5" />
                    </a>
                  )}
                  {ownerProfile.social.instagram && (
                    <a 
                      href={ownerProfile.social.instagram} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-muted-foreground hover:text-stone-900 transition-colors"
                      title="Instagram"
                    >
                      <Instagram className="h-5 w-5" />
                    </a>
                  )}
                </div>
              )}
              
              {/* Follower Counts */}
              <div className="flex gap-4 text-sm">
                <button className="hover:underline">
                  <span className="font-semibold text-stone-900">{followCounts.following}</span>
                  <span className="text-muted-foreground ml-1">Following</span>
                </button>
                <button className="hover:underline">
                  <span className="font-semibold text-stone-900">{followCounts.followers}</span>
                  <span className="text-muted-foreground ml-1">Followers</span>
                </button>
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
                <TabsTrigger 
                  value="analytics" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-transparent px-6 py-4"
                >
                  Analytics
                </TabsTrigger>
                {isOwner && (
                  <>
                    <TabsTrigger 
                      value="activity" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-transparent px-6 py-4"
                    >
                      <ActivityIcon className="h-4 w-4 mr-2" />
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
                {isOwner && (
                  <div className="mb-4 flex flex-wrap gap-3 text-xs text-muted-foreground bg-white/60 backdrop-blur-lg border border-white/40 rounded-full px-4 py-2 w-fit">
                    <span><strong>{owned.length}</strong> total</span>
                    <span><strong>{publicIssues.length}</strong> public</span>
                    <span><strong>{privateCount}</strong> private</span>
                    <span><strong>{draftCount}</strong> draft</span>
                  </div>
                )}

                {isLoading && (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-40 rounded-2xl" />
                    ))}
                  </div>
                )}

                {!isLoading && (isOwner ? owned.length === 0 : publicIssues.length === 0 && followerPrivateIssues.length === 0) && (
                  <Card className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg p-10 text-center">
                    <p className="text-muted-foreground">
                      {isOwner ? 'No issues yet. Create your first issue to get started!' : 'No public issues yet.'}
                    </p>
                    {isOwner && (
                      <Link to="/raise-issue">
                        <Button className="mt-4 rounded-full bg-gradient-to-r from-orange-500 to-amber-500">
                          Create Your First Issue
                        </Button>
                      </Link>
                    )}
                  </Card>
                )}

                {!isLoading && (isOwner ? owned.length > 0 : (publicIssues.length > 0 || followerPrivateIssues.length > 0)) && (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {(isOwner ? owned : [...publicIssues, ...followerPrivateIssues]).map(issue => {
                      const vis = (issue as unknown as WithVisibility).visibility;
                      const engagement = engagementMap[issue.id] || { upvotes: 0, downvotes: 0, comments: 0, commentLikes: 0 };
                      return (
                        <Card key={issue.id} className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg flex flex-col hover:shadow-lg hover:shadow-orange-400/20 hover:border-orange-200/40 transition-all">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="text-base font-semibold leading-snug line-clamp-2">{issue.title}</CardTitle>
                              <div className="flex items-center gap-2">
                                {vis && vis !== 'public' && (
                                  <Badge variant="outline" className="text-xs capitalize shrink-0">{vis}</Badge>
                                )}
                                {isOwner && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleViewDetails(issue)}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Details
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleViewAnalytics(issue)}>
                                        <TrendingUp className="mr-2 h-4 w-4" />
                                        Analytics
                                      </DropdownMenuItem>
                                      {issue.status !== 'resolved' && (
                                        <DropdownMenuItem onClick={() => handleResolve(issue)}>
                                          <Check className="mr-2 h-4 w-4" />
                                          Mark Resolved
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem onClick={() => handleAddProgress(issue)}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Progress
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => handleVisibilityChange(issue.id, 'public')}>
                                        Set Public
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleVisibilityChange(issue.id, 'private')}>
                                        Set Private
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleVisibilityChange(issue.id, 'draft')}>
                                        Set Draft
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="flex flex-col gap-3 text-sm flex-1">
                            <p className="text-muted-foreground line-clamp-3">{issue.description}</p>
                            <div className="flex flex-wrap gap-2 mt-auto">
                              <Badge variant="outline" className="text-xs">{issue.category}</Badge>
                              <Badge variant={issue.status === 'resolved' ? 'default' : 'secondary'} className="text-xs capitalize">{issue.status.replace('_',' ')}</Badge>
                              <span className="text-xs text-muted-foreground">{issue.votes} {issue.votes === 1 ? 'support' : 'supports'}</span>
                            </div>
                            {/* Engagement Metrics */}
                            <div className="flex gap-3 text-xs text-muted-foreground pt-2 border-t border-stone-200/60">
                              <span className="flex items-center gap-1">
                                <ThumbsUp className="h-3 w-3" /> {engagement.upvotes}
                              </span>
                              {!ownerProfile?.hideDislikeCounts && (
                                <span className="flex items-center gap-1">
                                  <ThumbsDown className="h-3 w-3" /> {engagement.downvotes}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
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
              
              {/* Analytics Tab */}
              <TabsContent value="analytics" className="mt-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <Card className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg p-6">
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
                  
                  <Card className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg p-6">
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
                    <Card className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg p-6">
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
                  
                  <Card className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg p-6">
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
                  
                  <Card className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg p-6">
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
                  
                  <Card className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg p-6">
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
              </TabsContent>
              
              {/* Activity Tab (Owner Only) */}
              {isOwner && (
                <TabsContent value="activity" className="mt-6">
                  <div className="max-w-2xl space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold tracking-tight mb-2">Recent Activity</h2>
                      <p className="text-sm text-muted-foreground mb-4">Your latest interactions and updates</p>
                    </div>
                    
                    {isActivityLoading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Skeleton key={i} className="h-16 rounded-xl" />
                        ))}
                      </div>
                    ) : userActivity && (userActivity.comments.length > 0 || userActivity.votedIssues.length > 0 || userActivity.likedComments.length > 0) ? (
                      <div className="space-y-4">
                        <Card className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg p-6">
                          <h3 className="font-semibold text-lg mb-4">Activity Summary</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-3 rounded-lg bg-green-50 border border-green-200">
                              <div className="text-2xl font-bold text-green-600">{userActivity.votedIssues.filter(v => v.vote === 1).length}</div>
                              <div className="text-xs text-muted-foreground mt-1">Upvotes</div>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-red-50 border border-red-200">
                              <div className="text-2xl font-bold text-red-600">{userActivity.votedIssues.filter(v => v.vote === -1).length}</div>
                              <div className="text-xs text-muted-foreground mt-1">Downvotes</div>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-200">
                              <div className="text-2xl font-bold text-blue-600">{userActivity.comments.length}</div>
                              <div className="text-xs text-muted-foreground mt-1">Comments</div>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-purple-50 border border-purple-200">
                              <div className="text-2xl font-bold text-purple-600">{userActivity.likedComments.length}</div>
                              <div className="text-xs text-muted-foreground mt-1">Likes Given</div>
                            </div>
                          </div>
                        </Card>
                        
                        {userActivity.comments.length > 0 && (
                          <Card className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg">
                            <CardHeader>
                              <CardTitle className="text-lg">Recent Comments</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                              <div className="divide-y divide-stone-200/60">
                                {userActivity.comments.slice(0, 5).map((comment, idx) => (
                                  <div key={idx} className="p-4 hover:bg-white/40 transition-colors">
                                    <p className="text-sm text-stone-900 line-clamp-2">{comment.content || ''}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {formatRelativeTime(comment.createdAt?.toDate?.() || new Date())}
                                      {comment.likes ? ` • ${comment.likes} likes` : ''}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    ) : (
                      <Card className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg p-10 text-center">
                        <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
                        <p className="text-muted-foreground">No recent activity</p>
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
                          onClick={() => setEditSheetOpen(true)}
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Button>
                      </div>
                    </div>
                    
                    <Card className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg p-6">
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
                    
                    <Card className="rounded-2xl border border-red-200 bg-red-50/60 p-6">
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
            />
            <IssueAnalyticsDialog
              open={analyticsDialogOpen}
              onOpenChange={setAnalyticsDialogOpen}
              issue={selectedIssue}
            />
          </>
        )}
      </ParticlesBackground>
    </div>
  );
}

