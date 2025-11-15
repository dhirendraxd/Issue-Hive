import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/integrations/firebase/config';
import { COLLECTIONS } from '@/integrations/firebase/firestore';

export interface VoteInfo {
  userId: string;
  vote: 1 | -1;
  createdAt: any;
}

export function useIssueVotes(issueId?: string) {
  return useQuery<VoteInfo[]>({
    queryKey: ['issue-votes', issueId],
    enabled: isFirebaseConfigured && !!issueId,
    queryFn: async () => {
      if (!issueId) return [];
      const q = query(
        collection(db, COLLECTIONS.ISSUES, issueId, 'votes'),
        orderBy('createdAt', 'asc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as VoteInfo);
    },
    staleTime: 30000,
  });
}
