import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/integrations/firebase/config';
import { COLLECTIONS } from '@/integrations/firebase/firestore';

export interface IssueEngagementMetrics {
  issueId: string;
  comments: number;
  commentLikes: number; // sum of likes counts across comments
}

export function useIssueEngagement(issueIds: string[] | undefined) {
  const enabled = isFirebaseConfigured && !!issueIds && issueIds.length > 0;

  return useQuery<{ [id: string]: IssueEngagementMetrics }>({
    queryKey: ['issue-engagement', issueIds],
    enabled,
    staleTime: 30000,
    queryFn: async () => {
      if (!enabled || !db) return {};
      const results: { [id: string]: IssueEngagementMetrics } = {};
      await Promise.all(
        issueIds!.map(async (id) => {
          try {
            const q = query(collection(db, COLLECTIONS.COMMENTS), where('issueId', '==', id));
            const snap = await getDocs(q);
            let comments = 0;
            let commentLikes = 0;
            snap.docs.forEach(d => {
              comments += 1;
              const data = d.data() as { likes?: number };
              commentLikes += data.likes || 0;
            });
            results[id] = { issueId: id, comments, commentLikes };
          } catch (e) {
            // On error keep it absent; could add logging
            results[id] = { issueId: id, comments: 0, commentLikes: 0 };
          }
        })
      );
      return results;
    },
  });
}
