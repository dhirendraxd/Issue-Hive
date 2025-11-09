import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { useIssuesFirebase } from '@/hooks/use-issues-firebase';
import { useIssueEngagement } from '@/hooks/use-issue-engagement';
import { useUserActivity } from '@/hooks/use-user-activity';
import { ISSUE_VISIBILITIES, IssueVisibility } from '@/types/issue';
import type { Issue } from '@/types/issue';
import { signOut } from '@/integrations/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import ResolveIssueDialog from '@/components/ResolveIssueDialog';
import AddProgressDialog from '@/components/AddProgressDialog';
import { 
  LogOut, 
  Plus,
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  User,
  Mail,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Activity
} from 'lucide-react';
import ParticlesBackground from '@/components/ParticlesBackground';
import Navbar from '@/components/Navbar';
import { formatRelativeTime } from '@/lib/utils';
import { getUserAvatarUrl } from '@/lib/avatar';
import { isFirebaseConfigured } from '@/integrations/firebase/config';
import { Alert, AlertDescription } from '@/components/ui/alert';
import IssueCard from '@/components/IssueCard';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { data: issues, isLoading: issuesLoading, stats, setVisibility, resolveIssue, addProgress } = useIssuesFirebase();
  const { data: userActivity, isLoading: isActivityLoading } = useUserActivity();
  const navigate = useNavigate();
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  // Prepare engagement metrics early to satisfy hook ordering rules
  const list: Issue[] = (issues as Issue[]) || [];
  const userIssues = user ? list.filter(issue => issue.createdBy === user.uid) : [];
  const recentIssueIds = userIssues.slice(0, 5).map(i => i.id);
  const { data: engagement } = useIssueEngagement(recentIssueIds);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Ownership must be determined by createdBy (auth UID) to satisfy Firestore rules
  const privateCount = userIssues.filter(i => i.visibility === 'private').length;
  const draftCount = userIssues.filter(i => i.visibility === 'draft').length;

  const statusColors = {
    received: 'bg-blue-500',
    in_progress: 'bg-yellow-500',
    resolved: 'bg-green-500',
  };

  const handleOpenResolveDialog = (issue: Issue) => {
    setSelectedIssue(issue);
    setResolveDialogOpen(true);
  };

  const handleOpenProgressDialog = (issue: Issue) => {
    setSelectedIssue(issue);
    setProgressDialogOpen(true);
  };

  const handleResolve = async ({ message, photos }: { message: string; photos?: string[] }) => {
    if (!selectedIssue) return;
    
    try {
      await resolveIssue.mutateAsync({
        id: selectedIssue.id,
        message,
        photos,
      });
      toast.success('Issue marked as resolved!');
      setResolveDialogOpen(false);
      setSelectedIssue(null);
    } catch (error) {
      toast.error('Failed to resolve issue');
      console.error('Resolve error:', error);
    }
  };

  const handleAddProgress = async ({ message, photos }: { message: string; photos?: string[] }) => {
    if (!selectedIssue) return;
    
    try {
      await addProgress.mutateAsync({
        id: selectedIssue.id,
        message,
        photos,
      });
      toast.success('Progress update added!');
      setProgressDialogOpen(false);
      setSelectedIssue(null);
    } catch (error) {
      const msg = (error as Error)?.message || 'Failed to add progress update';
      toast.error(msg);
      console.error('Progress error:', error);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-stone-50">
      <Navbar />
      {/* Background */}
      <ParticlesBackground fullPage hexOpacity={0.10}>
        <div />
      </ParticlesBackground>
      <div className="absolute inset-0 opacity-25 pointer-events-none" aria-hidden>
        {/* Simplified brand-focused decorative blobs */}
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-orange-500/35 to-amber-500/25 blur-3xl" />
        <div className="absolute bottom-24 left-1/3 w-72 h-72 rounded-full bg-gradient-to-br from-orange-400/30 to-amber-400/20 blur-2xl" />
      </div>
      {/* Main Content */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-semibold tracking-tight">
            Welcome back, {user.displayName || user.email?.split('@')[0]}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your issues and track community reports
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card hover:shadow-lg hover:shadow-orange-400/15 hover:border-orange-200/30 transition-all duration-300 border-l-4 border-l-blue-400">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-display font-medium text-muted-foreground">
                Total Issues
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-display font-bold text-blue-600">{stats?.total || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Community-wide</p>
            </CardContent>
          </Card>

          <Card className="glass-card hover:shadow-lg hover:shadow-orange-400/15 hover:border-orange-200/30 transition-all duration-300 border-l-4 border-l-orange-400">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-display font-medium text-muted-foreground">
                Open Issues
              </CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-display font-bold text-orange-500">{stats?.open || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Needs attention</p>
            </CardContent>
          </Card>

          <Card className="glass-card hover:shadow-lg hover:shadow-orange-400/15 hover:border-orange-200/30 transition-all duration-300 border-l-4 border-l-green-400">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-display font-medium text-muted-foreground">
                Total Supports
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-display font-bold text-green-600">{stats?.votes || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Community engagement</p>
            </CardContent>
          </Card>

          <Card className="glass-card hover:shadow-lg hover:shadow-orange-400/15 hover:border-orange-200/30 transition-all duration-300 border-l-4 border-l-purple-400">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-display font-medium text-muted-foreground flex items-center gap-2">
                Your Issues
                {(privateCount > 0 || draftCount > 0) && (
                  <span className="text-[10px] font-normal text-muted-foreground">{privateCount} private · {draftCount} draft</span>
                )}
              </CardTitle>
              <User className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-display font-bold text-purple-600">{userIssues.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Issues you reported</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Your Recent Issues */}
          <div className="lg:col-span-2">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-display">Your Recent Issues</CardTitle>
                <CardDescription>
                  Issues you've reported to the community
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!isFirebaseConfigured && (
                  <div className="mb-3">
                    <Alert className="border-amber-200 bg-amber-50/60">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertDescription>
                        Engagement metrics (comments and likes) are hidden because Firebase isn't configured.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
                {userIssues.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <AlertCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">You haven't reported any issues yet</p>
                    <p className="text-sm mt-2">Click "Raise Issue" in the navigation to get started</p>
                    <Link to="/raise-issue" className="mt-4 inline-block">
                      <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
                        <Plus className="h-4 w-4 mr-2" />
                        Raise Your First Issue
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userIssues.slice(0, 5).map((issue) => (
                      <IssueCard
                        key={issue.id}
                        issue={issue}
                        engagement={engagement?.[issue.id]}
                        onSetVisibility={(id, visibility) => setVisibility.mutate({ id, visibility })}
                        onAddProgress={handleOpenProgressDialog}
                        onResolve={handleOpenResolveDialog}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* User Profile Sidebar */}
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg font-display">Your Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <img
                    src={user.photoURL || getUserAvatarUrl(user.uid)}
                    alt={user.displayName || 'User'}
                    className="h-16 w-16 rounded-full border-2 border-orange-500 object-cover bg-white"
                    onError={(e) => {
                      // Fallback to a different avatar style if primary fails
                      const img = e.target as HTMLImageElement;
                      if (!img.src.includes('backup')) {
                        img.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}&backup=true`;
                      }
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">
                      {user.displayName || 'IssueHive User'}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      Member
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span title={new Date(user.metadata.creationTime || '').toLocaleString()}>
                      Joined {formatRelativeTime(new Date(user.metadata.creationTime || ''))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg font-display">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/raise-issue" className="block">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Raise New Issue
                  </Button>
                </Link>
                <Link to="/issues" className="block">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Browse All Issues
                  </Button>
                </Link>
                <Link to="/about" className="block">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    About IssueHive
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* User Activity Card */}
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-display flex items-center gap-2">
                  <Activity className="h-4 w-4 text-orange-600" />
                  Your Activity
                </CardTitle>
                <CardDescription className="text-xs">
                  Your engagement across the platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isActivityLoading ? (
                  <div className="text-sm text-stone-500">Loading activity...</div>
                ) : !userActivity ? (
                  <div className="text-sm text-stone-500">No activity data.</div>
                ) : (
                  <>
                    {/* Activity Stats */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-stone-600">
                          <ThumbsUp className="h-4 w-4" />
                          <span>Upvotes Given</span>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {userActivity.votedIssues.filter(v => v.vote === 1).length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-stone-600">
                          <ThumbsDown className="h-4 w-4" />
                          <span>Downvotes Given</span>
                        </div>
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          {userActivity.votedIssues.filter(v => v.vote === -1).length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-stone-600">
                          <MessageSquare className="h-4 w-4" />
                          <span>Comments Made</span>
                        </div>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {userActivity.comments.length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-stone-600">
                          <MessageSquare className="h-4 w-4" />
                          <span>Replies Made</span>
                        </div>
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          {userActivity.comments.filter(c => 'parentId' in c && c.parentId).length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-stone-600">
                          <ThumbsUp className="h-4 w-4" />
                          <span>Comments Liked</span>
                        </div>
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          {userActivity.likedComments.length}
                        </Badge>
                      </div>
                    </div>

                    <Separator />

                    {/* Recent Voted Issues */}
                    {userActivity.votedIssues.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-stone-700">Recently Voted</h4>
                        <div className="space-y-1.5">
                          {userActivity.votedIssues.slice(0, 3).map((vote) => (
                            <Link 
                              key={vote.issueId} 
                              to="/issues"
                              className="block p-2 rounded-md hover:bg-stone-50 transition-colors"
                            >
                              <div className="flex items-start gap-2">
                                {vote.vote === 1 ? (
                                  <ThumbsUp className="h-3.5 w-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                                ) : (
                                  <ThumbsDown className="h-3.5 w-3.5 text-red-600 mt-0.5 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-stone-900 truncate">
                                    {vote.issue?.title || 'Unknown Issue'}
                                  </p>
                                  <p className="text-xs text-stone-500">
                                    {vote.vote === 1 ? 'Upvoted' : 'Downvoted'}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recent Comments */}
                    {userActivity.comments.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-stone-700">Recent Comments</h4>
                        <div className="space-y-1.5">
                          {userActivity.comments.slice(0, 3).map((comment) => (
                            <Link 
                              key={comment.id} 
                              to="/issues"
                              className="block p-2 rounded-md hover:bg-stone-50 transition-colors"
                            >
                              <div className="flex items-start gap-2">
                                <MessageSquare className="h-3.5 w-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-stone-600 line-clamp-2">
                                    {comment.content}
                                  </p>
                                  <p className="text-xs text-stone-500 mt-0.5">
                                    on "{comment.issue?.title || 'Unknown Issue'}"
                                  </p>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No Activity Message */}
                    {userActivity.votedIssues.length === 0 && 
                     userActivity.comments.length === 0 && 
                     userActivity.likedComments.length === 0 && (
                      <div className="text-center py-4">
                        <Activity className="h-8 w-8 text-stone-300 mx-auto mb-2" />
                        <p className="text-sm text-stone-500">No activity yet</p>
                        <p className="text-xs text-stone-400 mt-1">
                          Start engaging with issues!
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Resolution Dialog */}
      <ResolveIssueDialog
        open={resolveDialogOpen}
        onOpenChange={setResolveDialogOpen}
        issueTitle={selectedIssue?.title || ''}
        onResolve={handleResolve}
        isResolving={resolveIssue.isPending}
      />

      {/* Progress Dialog */}
      <AddProgressDialog
        open={progressDialogOpen}
        onOpenChange={setProgressDialogOpen}
        issueTitle={selectedIssue?.title || ''}
        onAddProgress={handleAddProgress}
        isAdding={addProgress.isPending}
      />
    </div>
  );
}
