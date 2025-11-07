import { useParams, Link } from 'react-router-dom';
import { useIssuesFirebase } from '@/hooks/use-issues-firebase';
import { useAuth } from '@/hooks/use-auth';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ISSUE_STATUSES } from '@/types/issue';

export default function UserProfile() {
  const { uid } = useParams();
  const { user } = useAuth();
  const { data: issues, isLoading } = useIssuesFirebase();

  // Filter issues belonging to this user
  const owned = (issues || []).filter(i => i.createdBy === uid);
  const isOwner = user?.uid === uid;
  type WithVisibility = { visibility?: 'public' | 'private' | 'draft' };
  const publicIssues = owned.filter(i => {
    const vis = (i as unknown as WithVisibility).visibility;
    return vis !== 'private' && vis !== 'draft';
  });
  const privateCount = owned.filter(i => (i as unknown as WithVisibility).visibility === 'private').length;
  const draftCount = owned.filter(i => (i as unknown as WithVisibility).visibility === 'draft').length;

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <main className="pt-32 pb-24 px-4 mx-auto max-w-5xl">
        <div className="mb-10 flex flex-col md:flex-row md:items-end gap-4 justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">User Profile</h1>
            <p className="text-sm text-muted-foreground">Issues created by this user</p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span><strong>{owned.length}</strong> total</span>
              <span><strong>{publicIssues.length}</strong> public</span>
              <span><strong>{privateCount}</strong> private</span>
              <span><strong>{draftCount}</strong> draft</span>
              {!isOwner && (privateCount > 0 || draftCount > 0) && (
                <span className="italic">(hidden issues not listed)</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/issues"><Button variant="outline" className="rounded-full">Back to Issues</Button></Link>
            {isOwner && <Link to="/dashboard"><Button className="rounded-full">Manage</Button></Link>}
          </div>
        </div>

        {isLoading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        )}

        {!isLoading && publicIssues.length === 0 && (
          <Card className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg p-10 text-center">
            <p className="text-muted-foreground">No public issues yet.</p>
          </Card>
        )}

        {!isLoading && publicIssues.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {publicIssues.map(issue => (
              <Card key={issue.id} className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold leading-snug line-clamp-2">{issue.title}</CardTitle>
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
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
