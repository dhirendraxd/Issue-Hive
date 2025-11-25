import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Github, Twitter, Linkedin, Instagram, Edit2, Loader2, Check, X } from 'lucide-react';
import { TabsContent } from '@/components/ui/tabs';

interface SocialLinks {
  website?: string;
  github?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
}
interface OwnerProfileLite {
  displayName?: string;
  username?: string;
  bio?: string;
  location?: string;
  pronouns?: string;
  social?: SocialLinks;
}
interface EditBasicInfoTabProps {
  ownerProfile?: OwnerProfileLite | null;
  userDisplayName?: string;
  userEmail?: string;
  // Name
  editingName: boolean;
  setEditingName: (v: boolean) => void;
  newDisplayName: string;
  setNewDisplayName: (v: string) => void;
  savingName: boolean;
  handleSaveDisplayName: () => void;
  // Username
  editingUsername: boolean;
  setEditingUsername: (v: boolean) => void;
  username: string;
  setUsername: (v: string) => void;
  savingUsername: boolean;
  handleSaveUsername: () => void;
  // Bio, location, pronouns, website & socials
  editingBio: boolean;
  setEditingBio: (v: boolean) => void;
  bio: string; setBio: (v: string) => void;
  location: string; setLocation: (v: string) => void;
  pronouns: string; setPronouns: (v: string) => void;
  website: string; setWebsite: (v: string) => void;
  github: string; setGithub: (v: string) => void;
  twitter: string; setTwitter: (v: string) => void;
  linkedin: string; setLinkedin: (v: string) => void;
  instagram: string; setInstagram: (v: string) => void;
  // Save combined profile info
  handleSaveProfileInfo: () => void;
}

const EditBasicInfoTab: React.FC<EditBasicInfoTabProps> = (props) => {
  const {
    ownerProfile,
    userDisplayName,
    userEmail,
    editingName, setEditingName, newDisplayName, setNewDisplayName, savingName, handleSaveDisplayName,
    editingUsername, setEditingUsername, username, setUsername, savingUsername, handleSaveUsername,
    editingBio, setEditingBio, bio, setBio,
    location, setLocation,
    pronouns, setPronouns,
    website, setWebsite,
    github, setGithub,
    twitter, setTwitter,
    linkedin, setLinkedin,
    instagram, setInstagram,
    handleSaveProfileInfo
  } = props;

  if (!ownerProfile) {
    return (
      <div className="space-y-4 mt-6">
        <div className="h-24 w-full rounded-xl bg-stone-100 animate-pulse" />
        <div className="h-24 w-full rounded-xl bg-stone-100 animate-pulse" />
        <div className="h-24 w-full rounded-xl bg-stone-100 animate-pulse" />
      </div>
    );
  }

  const showSaveButton = (
    editingBio ||
    location !== (ownerProfile.location || '') ||
    website !== (ownerProfile.social?.website || '') ||
    pronouns !== (ownerProfile.pronouns || '') ||
    github !== (ownerProfile.social?.github || '') ||
    twitter !== (ownerProfile.social?.twitter || '') ||
    linkedin !== (ownerProfile.social?.linkedin || '') ||
    instagram !== (ownerProfile.social?.instagram || '')
  );

  return (
    <div className="space-y-6 mt-6">
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
                  setNewDisplayName(userDisplayName || '');
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
              <p className="text-base font-medium">{userDisplayName || 'Not set'}</p>
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
                  setUsername(ownerProfile.username || '');
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
              <p className="text-base font-medium">@{ownerProfile.username || 'Not set'}</p>
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
            <p className="text-base font-medium">{userEmail || 'Not set'}</p>
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

      {showSaveButton && (
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
    </div>
  );
};

export default EditBasicInfoTab;
