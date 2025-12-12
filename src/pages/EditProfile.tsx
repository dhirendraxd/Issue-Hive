import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Save, Upload, Github, Twitter, Linkedin, Instagram, Edit2, Check, X } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '@/integrations/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateUserDisplayName, uploadProfilePicture, updateUserProfilePicture, setDefaultAvatar } from '@/integrations/firebase/profile';
import { sanitizeText, sanitizeURL, limitLength } from '@/lib/sanitize';
import { DEFAULT_AVATAR_STYLES } from '@/lib/avatar';
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
      toast.error('Failed to upload profile picture');
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
    <div className="min-h-screen bg-stone-50">
      {/* Simple header */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/profile/${user.uid}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-semibold">Edit Profile</h1>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save
          </Button>
        </div>
      </header>
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="space-y-6">
          {/* Profile Picture */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Profile Picture</h2>
            <div className="flex items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                <AvatarFallback className="text-2xl">
                  {displayName?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
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
                >
                  {uploadingAvatar ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Upload Photo
                </Button>
                <p className="text-xs text-muted-foreground">JPG, PNG, GIF or WebP. Max 5MB.</p>
              </div>
            </div>

            {/* Default Avatars */}
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-3">Or choose a default avatar:</h3>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {DEFAULT_AVATAR_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => handleSetDefaultAvatar(style.id)}
                    disabled={uploadingAvatar}
                    className="aspect-square rounded-full overflow-hidden border-2 border-stone-200 hover:border-orange-500 transition-colors disabled:opacity-50"
                  >
                    <img src={style.preview} alt={style.label} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Basic Info */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Basic Information</h2>
            
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
                  <Label>Email</Label>
                  <p className="text-xs text-muted-foreground">Your account email (managed in Firebase Auth)</p>
                </div>
                <Badge variant="outline" className="text-xs">Read-only</Badge>
              </div>
              <p className="text-base font-medium">{user.email || 'Not set'}</p>
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
          </Card>

          {/* Social Media Links */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Social Media</h2>
            <p className="text-sm text-muted-foreground">Connect your social profiles</p>

            <div className="space-y-2">
              <Label htmlFor="github" className="flex items-center gap-2">
                <Github className="h-4 w-4" />
                GitHub
              </Label>
              <Input
                id="github"
                type="url"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="https://github.com/username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitter" className="flex items-center gap-2">
                <Twitter className="h-4 w-4" />
                Twitter/X
              </Label>
              <Input
                id="twitter"
                type="url"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                placeholder="https://twitter.com/username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin" className="flex items-center gap-2">
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </Label>
              <Input
                id="linkedin"
                type="url"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram" className="flex items-center gap-2">
                <Instagram className="h-4 w-4" />
                Instagram
              </Label>
              <Input
                id="instagram"
                type="url"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="https://instagram.com/username"
              />
            </div>
          </Card>

          {/* Save Button (Bottom) */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => navigate(`/profile/${user.uid}`)}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
