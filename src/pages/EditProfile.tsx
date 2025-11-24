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
import { Loader2, Upload, X, MapPin, Globe, Github, Twitter, Linkedin, Instagram, Eye, Link2, Calendar } from 'lucide-react';
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
        displayName: user.displayName || null,
        photoURL: user.photoURL || null,
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
            <div className="rounded-2xl border border-orange-300 bg-white/80 backdrop-blur-lg overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-orange-100 to-amber-100 border-b border-orange-200">
                <p className="text-sm font-medium text-orange-900 flex items-center gap-2">
                  <Eye className="h-4 w-4" /> Visitor Preview Mode
                </p>
              </div>
              
              {/* Twitter/X Style Preview */}
              <div className="max-w-4xl mx-auto">
                {/* Cover Image */}
                <div className="relative">
                  <div className="h-48 md:h-64 w-full bg-gradient-to-br from-orange-100 via-amber-50 to-orange-50">
                    {coverPreview ? (
                      <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-orange-400/20 via-amber-400/10 to-orange-300/20" />
                    )}
                  </div>
                  
                  {/* Profile Picture Overlay */}
                  <div className="absolute -bottom-16 left-6">
                    <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
                      <AvatarImage src={user?.photoURL || getUserAvatarUrl(user?.uid || 'preview')} />
                      <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-orange-500 to-amber-500 text-white">
                        {user?.displayName?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                
                {/* Profile Info Section */}
                <div className="mt-20 px-6 pb-4 border-b border-stone-200/60">
                  <div className="mb-3">
                    <h1 className="text-2xl font-bold tracking-tight">{user?.displayName || 'User'}</h1>
                    <p className="text-sm text-muted-foreground">@{user?.displayName?.toLowerCase().replace(/\s+/g, '') || 'user'}</p>
                  </div>
                  
                  {bio && (
                    <p className="text-sm text-stone-900 mb-3 leading-relaxed">{bio}</p>
                  )}
                  
                  {/* Meta Info */}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                    {location && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" /> {location}
                      </span>
                    )}
                    {social.website && (
                      <span className="inline-flex items-center gap-1.5">
                        <Link2 className="h-4 w-4" /> 
                        {social.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" /> Joined April 2025
                    </span>
                  </div>
                  
                  {/* Social Links */}
                  {(social.github || social.twitter || social.linkedin || social.instagram) && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {social.github && (
                        <span className="text-muted-foreground" title="GitHub">
                          <Github className="h-5 w-5" />
                        </span>
                      )}
                      {social.twitter && (
                        <span className="text-muted-foreground" title="Twitter">
                          <Twitter className="h-5 w-5" />
                        </span>
                      )}
                      {social.linkedin && (
                        <span className="text-muted-foreground" title="LinkedIn">
                          <Linkedin className="h-5 w-5" />
                        </span>
                      )}
                      {social.instagram && (
                        <span className="text-muted-foreground" title="Instagram">
                          <Instagram className="h-5 w-5" />
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Follower Counts */}
                  <div className="flex gap-4 text-sm">
                    <span>
                      <span className="font-semibold text-stone-900">0</span>
                      <span className="text-muted-foreground ml-1">Following</span>
                    </span>
                    <span>
                      <span className="font-semibold text-stone-900">0</span>
                      <span className="text-muted-foreground ml-1">Followers</span>
                    </span>
                  </div>
                </div>
                
                {/* Tabs Preview */}
                <div className="border-b border-stone-200">
                  <div className="flex gap-8 px-6">
                    <button className="py-4 border-b-2 border-orange-500 text-sm font-medium">
                      Issues
                    </button>
                    <button className="py-4 border-b-2 border-transparent text-sm font-medium text-muted-foreground">
                      Analytics
                    </button>
                  </div>
                </div>
                
                {/* Issues preview */}
                <div className="p-6">
                  {publicIssues.length === 0 ? (
                    <Card className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg p-10 text-center">
                      <p className="text-muted-foreground">No public issues yet.</p>
                    </Card>
                  ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {publicIssues.slice(0, 6).map((issue) => (
                        <div key={issue.id} className="pointer-events-none opacity-90">
                          <IssueCard
                            issue={issue}
                            onSetVisibility={() => { /* disabled in preview */ }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  {publicIssues.length > 6 && (
                    <p className="text-xs text-muted-foreground mt-4 text-center">
                      Showing first 6 of {publicIssues.length} public issues
                    </p>
                  )}
                </div>
              </div>
            </div>
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
