import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import Navbar from '@/components/Navbar';
import ParticlesBackground from '@/components/ParticlesBackground';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { db } from '@/integrations/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import ProfileVisibilitySettings from '@/components/ProfileVisibilitySettings';
import { Loader2, Upload, X, MapPin, Globe, Github, Twitter, Linkedin, Instagram, Eye } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getUserAvatarUrl } from '@/lib/avatar';
import { useIssuesFirebase } from '@/hooks/use-issues-firebase';
import IssueCard from '@/components/IssueCard';
import type { Issue } from '@/types/issue';

type SocialLinks = {
  website?: string;
  twitter?: string;
  github?: string;
  linkedin?: string;
  instagram?: string;
};

function normalizeUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export default function EditProfile() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string>('');
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [social, setSocial] = useState<SocialLinks>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const { data: issues, setVisibility } = useIssuesFirebase();
  const ownedIssues: Issue[] = useMemo(() => {
    const list = (issues as Issue[]) || [];
    return user ? list.filter(i => i.createdBy === user.uid) : [];
  }, [issues, user]);
  const publicIssues = useMemo(() => ownedIssues.filter(i => (i as any).visibility === 'public'), [ownedIssues]);

  const canUse = useMemo(() => !!user && !!db, [user]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    async function load() {
      if (!user || !db) return;
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const data = snap.data() as any;
        setCoverUrl(data.coverUrl || '');
        setCoverPreview(data.coverUrl || '');
        setBio(data.bio || '');
        setLocation(data.location || '');
        setSocial({
          website: data.social?.website || '',
          twitter: data.social?.twitter || '',
          github: data.social?.github || '',
          linkedin: data.social?.linkedin || '',
          instagram: data.social?.instagram || '',
        });
      }
    }
    load();
  }, [user]);

  const onCoverFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Cover must be JPEG/PNG/WebP');
      return;
    }
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast.error('Cover image too large (max 2MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCoverPreview(dataUrl);
      setCoverUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!user || !db) return;
    setSaving(true);
    try {
      const payload = {
        coverUrl: coverUrl || null,
        bio: bio?.trim() || null,
        location: location?.trim() || null,
        social: {
          website: social.website ? normalizeUrl(social.website) : null,
          twitter: social.twitter ? normalizeUrl(social.twitter) : null,
          github: social.github ? normalizeUrl(social.github) : null,
          linkedin: social.linkedin ? normalizeUrl(social.linkedin) : null,
          instagram: social.instagram ? normalizeUrl(social.instagram) : null,
        },
        updatedAt: Date.now(),
      } as const;
      await setDoc(doc(db, 'users', user.uid), payload, { merge: true });
      toast.success('Profile updated');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-stone-50">
      <Navbar />
      <ParticlesBackground fullPage hexOpacity={0.1}>
        <div />
      </ParticlesBackground>
      <main className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-24">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-semibold tracking-tight">Edit Public Profile</h1>
            <p className="text-muted-foreground mt-1">Customize cover, bio, and social links</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setPreviewOpen(v => !v)}>
              <Eye className="h-4 w-4 mr-2" /> {previewOpen ? 'Hide' : 'Preview'} as visitor
            </Button>
            <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
            <Button onClick={save} disabled={!canUse || saving} className="bg-gradient-to-r from-orange-500 to-amber-500">
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving</> : 'Save Changes'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {previewOpen && (
            <Card className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg p-0 overflow-hidden">
              {/* Preview Cover */}
              {coverPreview ? (
                <div className="w-full h-40 md:h-56">
                  <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-full h-24 bg-gradient-to-r from-orange-50 to-amber-50 border-b" />
              )}
              {/* Preview Header */}
              <div className="p-6">
                <div className="flex items-center gap-4">
                  {user && (
                    <Avatar className="w-16 h-16 border-2 border-orange-200">
                      <AvatarImage src={user.photoURL || getUserAvatarUrl(user.uid)} alt={user.displayName || 'User'} />
                      <AvatarFallback className="bg-orange-100 text-orange-900">
                        {(user.displayName || user.email || 'U')?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="min-w-0">
                    <h2 className="text-xl font-semibold truncate">{user?.displayName || 'IssueHive User'}</h2>
                    {location && (
                      <div className="text-xs text-stone-600 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3.5 w-3.5" /> {location}
                      </div>
                    )}
                  </div>
                </div>
                {bio && (
                  <p className="mt-3 text-sm text-stone-700 whitespace-pre-wrap">{bio}</p>
                )}
                {/* Socials */}
                {(social.website || social.github || social.twitter || social.linkedin || social.instagram) && (
                  <div className="mt-4 flex flex-wrap gap-3 text-sm">
                    {social.website && (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white/60 backdrop-blur">
                        <Globe className="h-4 w-4" /> Website
                      </span>
                    )}
                    {social.github && (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white/60 backdrop-blur">
                        <Github className="h-4 w-4" /> GitHub
                      </span>
                    )}
                    {social.twitter && (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white/60 backdrop-blur">
                        <Twitter className="h-4 w-4" /> Twitter
                      </span>
                    )}
                    {social.linkedin && (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white/60 backdrop-blur">
                        <Linkedin className="h-4 w-4" /> LinkedIn
                      </span>
                    )}
                    {social.instagram && (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white/60 backdrop-blur">
                        <Instagram className="h-4 w-4" /> Instagram
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Issues preview as seen by visitors */}
              <div className="px-6 pb-6">
                <h3 className="font-semibold text-lg mb-3">Issues (visitor view)</h3>
                {publicIssues.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No public issues yet.</p>
                ) : (
                  <div className="space-y-3">
                    {publicIssues.slice(0, 6).map((issue) => (
                      <div key={issue.id} className="pointer-events-none">
                        <IssueCard
                          issue={issue}
                          onSetVisibility={() => { /* disabled in preview */ }}
                        />
                      </div>
                    ))}
                    {publicIssues.length > 6 && (
                      <p className="text-xs text-muted-foreground mt-1">Showing first 6 issues</p>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}
          {/* Cover Image */}
          <Card className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">Cover Image</h3>
                <p className="text-sm text-muted-foreground">Shown at the top of your public profile</p>
              </div>
              {coverPreview && (
                <Button variant="ghost" size="sm" onClick={() => { setCoverPreview(''); setCoverUrl(''); }}>
                  <X className="h-4 w-4 mr-1" /> Remove
                </Button>
              )}
            </div>
            <div className="space-y-4">
              {coverPreview ? (
                <div className="w-full h-48 rounded-xl overflow-hidden border bg-stone-100">
                  <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-full h-48 rounded-xl border border-dashed flex items-center justify-center text-sm text-muted-foreground bg-white/40">
                  No cover selected
                </div>
              )}
              <div>
                <Label htmlFor="cover">Upload new cover</Label>
                <Input id="cover" type="file" accept="image/jpeg,image/png,image/webp" onChange={onCoverFile} />
                <p className="text-xs text-muted-foreground mt-1 flex items-center"><Upload className="h-3.5 w-3.5 mr-1" /> Max 2MB. JPG/PNG/WebP.</p>
              </div>
            </div>
          </Card>

          {/* Bio & Location */}
          <Card className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg p-6">
            <h3 className="font-semibold text-lg mb-4">About You</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell people about yourself" className="mt-1" rows={4} maxLength={300} />
                <p className="text-xs text-muted-foreground mt-1">Up to 300 characters</p>
              </div>
              <div className="md:col-span-1">
                <Label htmlFor="location">Location</Label>
                <Input id="location" value={location} onChange={e => setLocation(e.target.value)} placeholder="City, Country" className="mt-1" maxLength={80} />
              </div>
            </div>
          </Card>

          {/* Social Links */}
          <Card className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg p-6">
            <h3 className="font-semibold text-lg mb-4">Social Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="website">Website</Label>
                <Input id="website" placeholder="yourdomain.com" value={social.website || ''} onChange={e => setSocial(s => ({ ...s, website: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="twitter">Twitter/X</Label>
                <Input id="twitter" placeholder="twitter.com/username" value={social.twitter || ''} onChange={e => setSocial(s => ({ ...s, twitter: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="github">GitHub</Label>
                <Input id="github" placeholder="github.com/username" value={social.github || ''} onChange={e => setSocial(s => ({ ...s, github: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input id="linkedin" placeholder="linkedin.com/in/username" value={social.linkedin || ''} onChange={e => setSocial(s => ({ ...s, linkedin: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="instagram">Instagram</Label>
                <Input id="instagram" placeholder="instagram.com/username" value={social.instagram || ''} onChange={e => setSocial(s => ({ ...s, instagram: e.target.value }))} />
              </div>
            </div>
          </Card>

          {/* Visibility & Privacy */}
          <ProfileVisibilitySettings />

          {/* Manage Issues Visibility */}
          <Card className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">Manage Issues Visibility</h3>
                <p className="text-sm text-muted-foreground">Choose which of your issues are visible on your public profile.</p>
              </div>
            </div>
            {ownedIssues.length === 0 ? (
              <p className="text-sm text-muted-foreground">You don't have any issues yet.</p>
            ) : (
              <div className="space-y-3">
                {ownedIssues.map((issue) => (
                  <Card key={issue.id} className="glass-card">
                    <IssueCard
                      issue={issue}
                      onSetVisibility={(id, visibility) => setVisibility.mutate({ id, visibility })}
                    />
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
