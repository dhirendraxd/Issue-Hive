import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Edit2, Check, X, Loader2, MapPin, Globe, Github, Twitter, Linkedin, Instagram, ThumbsUp, ThumbsDown, MessageSquare, TrendingUp, Calendar, Link2, Settings, LogOut, Plus, Clock, AlertCircle, Activity as ActivityIcon, Eye, MoreVertical, Upload } from 'lucide-react';
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
  const [uploadingCover, setUploadingCover] = useState(false);

  // Filter issues belonging to this user
  const owned = (issues || []).filter(i => i.createdBy === uid);
  const previewVisitor = search.get('previewVisitor') === '1' || search.get('as') === 'visitor';
  const rawIsOwner = user?.uid === uid;
  const isOwner = previewVisitor ? false : rawIsOwner;
  const { data: isFollowing = false } = useIsFollowing(!isOwner ? uid : undefined);
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();
  const { data: ownerProfile } = useUserProfile(uid);
  
  // Initialize state after ownerProfile is available
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [username, setUsername] = useState('');
  const [editingUsername, setEditingUsername] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);
  
  // Sync state with ownerProfile when it loads
  useEffect(() => {
    if (ownerProfile) {
      setBio(ownerProfile.bio || '');
      setLocation(ownerProfile.location || '');
      setWebsite(ownerProfile.social?.website || '');
      setUsername(ownerProfile.username || '');
    }
  }, [ownerProfile]);
  
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
      await setVisibility.mutateAsync({ id: issueId, visibility: newVisibility as 'public' | 'private' | 'draft' });
      // Invalidate queries to ensure UI updates immediately
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['issueEngagement'] });
      toast.success(`Issue visibility updated to ${newVisibility}`);
    } catch (error) {
      toast.error('Failed to update visibility');
    }
  };

  const handleCoverPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a JPEG, PNG, or WebP image');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setUploadingCover(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const { doc, updateDoc } = await import('firebase/firestore');
        const { db } = await import('@/integrations/firebase/config');
        
        await updateDoc(doc(db, 'users', user.uid), {
          coverUrl: base64,
          updatedAt: new Date()
        });
        
        // Invalidate queries to refetch updated data
        queryClient.invalidateQueries({ queryKey: ['userProfile', user.uid] });
        toast.success('Cover photo updated!');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Failed to upload cover photo');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSaveProfileInfo = async () => {
    if (!user) return;
    
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('@/integrations/firebase/config');
      
      await updateDoc(doc(db, 'users', user.uid), {
        bio: bio.trim(),
        location: location.trim(),
        'social.website': website.trim(),
        updatedAt: new Date()
      });
      
      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['userProfile', user.uid] });
      toast.success('Profile updated!');
      setEditingBio(false);
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleSaveUsername = async () => {
    if (!user || !username.trim() || username === ownerProfile?.username) return;
    
    setSavingUsername(true);
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('@/integrations/firebase/config');
      
      await updateDoc(doc(db, 'users', user.uid), {
        username: username.trim(),
        updatedAt: new Date()
      });
      
      queryClient.invalidateQueries({ queryKey: ['userProfile', user.uid] });
      toast.success('Username updated!');
      setEditingUsername(false);
    } catch (error) {
      toast.error('Failed to update username');
    } finally {
      setSavingUsername(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <ParticlesBackground fullPage hexOpacity={0.10}>
        <Navbar />
        <main className="pt-24 pb-24 px-4 mx-auto max-w-5xl">
          {/* Unified Twitter/X Style Profile for everyone */}
          <div className="max-w-4xl mx-auto">
            {/* Cover Image */}
            <div className="relative">
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
                    <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle className="text-xl">Edit Profile</SheetTitle>
                        <SheetDescription>
                          Customize your profile, upload photos, and manage privacy settings
                        </SheetDescription>
                      </SheetHeader>
                      
                      <Tabs defaultValue="basic" className="mt-6">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="basic">Basic Info</TabsTrigger>
                          <TabsTrigger value="photos">Photos</TabsTrigger>
                          <TabsTrigger value="privacy">Privacy</TabsTrigger>
                        </TabsList>
                        
                        {/* Basic Info Tab */}
                        <TabsContent value="basic" className="space-y-6 mt-6">
                          {/* Display Name */}
                          <Card className="rounded-xl border border-stone-200 p-5">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="font-semibold text-base">Full Name</h3>
                                  <p className="text-xs text-muted-foreground">Your display name shown on your profile</p>
                                </div>
                                {!editingName && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditingName(true);
                                      setNewDisplayName(user?.displayName || '');
                                    }}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>

                              {editingName ? (
                                <div className="flex gap-2">
                                  <Input
                                    value={newDisplayName}
                                    onChange={(e) => setNewDisplayName(e.target.value)}
                                    placeholder="Your name"
                                    disabled={savingName}
                                    className="flex-1"
                                  />
                                  <Button
                                    onClick={handleSaveDisplayName}
                                    disabled={savingName || !newDisplayName.trim()}
                                    size="sm"
                                    className="bg-gradient-to-r from-orange-500 to-amber-500"
                                  >
                                    {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                  </Button>
                                  <Button
                                    onClick={() => setEditingName(false)}
                                    disabled={savingName}
                                    size="sm"
                                    variant="outline"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div>
                                  <p className="text-base font-medium">{user?.displayName || 'Not set'}</p>
                                  <p className="text-xs text-muted-foreground mt-1">Current full name</p>
                                </div>
                              )}
                            </div>
                          </Card>

                          {/* Bio */}
                          <Card className="rounded-xl border border-stone-200 p-5">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="font-semibold text-base">Bio</h3>
                                  <p className="text-xs text-muted-foreground">Tell others about yourself</p>
                                </div>
                                {!editingBio && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingBio(true)}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                              
                              {editingBio ? (
                                <div className="space-y-2">
                                  <Textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="Write a short bio..."
                                    className="min-h-[100px] resize-none"
                                    maxLength={160}
                                  />
                                  <p className="text-xs text-muted-foreground text-right">{bio.length}/160</p>
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">{bio || 'No bio added yet'}</p>
                              )}
                            </div>
                          </Card>

                          {/* Location */}
                          <Card className="rounded-xl border border-stone-200 p-5">
                            <div className="space-y-3">
                              <div>
                                <h3 className="font-semibold text-base">Location</h3>
                                <p className="text-xs text-muted-foreground">Where are you based?</p>
                              </div>
                              <Input
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="City, Country"
                                className=""
                              />
                            </div>
                          </Card>

                          {/* Website */}
                          <Card className="rounded-xl border border-stone-200 p-5">
                            <div className="space-y-3">
                              <div>
                                <h3 className="font-semibold text-base">Website</h3>
                                <p className="text-xs text-muted-foreground">Your personal website or portfolio</p>
                              </div>
                              <Input
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                                placeholder="https://example.com"
                                type="url"
                              />
                            </div>
                          </Card>

                          {(editingBio || location !== (ownerProfile?.location || '') || website !== (ownerProfile?.social?.website || '')) && (
                            <Button 
                              onClick={handleSaveProfileInfo}
                              className="w-full bg-gradient-to-r from-orange-500 to-amber-500"
                            >
                              Save Changes
                            </Button>
                          )}
                        </TabsContent>

                        {/* Photos Tab */}
                        <TabsContent value="photos" className="space-y-6 mt-6">
                          {/* Cover Photo */}
                          <Card className="rounded-xl border border-stone-200 p-5">
                            <div className="space-y-4">
                              <div>
                                <h3 className="font-semibold text-base">Cover Photo</h3>
                                <p className="text-xs text-muted-foreground">Upload a banner image for your profile</p>
                              </div>
                              
                              {ownerProfile?.coverUrl && (
                                <div className="relative aspect-[3/1] rounded-lg overflow-hidden border border-stone-200">
                                  <img 
                                    src={ownerProfile.coverUrl} 
                                    alt="Cover" 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  className="flex-1"
                                  disabled={uploadingCover}
                                  onClick={() => document.getElementById('cover-upload')?.click()}
                                >
                                  {uploadingCover ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <Upload className="w-4 h-4 mr-2" />
                                  )}
                                  {ownerProfile?.coverUrl ? 'Change Cover' : 'Upload Cover'}
                                </Button>
                                <input
                                  id="cover-upload"
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp"
                                  onChange={handleCoverPhotoUpload}
                                  className="hidden"
                                />
                              </div>
                              <p className="text-xs text-muted-foreground">Recommended: 1500x500px, Max 2MB (JPEG, PNG, WebP)</p>
                            </div>
                          </Card>

                          {/* Profile Picture */}
                          <ProfilePictureEditor />
                        </TabsContent>

                        {/* Privacy Tab */}
                        <TabsContent value="privacy" className="space-y-6 mt-6">
                          <ProfileVisibilitySettings />
                        </TabsContent>
                      </Tabs>
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
                <p className="text-sm text-muted-foreground">@{ownerProfile?.username || ownerProfile?.displayName?.toLowerCase().replace(/\s+/g, '') || 'user'}</p>
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
                          <Card className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg p-10 text-center">
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
                                  className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg flex flex-col hover:shadow-lg hover:shadow-orange-400/20 hover:border-orange-200/40 transition-all cursor-pointer"
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
                            <Card 
                              key={issue.id} 
                              className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg flex flex-col hover:shadow-lg hover:shadow-orange-400/20 hover:border-orange-200/40 transition-all cursor-pointer"
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
              onVisibilityChange={handleVisibilityChange}
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

