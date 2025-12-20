import { useQuery } from '@tanstack/react-query';
import { db } from '@/integrations/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

export interface UserProfileDoc {
  profileVisibility?: 'public' | 'followers' | 'private';
  showPrivateToFollowers?: boolean;
  allowMessages?: boolean;
  hideDislikeCounts?: boolean;
  updatedAt?: number;
  displayName?: string;
  username?: string;
  photoURL?: string;
  coverUrl?: string | null;
  bio?: string | null;
  location?: string | null;
  college?: string | null;
  pronouns?: string | null;
  createdAt?: number | string | null;
  social?: {
    website?: string | null;
    twitter?: string | null;
    github?: string | null;
    linkedin?: string | null;
    instagram?: string | null;
  };
  stats?: {
    totalIssues?: number;
    resolvedIssues?: number;
    totalUpvotesReceived?: number;
    totalDownvotesReceived?: number;
    totalCommentsReceived?: number;
    totalSupports?: number;
    upvotesGiven?: number;
    downvotesGiven?: number;
    commentsMade?: number;
    likesGiven?: number;
  };
}

export function useUserProfile(userId?: string) {
  return useQuery({
    queryKey: ['user-profile', userId],
    enabled: !!userId && !!db,
    queryFn: async () => {
      if (!userId || !db) return null as UserProfileDoc | null;
      const snap = await getDoc(doc(db, 'users', userId));
      return snap.exists() ? (snap.data() as UserProfileDoc) : null;
    },
  });
}
