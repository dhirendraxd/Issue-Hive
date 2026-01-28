import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useIssuesFirebase } from '@/hooks/use-issues-firebase';
import { useIssueEngagement } from '@/hooks/use-issue-engagement';
import { useUserActivity } from '@/hooks/use-user-activity';
import { useActivityTracker } from '@/hooks/use-activity-tracker';
import { useQueryClient } from '@tanstack/react-query';
import type { Issue } from '@/types/issue';
import { signOut } from '@/integrations/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { formatRelativeTime } from '@/lib/utils';
import ResolveIssueDialog from '@/components/ResolveIssueDialog';
import AddProgressDialog from '@/components/AddProgressDialog';
import ProfilePictureEditor from '@/components/ProfilePictureEditor';
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
  Activity,
  Edit2,
  Github,
  Twitter,
  Linkedin,
  Instagram,
  Globe
} from 'lucide-react';
import ParticlesBackground from '@/components/ParticlesBackground';
import Navbar from '@/components/Navbar';
import { useAvatarUrl } from '@/hooks/use-avatar-url';
import { isFirebaseConfigured } from '@/integrations/firebase/config';
import { Alert, AlertDescription } from '@/components/ui/alert';
import IssueCard from '@/components/IssueCard';
import Seo from "@/components/Seo";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { data: userProfile } = useUserProfile(user?.uid || '');
  const { data: issuesRaw, stats, setVisibility, setStatus, resolveIssue, addProgress } = useIssuesFirebase();
  const avatarUrl = useAvatarUrl(user?.photoURL, user?.uid || '');
  const { data: userActivity, isLoading: isActivityLoading } = useUserActivity();
  const activityTracker = useActivityTracker();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const issues = issuesRaw || [];
  
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  // Prepare engagement metrics early to satisfy hook ordering rules
  const list: Issue[] = (issues as Issue[]) || [];
  const userIssues = user ? list.filter(issue => issue.createdBy === user.uid) : [];
  const recentIssueIds = userIssues.slice(0, 5).map(i => i.id);
  const { data: engagement } = useIssueEngagement(recentIssueIds);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (!authLoading && user) {
      // Redirect to unified profile page
      navigate(`/u/${user.uid}`);
    }
  }, [user, authLoading, navigate]);

  const handleSignOut = async () => {
    const confirmed = window.confirm('Are you sure you want to sign out?');
    if (!confirmed) return;

    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/');
    } catch {
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
  const publishedIssues = userIssues.filter(i => i.visibility === 'public');
  const draftPrivateIssues = userIssues.filter(i => i.visibility === 'draft' || i.visibility === 'private');

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
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-stone-50 animate-in fade-in duration-300">
      <Seo
        title="Dashboard"
        description="Manage your IssueHive profile, track reported campus problems, and follow resolution updates."
        path="/dashboard"
        noIndex
        keywords={["dashboard", "profile", "my issues"]}
      />
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
        {/* Welcome & Profile Section */}
        <div className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start md:items-center">
            {/* Welcome Text */}
            <div className="md:col-span-2">
              <h1 className="text-4xl font-display font-bold tracking-tight mb-2">
                Welcome back, {user.displayName || user.email?.split('@')[0]}!
              </h1>
              <p className="text-lg text-muted-foreground">
                Manage your issues and track community reports
              </p>
            </div>
            {/* Edit Profile Button */}
            <Link to={`/profile/${user?.uid}`} className="md:justify-self-end w-full md:w-auto">
              <Button className="w-full md:w-auto rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-medium">
                <Edit2 className="h-4 w-4 mr-2" /> Edit Profile
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="glass-card hover:shadow-lg hover:shadow-blue-400/15 hover:border-blue-200/30 transition-all duration-300 border-t-2 border-t-blue-400">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Issues
              </CardTitle>
              <AlertCircle className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats?.total || 0}</div>
              <p className="text-xs text-muted-foreground mt-2">Community-wide</p>
            </CardContent>
          </Card>

          <Card className="glass-card hover:shadow-lg hover:shadow-orange-400/15 hover:border-orange-200/30 transition-all duration-300 border-t-2 border-t-orange-400">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Open Issues
              </CardTitle>
              <Clock className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-500">{stats?.open || 0}</div>
              <p className="text-xs text-muted-foreground mt-2">Need attention</p>
            </CardContent>
          </Card>

          <Card className="glass-card hover:shadow-lg hover:shadow-green-400/15 hover:border-green-200/30 transition-all duration-300 border-t-2 border-t-green-400">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Supports
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats?.votes || 0}</div>
              <p className="text-xs text-muted-foreground mt-2">Community engagement</p>
            </CardContent>
          </Card>

          <Card className="glass-card hover:shadow-lg hover:shadow-purple-400/15 hover:border-purple-200/30 transition-all duration-300 border-t-2 border-t-purple-400">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Your Issues
              </CardTitle>
              <User className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{userIssues.length}</div>
              {(privateCount > 0 || draftCount > 0) && (
                <p className="text-xs text-muted-foreground mt-2">{privateCount} private · {draftCount} draft</p>
              )}
              {userIssues.length > 0 && privateCount === 0 && draftCount === 0 && (
                <p className="text-xs text-muted-foreground mt-2">All published</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Your Recent Issues */}
          <div className="lg:col-span-2">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-display">Your Issues</CardTitle>
                <CardDescription>
                  Manage your published and draft issues
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
                  <Tabs defaultValue="published" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="published" className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Published
                        <Badge variant="secondary" className="ml-1 bg-green-100 text-green-700">
                          {publishedIssues.length}
                        </Badge>
                      </TabsTrigger>
                      <TabsTrigger value="drafts" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Drafts & Private
                        <Badge variant="secondary" className="ml-1 bg-orange-100 text-orange-700">
                          {draftPrivateIssues.length}
                        </Badge>
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="published" className="space-y-4">
                      {publishedIssues.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm font-medium">No published issues yet</p>
                          <p className="text-xs mt-1">Your public issues will appear here</p>
                        </div>
                      ) : (
                        publishedIssues.slice(0, 5).map((issue) => (
                          <div key={issue.id}>
                            <Card
                              className="hover:shadow-lg transition cursor-pointer"
                              onClick={() => setSelectedIssue(issue)}
                            >
                              <IssueCard
                                issue={issue}
                                engagement={engagement?.[issue.id]}
                                onSetVisibility={(id, visibility) => setVisibility.mutate({ id, visibility })}
                                onSetStatus={(id, status, message, photos) => setStatus.mutate({ id, status, message, photos })}
                                onAddProgress={handleOpenProgressDialog}
                                onResolve={handleOpenResolveDialog}
                              />
                            </Card>
                          </div>
                        ))
                      )}
                    </TabsContent>
                    
                    <TabsContent value="drafts" className="space-y-4">
                      {draftPrivateIssues.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm font-medium">No draft or private issues</p>
                          <p className="text-xs mt-1">Issues saved as drafts or marked private will appear here</p>
                        </div>
                      ) : (
                        draftPrivateIssues.slice(0, 5).map((issue) => (
                          <div key={issue.id}>
                            <Card
                              className="hover:shadow-lg transition cursor-pointer border-l-4 border-l-orange-400"
                              onClick={() => setSelectedIssue(issue)}
                            >
                              <IssueCard
                                issue={issue}
                                engagement={engagement?.[issue.id]}
                                onSetVisibility={(id, visibility) => setVisibility.mutate({ id, visibility })}
                                onSetStatus={(id, status, message, photos) => setStatus.mutate({ id, status, message, photos })}
                                onAddProgress={handleOpenProgressDialog}
                                onResolve={handleOpenResolveDialog}
                              />
                            </Card>
                          </div>
                        ))
                      )}
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </div>

          {/* User Profile Sidebar */}
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-lg font-display">Your Profile</CardTitle>
                <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="font-display text-xl">Edit Profile</DialogTitle>
                    </DialogHeader>
                    <ProfilePictureEditor />
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <img
                    src={avatarUrl}
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

                <Button
                  variant="destructive"
                  className="w-full mt-2"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </Button>

                <Separator />

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Joined {new Date(user.metadata.creationTime || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Social Media Links */}
                {userProfile?.social && Object.values(userProfile.social).some(v => v) && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Follow</p>
                      <div className="flex flex-wrap gap-3">
                        {userProfile.social.website && (
                          <a
                            href={userProfile.social.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-orange-600 hover:text-orange-700 transition-all hover:shadow-md"
                            title="Website"
                          >
                            <Globe className="h-5 w-5" />
                          </a>
                        )}
                        {userProfile.social.github && (
                          <a
                            href={userProfile.social.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 text-slate-800 hover:text-slate-900 transition-all hover:shadow-md"
                            title="GitHub"
                          >
                            <Github className="h-5 w-5" />
                          </a>
                        )}
                        {userProfile.social.twitter && (
                          <a
                            href={userProfile.social.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 text-blue-500 hover:text-blue-600 transition-all hover:shadow-md"
                            title="Twitter"
                          >
                            <Twitter className="h-5 w-5" />
                          </a>
                        )}
                        {userProfile.social.linkedin && (
                          <a
                            href={userProfile.social.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 hover:text-blue-800 transition-all hover:shadow-md"
                            title="LinkedIn"
                          >
                            <Linkedin className="h-5 w-5" />
                          </a>
                        )}
                        {userProfile.social.instagram && (
                          <a
                            href={userProfile.social.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-pink-50 to-rose-50 hover:from-pink-100 hover:to-rose-100 text-pink-600 hover:text-pink-700 transition-all hover:shadow-md"
                            title="Instagram"
                          >
                            <Instagram className="h-5 w-5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Detailed Activity History Card */}
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-display flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                  Activity History
                </CardTitle>
                <CardDescription className="text-xs">
                  Your comments, likes, and replies across issues
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isActivityLoading ? (
                  <div className="text-sm text-stone-500 text-center py-4">Loading activity history...</div>
                ) : userActivity && (userActivity.comments.length > 0 || userActivity.likedComments.length > 0) ? (
                  <Tabs defaultValue="comments" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                      <TabsTrigger value="comments" className="text-xs">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Comments ({userActivity.comments.length})
                      </TabsTrigger>
                      <TabsTrigger value="replies" className="text-xs">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Replies ({userActivity.comments.filter(c => c.parentId).length})
                      </TabsTrigger>
                      <TabsTrigger value="likes" className="text-xs">
                        <ThumbsUp className="h-3 w-3 mr-1" />
                        Likes ({userActivity.likedComments.length})
                      </TabsTrigger>
                    </TabsList>

                    {/* Comments Tab */}
                    <TabsContent value="comments" className="space-y-3 max-h-96 overflow-y-auto">
                      {userActivity.comments.filter(c => !c.parentId).length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-xs">No comments yet</p>
                        </div>
                      ) : (
                        userActivity.comments
                          .filter(c => !c.parentId)
                          .slice(0, 10)
                          .map((comment) => (
                            <div key={comment.id} className="p-3 bg-white/70 backdrop-blur border rounded-lg hover:shadow-md transition-shadow">
                              <div className="flex items-start gap-2 mb-2">
                                <MessageSquare className="h-3.5 w-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-stone-900 mb-1">
                                    on "{comment.issue?.title || 'Unknown Issue'}"
                                  </p>
                                  <p className="text-xs text-stone-600 break-words">
                                    {comment.content}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between mt-2 text-xs text-stone-500">
                                <span>
                                  {(() => { 
                                    if (typeof comment.createdAt === 'number') {
                                      return formatRelativeTime(comment.createdAt);
                                    }
                                    const ts = comment.createdAt as unknown as { toDate?: () => Date };
                                    return ts?.toDate ? formatRelativeTime(ts.toDate()) : 'Unknown';
                                  })()}
                                </span>
                                {comment.likes > 0 && (
                                  <div className="flex items-center gap-1">
                                    <ThumbsUp className="h-3 w-3 text-orange-600" />
                                    <span>{comment.likes}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                      )}
                    </TabsContent>

                    {/* Replies Tab */}
                    <TabsContent value="replies" className="space-y-3 max-h-96 overflow-y-auto">
                      {userActivity.comments.filter(c => c.parentId).length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-xs">No replies yet</p>
                        </div>
                      ) : (
                        userActivity.comments
                          .filter(c => c.parentId)
                          .slice(0, 10)
                          .map((reply) => (
                            <div key={reply.id} className="p-3 bg-orange-50/50 backdrop-blur border border-orange-200 rounded-lg hover:shadow-md transition-shadow">
                              <div className="flex items-start gap-2 mb-2">
                                <MessageSquare className="h-3.5 w-3.5 text-purple-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-stone-900 mb-1">
                                    Reply on "{reply.issue?.title || 'Unknown Issue'}"
                                  </p>
                                  <p className="text-xs text-stone-600 break-words">
                                    {reply.content}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between mt-2 text-xs text-stone-500">
                                <span>
                                  {(() => { 
                                    if (typeof reply.createdAt === 'number') {
                                      return formatRelativeTime(reply.createdAt);
                                    }
                                    const ts = reply.createdAt as unknown as { toDate?: () => Date };
                                    return ts?.toDate ? formatRelativeTime(ts.toDate()) : 'Unknown';
                                  })()}
                                </span>
                                {reply.likes > 0 && (
                                  <div className="flex items-center gap-1">
                                    <ThumbsUp className="h-3 w-3 text-orange-600" />
                                    <span>{reply.likes}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                      )}
                    </TabsContent>

                    {/* Likes Tab */}
                    <TabsContent value="likes" className="space-y-3 max-h-96 overflow-y-auto">
                      {userActivity.likedComments.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <ThumbsUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-xs">No liked comments yet</p>
                        </div>
                      ) : (
                        userActivity.likedComments.slice(0, 10).map((liked) => (
                          <div key={liked.commentId} className="p-3 bg-white/70 backdrop-blur border rounded-lg hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-2 mb-2">
                              <ThumbsUp className="h-3.5 w-3.5 text-orange-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-stone-900 mb-1">
                                  on "{liked.issue?.title || 'Unknown Issue'}"
                                </p>
                                {liked.comment && (
                                  <p className="text-xs text-stone-600 break-words">
                                    {liked.comment.content}
                                  </p>
                                )}
                              </div>
                            </div>
                            {liked.comment && (
                              <div className="text-xs text-stone-500 mt-2">
                                by {liked.comment.userName}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-medium">No activity history yet</p>
                    <p className="text-xs mt-1">
                      Comment on issues and interact with the community
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* User Activity Card */}
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-display flex items-center gap-2">
                      <Activity className="h-4 w-4 text-orange-600" />
                      Your Activity
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Your engagement across the platform
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      queryClient.invalidateQueries({ queryKey: ['user-activity', user?.uid] });
                      queryClient.invalidateQueries({ queryKey: ['local-activity', user?.uid] });
                      queryClient.invalidateQueries({ queryKey: ['firebase-activity', user?.uid] });
                    }}
                    className="h-8 px-2 text-xs"
                    disabled={activityTracker.isLoading}
                    title="Refresh activity"
                  >
                    <svg 
                      className={`h-3.5 w-3.5 ${activityTracker.isLoading ? 'animate-spin' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {activityTracker.isLoading ? (
                  <div className="text-sm text-stone-500">Loading activity...</div>
                ) : (
                  <>
                    {/* Total Activity Summary - Using local tracker for instant updates */}
                    <div className="p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Activity className="h-5 w-5 text-orange-600" />
                          <span className="font-semibold text-stone-800">Total Engagement</span>
                          {activityTracker.isLoadingFirebase && (
                            <span className="text-xs text-stone-500">(syncing...)</span>
                          )}
                        </div>
                        <Badge className="bg-orange-600 text-white text-base font-bold px-3 py-1">
                          {activityTracker.local.totalEngagement}
                        </Badge>
                      </div>
                      <p className="text-xs text-stone-600 mt-1">
                        All your votes, comments, and interactions • Updated in real-time
                      </p>
                    </div>

                    <Separator />

                    {/* Activity Stats - Using local tracker */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-stone-600">
                          <ThumbsUp className="h-4 w-4" />
                          <span>Upvotes Given</span>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {activityTracker.local.upvotesGiven}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-stone-600">
                          <ThumbsDown className="h-4 w-4" />
                          <span>Downvotes Given</span>
                        </div>
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          {activityTracker.local.downvotesGiven}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-stone-600">
                          <MessageSquare className="h-4 w-4" />
                          <span>Comments Made</span>
                        </div>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {activityTracker.local.commentsMade}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-stone-600">
                          <MessageSquare className="h-4 w-4" />
                          <span>Replies Made</span>
                        </div>
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          {activityTracker.local.repliesMade}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-stone-600">
                          <ThumbsUp className="h-4 w-4" />
                          <span>Comments Liked</span>
                        </div>
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          {activityTracker.local.commentsLiked}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-stone-600">
                          <ThumbsUp className="h-4 w-4 text-amber-600" />
                          <span>Comment Likes Received</span>
                        </div>
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          {activityTracker.firebase?.commentLikesReceived || 0}
                        </Badge>
                      </div>
                    </div>

                    {/* Activity Breakdown */}
                    {(() => {
                      const upvotes = activityTracker.local.upvotesGiven;
                      const downvotes = activityTracker.local.downvotesGiven;
                      const totalComments = activityTracker.local.commentsMade;
                      const commentsLiked = activityTracker.local.commentsLiked;
                      const commentLikesReceived = activityTracker.firebase?.commentLikesReceived || 0;
                      const total = upvotes + downvotes + totalComments + commentsLiked;

                      return total > 0 ? (
                        <>
                          <Separator />
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-stone-700 uppercase tracking-wide">
                              Activity Breakdown
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="p-2 bg-stone-50 rounded border border-stone-200">
                                <div className="text-stone-500">Voting Actions</div>
                                <div className="font-bold text-stone-900 text-lg">
                                  {upvotes + downvotes}
                                </div>
                                <div className="text-xs text-stone-500">
                                  {upvotes} up · {downvotes} down
                                </div>
                              </div>
                              <div className="p-2 bg-stone-50 rounded border border-stone-200">
                                <div className="text-stone-500">Comment Actions</div>
                                <div className="font-bold text-stone-900 text-lg">
                                  {totalComments + commentsLiked}
                                </div>
                                <div className="text-xs text-stone-500">
                                  {totalComments} written · {commentsLiked} liked
                                </div>
                              </div>
                            </div>
                            <div className="p-2 bg-blue-50 rounded border border-blue-200">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-blue-700 font-medium">Impact Score</span>
                                <span className="text-lg font-bold text-blue-900">
                                  {commentLikesReceived}
                                </span>
                              </div>
                              <div className="text-xs text-blue-600 mt-0.5">
                                Total likes received on your {totalComments} comment{totalComments !== 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
                        </>
                      ) : null;
                    })()}

                    <Separator />

                    {/* Recent Voted Issues - Show from Firebase if available */}
                    {userActivity && userActivity.votedIssues.length > 0 && (
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
