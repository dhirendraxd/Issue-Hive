import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { useIssuesFirebase } from '@/hooks/use-issues-firebase';
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

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { data: issues, isLoading: issuesLoading, stats, setVisibility, resolveIssue, addProgress } = useIssuesFirebase();
  const { data: userActivity, isLoading: isActivityLoading } = useUserActivity();
  const navigate = useNavigate();
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

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

  const list: Issue[] = (issues as Issue[]) || [];
  // Ownership must be determined by createdBy (auth UID) to satisfy Firestore rules
  const userIssues = list.filter(issue => issue.createdBy === user.uid);
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
      {/* Background */}
      <ParticlesBackground>
        <div />
      </ParticlesBackground>
      
      <div className="absolute inset-0 opacity-20 pointer-events-none" aria-hidden>
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-orange-500/30 to-amber-500/20 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/40 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2 font-semibold text-xl tracking-tight">
              <img src="/beehive-honey-svgrepo-com.svg" alt="IssueHive" className="h-8 w-8" />
              <span>Issue<span className="text-orange-500">Hive</span></span>
            </Link>

            <div className="flex items-center gap-4">
              <Link to="/issues">
                <Button variant="outline" size="sm" className="hidden sm:flex">
                  Browse All Issues
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Welcome back, {user.displayName || user.email?.split('@')[0]}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your issues and track community reports
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-white/40 bg-white/80 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Issues
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Community-wide</p>
            </CardContent>
          </Card>

          <Card className="border-white/40 bg-white/80 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Open Issues
              </CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{stats?.open || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Needs attention</p>
            </CardContent>
          </Card>

          <Card className="border-white/40 bg-white/80 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Supports
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats?.votes || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Community engagement</p>
            </CardContent>
          </Card>

          <Card className="border-white/40 bg-white/80 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                Your Issues
                {(privateCount > 0 || draftCount > 0) && (
                  <span className="text-[10px] font-normal text-muted-foreground">{privateCount} private · {draftCount} draft</span>
                )}
              </CardTitle>
              <User className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{userIssues.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Issues you reported</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Your Recent Issues */}
          <div className="lg:col-span-2">
            <Card className="border-white/40 bg-white/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle>Your Recent Issues</CardTitle>
                <CardDescription>
                  Issues you've reported to the community
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                      <div key={issue.id} className="flex flex-col gap-2 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-1 ${statusColors[issue.status]}`} />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate flex items-center gap-2">
                              {issue.title}
                              {issue.visibility && issue.visibility !== 'public' && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 uppercase tracking-wide">{issue.visibility}</span>
                              )}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {issue.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {issue.category}
                              </Badge>
                              <Badge 
                                variant={issue.status === 'resolved' ? 'default' : 'secondary'}
                                className="text-xs capitalize"
                              >
                                {issue.status.replace('_', ' ')}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {issue.votes} {issue.votes === 1 ? 'support' : 'supports'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <label htmlFor={`vis-${issue.id}`} className="text-[11px] uppercase tracking-wide text-muted-foreground">Visibility</label>
                          <select
                            id={`vis-${issue.id}`}
                            defaultValue={issue.visibility || 'public'}
                            onChange={(e) => {
                              const value = e.target.value as IssueVisibility;
                              setVisibility.mutate({ id: issue.id, visibility: value });
                            }}
                            className="border rounded px-2 py-1 text-xs bg-white"
                          >
                            {ISSUE_VISIBILITIES.map(v => (
                              <option key={v.value} value={v.value}>{v.label}</option>
                            ))}
                          </select>
                          <div className="ml-auto flex items-center gap-2">
                            {issue.status !== 'resolved' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenProgressDialog(issue)}
                                  className="text-xs h-7"
                                >
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  Add Progress
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenResolveDialog(issue)}
                                  className="text-xs h-7"
                                >
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Mark Resolved
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* User Profile Sidebar */}
          <div className="space-y-6">
            <Card className="border-white/40 bg-white/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-lg">Your Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="h-16 w-16 rounded-full border-2 border-orange-500"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white text-xl font-semibold">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
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
                    <span>Joined {new Date(user.metadata.creationTime || '').toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/40 bg-white/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
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
            <Card className="border-stone-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
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
