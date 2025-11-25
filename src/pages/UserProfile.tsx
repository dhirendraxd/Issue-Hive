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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { useIsFollowing, useFollowUser, useUnfollowUser, useFollowCounts } from '@/hooks/use-follow';
import { useUserProfile } from '@/hooks/use-user-profile';
import { toast } from 'sonner';
import ParticlesBackground from '@/components/ParticlesBackground';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getUserAvatarUrl } from '@/lib/avatar';
import { useAvatarUrl } from '@/hooks/use-avatar-url';
import { sanitizeText, sanitizeURL, limitLength, sanitizeEmail } from '@/lib/sanitize';

export default function UserProfile() {
  const { uid } = useParams();
  const [search] = useSearchParams();
  const { user } = useAuth();
  const { data: issues, isLoading, stats, setVisibility, resolveIssue, addProgress } = useIssuesFirebase();
  const { data: userActivity, isLoading: isActivityLoading } = useUserActivity();
  const activityTracker = useActivityTracker();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // Get user profile data
  const { data: ownerProfile, isLoading: profileLoading } = useUserProfile(uid!);
  
  // Resolve avatar URL (handles firestore:// references)
  const avatarUrl = useAvatarUrl(ownerProfile?.photoURL, uid || '');
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
  
  // Initialize state after ownerProfile is available
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [github, setGithub] = useState('');
  const [twitter, setTwitter] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [instagram, setInstagram] = useState('');
  const [username, setUsername] = useState('');
  const [editingUsername, setEditingUsername] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);
  
  // Sync state with ownerProfile when it loads
  useEffect(() => {
    if (ownerProfile) {
      setBio(ownerProfile.bio || '');
      setLocation(ownerProfile.location || '');
      setWebsite(ownerProfile.social?.website || '');
      setPronouns(ownerProfile.pronouns || '');
      setGithub(ownerProfile.social?.github || '');
      setTwitter(ownerProfile.social?.twitter || '');
      setLinkedin(ownerProfile.social?.linkedin || '');
      setInstagram(ownerProfile.social?.instagram || '');
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
      // Sanitize display name
      const sanitizedName = limitLength(sanitizeText(newDisplayName), 100);
      if (!sanitizedName) {
        toast.error('Invalid display name');
        setSavingName(false);
        return;
      }
      
      await updateUserDisplayName(user, sanitizedName);
      
      // Invalidate queries to refetch updated data
      await queryClient.invalidateQueries({ queryKey: ['user-profile', user.uid] });
      await queryClient.invalidateQueries({ queryKey: ['issues'] });
      await queryClient.invalidateQueries({ queryKey: ['comments'] });
      
      toast.success('Display name updated across all issues and comments!');
      setEditingName(false);
      
      // Reload to reflect changes everywhere
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
        queryClient.invalidateQueries({ queryKey: ['user-profile', user.uid] });
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
      
      // Sanitize all inputs
      const sanitizedBio = limitLength(sanitizeText(bio), 160);
      const sanitizedLocation = limitLength(sanitizeText(location), 100);
      const sanitizedWebsite = sanitizeURL(website);
      const sanitizedPronouns = sanitizeText(pronouns);
      const sanitizedGithub = sanitizeURL(github);
      const sanitizedTwitter = sanitizeURL(twitter);
      const sanitizedLinkedin = sanitizeURL(linkedin);
      const sanitizedInstagram = sanitizeURL(instagram);
      
      // Validate URLs if provided
      if (website && !sanitizedWebsite) {
        toast.error('Invalid website URL');
        return;
      }
      if (github && !sanitizedGithub) {
        toast.error('Invalid GitHub URL');
        return;
      }
      if (twitter && !sanitizedTwitter) {
        toast.error('Invalid Twitter URL');
        return;
      }
      if (linkedin && !sanitizedLinkedin) {
        toast.error('Invalid LinkedIn URL');
        return;
      }
      if (instagram && !sanitizedInstagram) {
        toast.error('Invalid Instagram URL');
        return;
      }
      
      await updateDoc(doc(db, 'users', user.uid), {
        bio: sanitizedBio,
        location: sanitizedLocation,
        pronouns: sanitizedPronouns,
        'social.website': sanitizedWebsite,
        'social.github': sanitizedGithub,
        'social.twitter': sanitizedTwitter,
        'social.linkedin': sanitizedLinkedin,
        'social.instagram': sanitizedInstagram,
        updatedAt: new Date()
      });
      
      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['user-profile', user.uid] });
      toast.success('Profile updated!');
      setEditingBio(false);
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleSaveUsername = async () => {
    if (!user || !username.trim()) {
      console.log('Cannot save: missing user or empty username');
      return;
    }
    
    // Sanitize and validate username
    const sanitizedUsername = sanitizeText(username).toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!sanitizedUsername || sanitizedUsername.length < 3 || sanitizedUsername.length > 32) {
      toast.error('Username must be 3-32 characters (letters, numbers, _ or - only)');
      return;
    }
    
    const trimmedUsername = sanitizedUsername.trim();
    if (trimmedUsername === ownerProfile?.username) {
      console.log('Username unchanged, skipping save');
      toast.info('Username is already set to that value');
      setEditingUsername(false);
      return;
    }
    
    setSavingUsername(true);
    try {
      const { updateUsername } = await import('@/integrations/firebase/profile');
      
      console.log('Updating username from:', ownerProfile?.username, 'to:', trimmedUsername, 'for user:', user.uid);
      
      await updateUsername(user.uid, trimmedUsername);
      
      console.log('Username updated in Firestore, invalidating queries');
      
      // Invalidate and refetch the query for the current profile being viewed
      await queryClient.invalidateQueries({ queryKey: ['user-profile', uid] });
      await queryClient.refetchQueries({ queryKey: ['user-profile', uid] });
      
      toast.success('Username updated!');
      setEditingUsername(false);
    } catch (error) {
      console.error('Failed to update username:', error);
      toast.error('Failed to update username');
    } finally {
      setSavingUsername(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 animate-in fade-in duration-300">
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
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-orange-500 to-amber-500 text-white">
                    {ownerProfile?.displayName?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              {/* Action Buttons */}
              <div className="absolute top-4 right-4 flex gap-2">
                {isOwner ? (
                  <Sheet open={editSheetOpen} onOpenChange={(open)=>{
                    if (open && !ownerProfile) return; // wait until profile loaded
                    setEditSheetOpen(open);
                  }}>
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
                      {ownerProfile ? (
                        <>
                        <SheetHeader>
                        <SheetTitle className="text-xl">Edit Profile</SheetTitle>
                        <SheetDescription>
                          Customize your profile, upload photos, and manage privacy settings
                        </SheetDescription>
                      </SheetHeader>
                      
                      <Tabs defaultValue="basic" className="mt-6">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="basic">Basic Info</TabsTrigger>
                          <TabsTrigger value="photos">Photos</TabsTrigger>
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
                                    className="bg-gradient-to-r from-orange-500 to-amber-500 shrink-0"
                                  >
                                    {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                  </Button>
                                  <Button
                                    onClick={() => setEditingName(false)}
                                    disabled={savingName}
                                    size="sm"
                                    variant="outline"
                                    className="shrink-0"
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

                          {/* Username */}
                          <Card className="rounded-xl border border-stone-200 p-5">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="font-semibold text-base">@Username</h3>
                                  <p className="text-xs text-muted-foreground">Your unique handle</p>
                                </div>
                                {!editingUsername && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditingUsername(true);
                                      setUsername(ownerProfile?.username || '');
                                    }}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>

                              {editingUsername ? (
                                <div className="flex gap-2">
                                  <div className="relative flex-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                                    <Input
                                      value={username}
                                      onChange={(e) => setUsername(e.target.value)}
                                      placeholder="username"
                                      disabled={savingUsername}
                                      className="pl-8"
                                      maxLength={32}
                                    />
                                  </div>
                                  <Button
                                    onClick={handleSaveUsername}
                                    disabled={savingUsername || !username.trim()}
                                    size="sm"
                                    className="bg-gradient-to-r from-orange-500 to-amber-500 shrink-0"
                                  >
                                    {savingUsername ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                  </Button>
                                  <Button
                                    onClick={() => setEditingUsername(false)}
                                    disabled={savingUsername}
                                    size="sm"
                                    variant="outline"
                                    className="shrink-0"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div>
                                  <p className="text-base font-medium">@{ownerProfile?.username || 'Not set'}</p>
                                  <p className="text-xs text-muted-foreground mt-1">Current username</p>
                                </div>
                              )}
                            </div>
                          </Card>

                          {/* Email (Read-only) */}
                          <Card className="rounded-xl border border-stone-200 p-5">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="font-semibold text-base">Email</h3>
                                  <p className="text-xs text-muted-foreground">Your account email (managed in Firebase Auth)</p>
                                </div>
                                <Badge variant="outline" className="text-xs">Read-only</Badge>
                              </div>
                              <div>
                                <p className="text-base font-medium">{user?.email || 'Not set'}</p>
                                <p className="text-xs text-muted-foreground mt-1">Current email address</p>
                              </div>
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
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs text-muted-foreground">{bio.length}/160 characters</p>
                                    <div className="flex gap-2">
                                      <Button
                                        onClick={() => setEditingBio(false)}
                                        size="sm"
                                        variant="outline"
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <p className="text-base">{bio || 'No bio added yet'}</p>
                                  <p className="text-xs text-muted-foreground mt-1">Current bio</p>
                                </div>
                              )}
                            </div>
                          </Card>

                          {/* Location */}
                          <Card className="rounded-xl border border-stone-200 p-5">
                            <div className="space-y-4">
                              <div>
                                <h3 className="font-semibold text-base">Location</h3>
                                <p className="text-xs text-muted-foreground">Where are you based?</p>
                              </div>
                              <Input
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="City, Country"
                              />
                            </div>
                          </Card>

                          {/* Pronouns */}
                          <Card className="rounded-xl border border-stone-200 p-5">
                            <div className="space-y-4">
                              <div>
                                <h3 className="font-semibold text-base">Pronouns</h3>
                                <p className="text-xs text-muted-foreground">How would you like to be referred?</p>
                              </div>
                              <Select value={pronouns} onValueChange={setPronouns}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select pronouns" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="he/him">he/him</SelectItem>
                                  <SelectItem value="she/her">she/her</SelectItem>
                                  <SelectItem value="they/them">they/them</SelectItem>
                                  <SelectItem value="he/they">he/they</SelectItem>
                                  <SelectItem value="she/they">she/they</SelectItem>
                                  <SelectItem value="any">any pronouns</SelectItem>
                                  <SelectItem value="other">other</SelectItem>
                                  <SelectItem value="">Prefer not to say</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </Card>

                          {/* Website */}
                          <Card className="rounded-xl border border-stone-200 p-5">
                            <div className="space-y-4">
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

                          {/* Social Media Links */}
                          <Card className="rounded-xl border border-stone-200 p-5">
                            <div className="space-y-4">
                              <div>
                                <h3 className="font-semibold text-base">Social Media</h3>
                                <p className="text-xs text-muted-foreground">Connect your social profiles</p>
                              </div>
                              
                              <div className="space-y-3">
                                <div className="space-y-1.5">
                                  <label className="text-sm font-medium flex items-center gap-2">
                                    <Github className="h-4 w-4" />
                                    GitHub
                                  </label>
                                  <Input
                                    value={github}
                                    onChange={(e) => setGithub(e.target.value)}
                                    placeholder="https://github.com/username"
                                    type="url"
                                  />
                                </div>
                                
                                <div className="space-y-1.5">
                                  <label className="text-sm font-medium flex items-center gap-2">
                                    <Twitter className="h-4 w-4" />
                                    Twitter/X
                                  </label>
                                  <Input
                                    value={twitter}
                                    onChange={(e) => setTwitter(e.target.value)}
                                    placeholder="https://twitter.com/username"
                                    type="url"
                                  />
                                </div>
                                
                                <div className="space-y-1.5">
                                  <label className="text-sm font-medium flex items-center gap-2">
                                    <Linkedin className="h-4 w-4" />
                                    LinkedIn
                                  </label>
                                  <Input
                                    value={linkedin}
                                    onChange={(e) => setLinkedin(e.target.value)}
                                    placeholder="https://linkedin.com/in/username"
                                    type="url"
                                  />
                                </div>
                                
                                <div className="space-y-1.5">
                                  <label className="text-sm font-medium flex items-center gap-2">
                                    <Instagram className="h-4 w-4" />
                                    Instagram
                                  </label>
                                  <Input
                                    value={instagram}
                                    onChange={(e) => setInstagram(e.target.value)}
                                    placeholder="https://instagram.com/username"
                                    type="url"
                                  />
                                </div>
                              </div>
                            </div>
                          </Card>

                          {(editingBio || location !== (ownerProfile?.location || '') || website !== (ownerProfile?.social?.website || '') || pronouns !== (ownerProfile?.pronouns || '') || github !== (ownerProfile?.social?.github || '') || twitter !== (ownerProfile?.social?.twitter || '') || linkedin !== (ownerProfile?.social?.linkedin || '') || instagram !== (ownerProfile?.social?.instagram || '')) && (
                            <div className="pt-2">
                              <Button 
                                onClick={handleSaveProfileInfo}
                                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                                size="lg"
                              >
                                <Check className="w-4 h-4 mr-2" />
                                Save Changes
                              </Button>
                            </div>
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
                      </Tabs>
                      </>
                      ) : (
                        <div className="py-10 flex flex-col items-center gap-4">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Loading profile...</p>
                        </div>
                      )}
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
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold tracking-tight">{ownerProfile?.displayName || 'User'}</h1>
                    {ownerProfile?.pronouns && (
                      <span className="text-sm text-muted-foreground font-normal">({ownerProfile.pronouns})</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">@{ownerProfile?.username || ownerProfile?.displayName?.toLowerCase().replace(/\s+/g, '') || 'user'}</p>
                </div>
                
                {/* Social Links - Right Side */}
                {ownerProfile?.social && (
                  <div className="flex flex-wrap gap-2 justify-end">
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
                    ) : userActivity ? (
                      <div className="space-y-4">
                        {/* Activity Summary - Always show */}
                        <Card className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg p-6">
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
                        <Card className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg">
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
                          <Card className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg p-10 text-center">
                            <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
                            <p className="text-muted-foreground">No recent activity to show</p>
                          </Card>
                        )}
                      </div>
                    ) : (
                      <Card className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg p-10 text-center">
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

