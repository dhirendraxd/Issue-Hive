import { useState } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/integrations/firebase/config';
import { useAuth } from '@/hooks/use-auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export type ProfileVisibility = 'public' | 'followers' | 'private';

export default function ProfileVisibilitySettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [visibility, setVisibility] = useState<ProfileVisibility>('public');
  const [sharePrivateIssues, setSharePrivateIssues] = useState(false);
  const [allowMessages, setAllowMessages] = useState(true);
  const [hideDislikeCounts, setHideDislikeCounts] = useState(false);

  async function load() {
    if (!user || !db) return;
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      if (data.profileVisibility) setVisibility(data.profileVisibility);
      if (typeof data.showPrivateToFollowers === 'boolean') setSharePrivateIssues(data.showPrivateToFollowers);
      if (typeof data.allowMessages === 'boolean') setAllowMessages(data.allowMessages);
      if (typeof data.hideDislikeCounts === 'boolean') setHideDislikeCounts(data.hideDislikeCounts);
    }
  }

  async function save() {
    if (!user || !db) return;
    setLoading(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        profileVisibility: visibility,
        showPrivateToFollowers: sharePrivateIssues,
        allowMessages,
        hideDislikeCounts,
        updatedAt: Date.now()
      }, { merge: true });
      toast.success('Profile visibility updated');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Visibility & Privacy</h3>
        <Button variant="outline" size="sm" onClick={load}>Reload</Button>
      </div>
      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-sm">Profile Visibility</Label>
          <Select value={visibility} onValueChange={(v) => setVisibility(v as ProfileVisibility)}>
            <SelectTrigger className="w-60">
              <SelectValue placeholder="Select visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public (everyone)</SelectItem>
              <SelectItem value="followers">Followers only</SelectItem>
              <SelectItem value="private">Private (only you)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between py-2">
          <Label htmlFor="privateIssues" className="text-sm">Allow followers to see private issues</Label>
          <Switch id="privateIssues" checked={sharePrivateIssues} onCheckedChange={setSharePrivateIssues} />
        </div>
        <div className="flex items-center justify-between py-2">
          <Label htmlFor="messages" className="text-sm">Allow direct messages</Label>
          <Switch id="messages" checked={allowMessages} onCheckedChange={setAllowMessages} />
        </div>
        <div className="flex items-center justify-between py-2">
          <Label htmlFor="hideDislikes" className="text-sm">Hide dislike counts on my issues</Label>
          <Switch id="hideDislikes" checked={hideDislikeCounts} onCheckedChange={setHideDislikeCounts} />
        </div>
      </div>
      <Button disabled={loading} onClick={save} className="rounded-full bg-gradient-to-r from-orange-500 to-amber-500">
        {loading ? 'Saving...' : 'Save Settings'}
      </Button>
    </Card>
  );
}
