import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
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
import { Edit2, Check, X, Loader2 } from 'lucide-react';
import { ISSUE_STATUSES } from '@/types/issue';
import { updateUserDisplayName } from '@/integrations/firebase/profile';
import ProfileVisibilitySettings from '@/components/ProfileVisibilitySettings';
import { useIsFollowing, useFollowUser, useUnfollowUser } from '@/hooks/use-follow';
import { useUserProfile } from '@/hooks/use-user-profile';
import { toast } from 'sonner';
import ParticlesBackground from '@/components/ParticlesBackground';

export default function UserProfile() {
  const { uid } = useParams();
  const { user } = useAuth();
  const { data: issues, isLoading } = useIssuesFirebase();
  const [editingName, setEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(user?.displayName || '');
  const [savingName, setSavingName] = useState(false);

  // Filter issues belonging to this user
  const owned = (issues || []).filter(i => i.createdBy === uid);
  const isOwner = user?.uid === uid;
  const { data: isFollowing = false } = useIsFollowing(!isOwner ? uid : undefined);
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();
  const { data: ownerProfile } = useUserProfile(!isOwner ? uid : undefined);
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
        <main className="scroll-mt-20 pt-32 pb-24 px-4 mx-auto max-w-5xl">
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
              {/* Public Profile View for Other Users */}
              <div className="mb-10 flex flex-col md:flex-row md:items-end gap-4 justify-between">
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight font-display">User Profile</h1>
                  <p className="text-sm text-muted-foreground">Issues created by this user</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span><strong>{publicIssues.length}</strong> public issues</span>
                    {followerPrivateIssues.length > 0 && (
                      <span><strong>{followerPrivateIssues.length}</strong> private (shared)</span>
                    )}
                    {(privateCount > 0 || draftCount > 0) && followerPrivateIssues.length === 0 && (
                      <span className="italic">(private/draft issues hidden)</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <Link to="/issues"><Button variant="outline" className="rounded-full">Back to Issues</Button></Link>
                  {user && !isOwner && (
                    isFollowing ? (
                      <Button
                        variant="secondary"
                        className="rounded-full"
                        disabled={unfollowMutation.isPending}
                        onClick={() => unfollowMutation.mutate(uid!)}
                      >
                        {unfollowMutation.isPending ? 'Unfollowing...' : 'Unfollow'}
                      </Button>
                    ) : (
                      <Button
                        className="rounded-full bg-gradient-to-r from-orange-500 to-amber-500"
                        disabled={followMutation.isPending}
                        onClick={() => followMutation.mutate(uid!)}
                      >
                        {followMutation.isPending ? 'Following...' : 'Follow'}
                      </Button>
                    )
                  )}
                </div>
              </div>

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
                            <span className="text-xs text-muted-foreground">{issue.votes} {issue.votes === 1 ? 'support' : 'supports'}</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </main>
      </ParticlesBackground>
    </div>
  );
}
