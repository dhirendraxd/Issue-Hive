import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/integrations/firebase/config';
import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';

export function useIsFollowing(targetUserId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['is-following', user?.uid, targetUserId],
    enabled: !!user && !!targetUserId && !!db,
    queryFn: async () => {
      if (!user || !targetUserId || !db) return false;
      const d = doc(db, 'users', user.uid, 'following', targetUserId);
      const snap = await getDoc(d);
      return snap.exists();
    }
  });
}

export function useFollowCounts(userId?: string) {
  return useQuery({
    queryKey: ['follow-counts', userId],
    enabled: !!userId && !!db,
    queryFn: async () => {
      if (!userId || !db) return { followers: 0, following: 0 };
      
      // Import collection and getDocs to count subcollection documents
      const { collection, getDocs } = await import('firebase/firestore');
      
      // Count followers
      const followersSnap = await getDocs(collection(db, 'users', userId, 'followers'));
      const followers = followersSnap.size;
      
      // Count following
      const followingSnap = await getDocs(collection(db, 'users', userId, 'following'));
      const following = followingSnap.size;
      
      return { followers, following };
    }
  });
}

export function useFollowUser() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user || !db) throw new Error('Not signed in or DB missing');
      if (targetUserId === user.uid) throw new Error('Cannot follow yourself');
      await setDoc(doc(db, 'users', targetUserId, 'followers', user.uid), { followedAt: Date.now() });
      await setDoc(doc(db, 'users', user.uid, 'following', targetUserId), { followedAt: Date.now() });
    },
    onSuccess: (_,_targetUserId) => {
      qc.invalidateQueries({ queryKey: ['is-following'] });
      qc.invalidateQueries({ queryKey: ['follow-counts'] });
    }
  });
}

export function useUnfollowUser() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user || !db) throw new Error('Not signed in or DB missing');
      await deleteDoc(doc(db, 'users', targetUserId, 'followers', user.uid));
      await deleteDoc(doc(db, 'users', user.uid, 'following', targetUserId));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['is-following'] });
      qc.invalidateQueries({ queryKey: ['follow-counts'] });
    }
  });
}
