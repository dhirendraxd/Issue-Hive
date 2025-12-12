import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Save, Upload, Github, Twitter, Linkedin, Instagram, Edit2, Check, X, LogIn } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '@/integrations/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateUserDisplayName, uploadProfilePicture, updateUserProfilePicture, setDefaultAvatar } from '@/integrations/firebase/profile';
import { sanitizeText, sanitizeURL, limitLength } from '@/lib/sanitize';
import { getAvatarPreviews } from '@/lib/avatar';
import type { AvatarStyleId } from '@/lib/avatar';
import { useAvatarUrl } from '@/hooks/use-avatar-url';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export default function EditProfile() {
  const navigate = useNavigate();
  const { uid } = useParams();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { data: ownerProfile, isLoading: profileLoading } = useUserProfile(user?.uid || '');
  const avatarUrl = useAvatarUrl(ownerProfile?.photoURL, user?.uid || '');
  const avatarPreviews = useMemo(() => getAvatarPreviews(user?.uid || 'guest'), [user?.uid]);
  
  // State
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [github, setGithub] = useState('');
  const [twitter, setTwitter] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [instagram, setInstagram] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);

  // Initialize state
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
    }
    if (ownerProfile) {
      setUsername(ownerProfile.username || '');
      setBio(ownerProfile.bio || '');
      setLocation(ownerProfile.location || '');
      setWebsite(ownerProfile.social?.website || '');
      setGithub(ownerProfile.social?.github || '');
      setTwitter(ownerProfile.social?.twitter || '');
      setLinkedin(ownerProfile.social?.linkedin || '');
      setInstagram(ownerProfile.social?.instagram || '');
    }
  }, [user, ownerProfile]);

  // Auth redirect
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }
    if (uid && user.uid !== uid) {
      toast.error('You can only edit your own profile');
      navigate(`/profile/${user.uid}`, { replace: true });
    }
  }, [user, uid, navigate, authLoading]);

  if (authLoading || profileLoading || !user) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const handleSave = async () => {
    if (!user) return;

    const sanitizedBio = limitLength(sanitizeText(bio), 160);
    const sanitizedLocation = limitLength(sanitizeText(location), 100);
    const sanitizedWebsite = website ? sanitizeURL(website) : '';
    const sanitizedGithub = github ? sanitizeURL(github) : '';
    const sanitizedTwitter = twitter ? sanitizeURL(twitter) : '';
    const sanitizedLinkedin = linkedin ? sanitizeURL(linkedin) : '';
    const sanitizedInstagram = instagram ? sanitizeURL(instagram) : '';

    setSaving(true);
    try {
      // Update Firestore profile
      await updateDoc(doc(db, 'users', user.uid), {
        bio: sanitizedBio,
        location: sanitizedLocation,
        'social.website': sanitizedWebsite,
        'social.github': sanitizedGithub,
        'social.twitter': sanitizedTwitter,
        'social.linkedin': sanitizedLinkedin,
        'social.instagram': sanitizedInstagram,
        updatedAt: new Date()
      });
      
      queryClient.invalidateQueries({ queryKey: ['user-profile', user.uid] });
      toast.success('Profile updated successfully!');
      navigate(`/profile/${user.uid}`);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDisplayName = async () => {
    if (!user) return;

    const sanitizedDisplayName = sanitizeText(displayName);
    if (!sanitizedDisplayName || sanitizedDisplayName.length < 2) {
      toast.error('Display name must be at least 2 characters');
      return;
    }

    setSavingName(true);
    try {
      await updateUserDisplayName(user, sanitizedDisplayName);
      queryClient.invalidateQueries({ queryKey: ['user-profile', user.uid] });
      toast.success('Display name updated!');
      setEditingName(false);
    } catch (error) {
      toast.error('Failed to update display name');
    } finally {
      setSavingName(false);
    }
  };

  const handleSaveUsername = async () => {
    if (!user) return;

    const sanitizedUsername = sanitizeText(username.toLowerCase().replace(/[^a-z0-9_]/g, ''));
    if (!sanitizedUsername || sanitizedUsername.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }

    setSavingUsername(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        username: sanitizedUsername,
        updatedAt: new Date()
      });
      queryClient.invalidateQueries({ queryKey: ['user-profile', user.uid] });
      toast.success('Username updated!');
      setEditingUsername(false);
    } catch (error) {
      toast.error('Failed to update username');
    } finally {
      setSavingUsername(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const downloadURL = await uploadProfilePicture(file, user.uid);
      await updateUserProfilePicture(user, downloadURL);
      queryClient.invalidateQueries({ queryKey: ['user-profile', user.uid] });
      toast.success('Profile picture updated!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload profile picture';
      toast.error(message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSetDefaultAvatar = async (style: AvatarStyleId) => {
    if (!user) return;
    
    setUploadingAvatar(true);
    try {
      await setDefaultAvatar(user, style);
      queryClient.invalidateQueries({ queryKey: ['user-profile', user.uid] });
      toast.success('Avatar updated!');
    } catch (error) {
      toast.error('Failed to update avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-stone-200/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/profile/${user.uid}`)}
                className="hover:bg-orange-50"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Edit Profile</h1>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-muted-foreground">Customize your public profile</p>
                  {user?.providerData?.some(p => p.providerId === 'google.com') && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Logged in with Google
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-medium"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save All
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Profile Picture Section */}
          <Card className="glass-card overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 px-6 py-4 border-b border-stone-200/50">
              <h2 className="text-lg font-bold text-stone-900">Profile Picture</h2>
              <p className="text-sm text-muted-foreground mt-1">Upload a photo or choose a default avatar</p>
            </div>
            <div className="p-6">
              {/* Current Avatar and Upload */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
                <Avatar className="w-28 h-28 ring-4 ring-orange-100">
                  <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                  <AvatarFallback className="text-2xl font-bold">
                    {displayName?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="font-semibold text-sm mb-2">Upload Custom Photo</h3>
                    <input
                      type="file"
                      id="avatar-upload"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('avatar-upload')?.click()}
                      disabled={uploadingAvatar}
                      className="w-full sm:w-auto border-orange-200 hover:bg-orange-50"
                    >
                      {uploadingAvatar ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Choose Photo
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">JPG, PNG, GIF or WebP • Max 5MB</p>
                  </div>
                </div>
              </div>

              {/* Default Avatars */}
              <div className="border-t border-stone-200/50 pt-6">
                <h3 className="font-semibold text-sm mb-4">Or Choose a Default Avatar</h3>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {avatarPreviews.map((style) => (
                    <button
                      key={style.style}
                      onClick={() => handleSetDefaultAvatar(style.style)}
                      disabled={uploadingAvatar}
                      className="aspect-square rounded-full overflow-hidden border-3 border-stone-200 hover:border-orange-400 hover:shadow-lg transition-all duration-200 disabled:opacity-50 hover:scale-105"
                      title={style.label}
                    >
                      <img src={style.url} alt={style.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Basic Info */}
          <Card className="glass-card overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 px-6 py-4 border-b border-stone-200/50">
              <h2 className="text-lg font-bold text-stone-900">Basic Information</h2>
              <p className="text-sm text-muted-foreground mt-1">Your core profile details</p>
            </div>
            <div className="p-6 space-y-6">
            {/* Display Name */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="displayName">Display Name *</Label>
                  <p className="text-xs text-muted-foreground">Your full name shown on your profile</p>
                </div>
                {!editingName && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingName(true)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {editingName ? (
                <div className="flex gap-2">
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    disabled={savingName}
                    maxLength={100}
                  />
                  <Button
                    onClick={handleSaveDisplayName}
                    disabled={savingName || !displayName.trim()}
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
                <p className="text-base font-medium">{displayName || 'Not set'}</p>
              )}
            </div>

            {/* Username */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="username">@Username</Label>
                  <p className="text-xs text-muted-foreground">Your unique handle</p>
                </div>
                {!editingUsername && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingUsername(true)}
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
                <p className="text-base font-medium">@{username || 'Not set'}</p>
              )}
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email & Login</Label>
                  <p className="text-xs text-muted-foreground">Your account credentials</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="bg-blue-50/50 border border-blue-200/50 rounded-lg p-3">
                  <p className="text-xs font-medium text-blue-900 mb-1">Account Email</p>
                  <p className="text-sm font-medium text-stone-700">{user.email || 'Not set'}</p>
                </div>
                {user?.providerData?.some(p => p.providerId === 'google.com') && (
                  <div className="bg-blue-50/50 border border-blue-200/50 rounded-lg p-3 flex items-center gap-3">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <div>
                      <p className="text-xs font-medium text-blue-900">Login Method</p>
                      <p className="text-sm font-medium text-stone-700">Signed in with Google</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="bio">Bio</Label>
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
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Write a short bio..."
                    rows={4}
                    maxLength={160}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{bio.length}/160 characters</p>
                    <Button
                      onClick={() => setEditingBio(false)}
                      size="sm"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-base">{bio || 'No bio added yet'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, Country"
                maxLength={100}
              />
            </div>

            </div>
          </Card>

          {/* Social Media Links Section */}
          <Card className="glass-card overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 px-6 py-4 border-b border-stone-200/50">
              <h2 className="text-lg font-bold text-stone-900">Social Media</h2>
              <p className="text-sm text-muted-foreground mt-1">Connect your social profiles</p>
            </div>
            <div className="p-6 space-y-6">
              {/* Website */}
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>

              {/* Social Icons Display */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Your Profiles</p>
                <div className="flex flex-wrap gap-3">
                  {/* GitHub */}
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={github}
                      onChange={(e) => setGithub(e.target.value)}
                      placeholder="https://github.com/username"
                      className="text-sm px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 w-64"
                    />
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 text-slate-800 hover:text-slate-900 transition-all hover:shadow-md cursor-help" title="GitHub">
                      <Github className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Twitter */}
                  <div className="flex items-center gap-2 mt-4 w-full">
                    <input
                      type="url"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      placeholder="https://twitter.com/username"
                      className="text-sm px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 w-64"
                    />
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 text-blue-500 hover:text-blue-600 transition-all hover:shadow-md cursor-help" title="Twitter">
                      <Twitter className="h-5 w-5" />
                    </div>
                  </div>

                  {/* LinkedIn */}
                  <div className="flex items-center gap-2 mt-4 w-full">
                    <input
                      type="url"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      className="text-sm px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 w-64"
                    />
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 hover:text-blue-800 transition-all hover:shadow-md cursor-help" title="LinkedIn">
                      <Linkedin className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Instagram */}
                  <div className="flex items-center gap-2 mt-4 w-full">
                    <input
                      type="url"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="https://instagram.com/username"
                      className="text-sm px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 w-64"
                    />
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-pink-50 to-rose-50 hover:from-pink-100 hover:to-rose-100 text-pink-600 hover:text-pink-700 transition-all hover:shadow-md cursor-help" title="Instagram">
                      <Instagram className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-between bg-white/50 backdrop-blur-sm border border-stone-200/50 rounded-lg px-6 py-4 sticky bottom-0">
            <p className="text-sm text-muted-foreground">Changes are auto-saved to your profile</p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate(`/profile/${user.uid}`)}
                className="border-stone-200 hover:bg-stone-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-medium"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save All Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
