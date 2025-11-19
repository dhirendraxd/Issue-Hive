import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useIssuesFirebase } from '@/hooks/use-issues-firebase';
import { useAuth } from '@/hooks/use-auth';
import Navbar from '@/components/Navbar';
import ProfilePictureEditor from '@/components/ProfilePictureEditor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit2, Check, X, Loader2, MapPin, Globe, Github, Twitter, Linkedin, Instagram, ThumbsUp, ThumbsDown, MessageSquare, TrendingUp, Calendar, Link2 } from 'lucide-react';
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
  const { data: issues, isLoading } = useIssuesFirebase();
  const [editingName, setEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(user?.displayName || '');
  const [savingName, setSavingName] = useState(false);

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

  return (
    <div className="min-h-screen bg-stone-50">
      <ParticlesBackground fullPage hexOpacity={0.10}>
        <Navbar />
        {/* Cover banner */}
        {ownerProfile?.coverUrl && (
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-24">
            <div className="w-full h-40 md:h-56 rounded-2xl overflow-hidden border border-white/40 bg-white/60 backdrop-blur-lg">
              <img src={ownerProfile.coverUrl} alt="Profile cover" className="w-full h-full object-cover" />
            </div>
          </div>
        )}
        <main className="scroll-mt-20 pt-10 pb-24 px-4 mx-auto max-w-5xl">
          {isOwner ? (
            <Tabs defaultValue="profile" className="space-y-8">
              <TabsList className="inline-flex rounded-full bg-white/60 backdrop-blur-lg border border-white/40">
                <TabsTrigger value="profile" className="rounded-full">Profile Settings</TabsTrigger>
                <TabsTrigger value="issues" className="rounded-full">My Issues</TabsTrigger>
              </TabsList>

              {/* Profile Settings Tab */}
              <TabsContent value="profile" className="space-y-6">
                <div className="mb-6">
                  <h1 className="text-3xl font-semibold tracking-tight font-display">Profile Settings</h1>
                  <p className="text-sm text-muted-foreground">Manage your profile picture and display name</p>
                </div>

                {/* Display Name Editor */}
                <Card className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg p-6">
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
              </TabsContent>

              {/* My Issues Tab */}
              <TabsContent value="issues" className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-end gap-4 justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight font-display">My Issues</h2>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span><strong>{owned.length}</strong> total</span>
                      <span><strong>{publicIssues.length}</strong> public</span>
                      <span><strong>{privateCount}</strong> private</span>
                      <span><strong>{draftCount}</strong> draft</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link to="/issues"><Button variant="outline" className="rounded-full">Back to Issues</Button></Link>
                    <Link to="/dashboard"><Button className="rounded-full bg-gradient-to-r from-orange-500 to-amber-500">Dashboard</Button></Link>
                  </div>
                </div>

                {isLoading && (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-40 rounded-2xl" />
                    ))}
                  </div>
                )}

                {!isLoading && owned.length === 0 && (
                  <Card className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg p-10 text-center">
                    <p className="text-muted-foreground">No issues yet. Create your first issue to get started!</p>
                  </Card>
                )}

                {!isLoading && owned.length > 0 && (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {owned.map(issue => {
                      const vis = (issue as unknown as WithVisibility).visibility;
                      return (
                        <Card key={issue.id} className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg flex flex-col hover:shadow-lg hover:shadow-orange-400/20 hover:border-orange-200/40 transition-all">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="text-base font-semibold leading-snug line-clamp-2">{issue.title}</CardTitle>
                              {vis && vis !== 'public' && (
                                <Badge variant="outline" className="text-xs capitalize shrink-0">{vis}</Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="flex flex-col gap-3 text-sm flex-1">
                            <p className="text-muted-foreground line-clamp-3">{issue.description}</p>
                            <div className="flex flex-wrap gap-2 mt-auto">
                              <Badge variant="outline" className="text-xs">{issue.category}</Badge>
                              <Badge variant={issue.status === 'resolved' ? 'default' : 'secondary'} className="text-xs capitalize">{issue.status.replace('_',' ')}</Badge>
                              <span className="text-xs text-muted-foreground">{issue.votes} {issue.votes === 1 ? 'support' : 'supports'}</span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <>
              {/* Twitter/X Style Public Profile */}
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
                    {user && !isOwner && (
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
                
                {/* Tabs for Content */}
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
                  </TabsList>
                  
                  {/* Issues Tab */}
                  <TabsContent value="issues" className="mt-6">
                    {isLoading && (
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <Skeleton key={i} className="h-40 rounded-2xl" />
                        ))}
                      </div>
                    )}

                    {!isLoading && publicIssues.length === 0 && followerPrivateIssues.length === 0 && (
                      <Card className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg p-10 text-center">
                        <p className="text-muted-foreground">No public issues yet.</p>
                      </Card>
                    )}

                    {!isLoading && (publicIssues.length > 0 || followerPrivateIssues.length > 0) && (
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {[...publicIssues, ...followerPrivateIssues].map(issue => {
                          const vis = (issue as unknown as WithVisibility).visibility;
                          const engagement = engagementMap[issue.id] || { upvotes: 0, downvotes: 0, comments: 0, commentLikes: 0 };
                          return (
                            <Card key={issue.id} className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg flex flex-col hover:shadow-lg hover:shadow-orange-400/20 hover:border-orange-200/40 transition-all">
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-2">
                                  <CardTitle className="text-base font-semibold leading-snug line-clamp-2">{issue.title}</CardTitle>
                                  {vis === 'private' && <Badge variant="outline" className="text-xs capitalize">private</Badge>}
                                </div>
                              </CardHeader>
                              <CardContent className="flex flex-col gap-3 text-sm flex-1">
                                <p className="text-muted-foreground line-clamp-3">{issue.description}</p>
                                <div className="flex flex-wrap gap-2 mt-auto">
                                  <Badge variant="outline" className="text-xs">{issue.category}</Badge>
                                  <Badge variant={issue.status === 'resolved' ? 'default' : 'secondary'} className="text-xs capitalize">{issue.status.replace('_',' ')}</Badge>
                                </div>
                                {/* Engagement Metrics */}
                                <div className="flex flex-wrap gap-3 pt-2 border-t border-stone-200/60 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <ThumbsUp className="h-3.5 w-3.5 text-green-600" />
                                    <span className="font-medium text-stone-900">{engagement.upvotes}</span>
                                  </div>
                                  {!ownerProfile?.hideDislikeCounts && (
                                    <div className="flex items-center gap-1">
                                      <ThumbsDown className="h-3.5 w-3.5 text-red-600" />
                                      <span className="font-medium text-stone-900">{engagement.downvotes}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <MessageSquare className="h-3.5 w-3.5 text-blue-600" />
                                    <span className="font-medium text-stone-900">{engagement.comments}</span>
                                  </div>
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
                    {!isLoading && owned.length > 0 && (
                      <Card className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-orange-600" />
                            <CardTitle className="text-lg">Profile Analytics</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-3 rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/40">
                              <div className="text-2xl font-bold text-orange-600">{analytics.totalIssues}</div>
                              <div className="text-xs text-muted-foreground mt-1">Total Issues</div>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/40">
                              <div className="text-2xl font-bold text-green-600">{analytics.totalUpvotes}</div>
                              <div className="text-xs text-muted-foreground mt-1">Upvotes Received</div>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-200/40">
                              <div className="text-2xl font-bold text-blue-600">{analytics.totalComments}</div>
                              <div className="text-xs text-muted-foreground mt-1">Comments</div>
                            </div>
                            <div className="text-center p-3 rounded-lg bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200/40">
                              <div className="text-2xl font-bold text-purple-600">{analytics.resolvedIssues}</div>
                              <div className="text-xs text-muted-foreground mt-1">Resolved</div>
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t border-stone-200/60 flex justify-center gap-6 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <TrendingUp className="h-4 w-4 text-orange-600" />
                              <span><strong className="text-stone-900">{analytics.totalEngagement}</strong> total engagement</span>
                            </div>
                            {!ownerProfile?.hideDislikeCounts && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <ThumbsDown className="h-4 w-4 text-red-600" />
                                <span><strong className="text-stone-900">{analytics.totalDownvotes}</strong> downvotes</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </main>
      </ParticlesBackground>
    </div>
  );
}
