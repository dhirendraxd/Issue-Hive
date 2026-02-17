import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  increment,
  arrayUnion,
  Timestamp,
  DocumentData,
  QueryConstraint,
  writeBatch,
  onSnapshot,
  deleteField,
  type Unsubscribe,
  type FieldValue,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import type { Issue } from '@/types/issue';

// Collection names
export const COLLECTIONS = {
  ISSUES: 'issues',
  USERS: 'users',
  COMMENTS: 'comments',
} as const;

// Issue CRUD operations
export const createIssue = async (issueData: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>) => {
  const now = Timestamp.now();
  const sanitizedIssueData = Object.fromEntries(
    Object.entries(issueData).filter(([, value]) => value !== undefined)
  );
  const docRef = await addDoc(collection(db, COLLECTIONS.ISSUES), {
    ...sanitizedIssueData,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
};

export const getIssue = async (id: string): Promise<Issue | null> => {
  const docRef = doc(db, COLLECTIONS.ISSUES, id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Issue;
  }
  return null;
};

export const getIssues = async (constraints: QueryConstraint[] = []): Promise<Issue[]> => {
  const q = query(collection(db, COLLECTIONS.ISSUES), ...constraints);
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Issue[];
};

// Real-time subscription for issues
export const subscribeToIssues = (
  onUpdate: (issues: Issue[]) => void,
  onError?: (error: Error) => void,
  constraints: QueryConstraint[] = []
): Unsubscribe => {
  const q = query(collection(db, COLLECTIONS.ISSUES), ...constraints);
  
  return onSnapshot(
    q,
    (snapshot) => {
      const issues = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Issue[];
      onUpdate(issues);
    },
    (error) => {
      console.error('Error in issues subscription:', error);
      if (onError) onError(error);
    }
  );
};

// Real-time subscription for a single issue
export const subscribeToIssue = (
  issueId: string,
  onUpdate: (issue: Issue | null) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const docRef = doc(db, COLLECTIONS.ISSUES, issueId);
  
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate({ id: snapshot.id, ...snapshot.data() } as Issue);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.error('Error in issue subscription:', error);
      if (onError) onError(error);
    }
  );
};

export const updateIssue = async (id: string, data: Partial<Issue>) => {
  const docRef = doc(db, COLLECTIONS.ISSUES, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
};

export const deleteIssue = async (id: string) => {
  const docRef = doc(db, COLLECTIONS.ISSUES, id);
  await deleteDoc(docRef);
};

// Comments
export interface CommentDoc {
  id: string;
  issueId: string;
  userId: string;
  userName: string;
  content: string;
  parentId?: string; // undefined for top-level, commentId for replies
  likes: number; // count of likes
  createdAt: Timestamp;
  pinnedAt?: Timestamp; // when it was pinned (undefined if not pinned)
  pinnedBy?: string; // userId of who pinned it (issue owner)
}

// Pin/Unpin a comment (only issue owner can pin)
export const pinComment = async (commentId: string, issueId: string, userId: string): Promise<'pinned' | 'unpinned'> => {
  // Get the issue to verify ownership
  const issueRef = doc(db, COLLECTIONS.ISSUES, issueId);
  const issueSnap = await getDoc(issueRef);
  
  if (!issueSnap.exists()) throw new Error('Issue not found');
  
  const issue = issueSnap.data() as Issue;
  if (issue.createdBy !== userId) {
    throw new Error('Only issue owner can pin comments');
  }
  
  // Get the comment
  const commentRef = doc(db, COLLECTIONS.COMMENTS, commentId);
  const commentSnap = await getDoc(commentRef);
  
  if (!commentSnap.exists()) throw new Error('Comment not found');
  
  const comment = commentSnap.data() as CommentDoc;
  
  // Toggle pin status
  if (comment.pinnedAt) {
    // Unpin
    await updateDoc(commentRef, {
      pinnedAt: deleteField(),
      pinnedBy: deleteField(),
    });
    return 'unpinned';
  } else {
    // Pin
    await updateDoc(commentRef, {
      pinnedAt: Timestamp.now(),
      pinnedBy: userId,
    });
    return 'pinned';
  }
};

export const createComment = async (data: Omit<CommentDoc, 'id' | 'createdAt' | 'likes'>) => {
  const now = Timestamp.now();
  const commentData: Record<string, unknown> = {
    issueId: data.issueId,
    userId: data.userId,
    userName: data.userName,
    content: data.content,
    likes: 0,
    createdAt: now,
  };
  
  // Only add parentId if it exists (for replies)
  if (data.parentId) {
    commentData.parentId = data.parentId;
  }
  
  const docRef = await addDoc(collection(db, COLLECTIONS.COMMENTS), commentData);
  return docRef.id;
};

export const getCommentsForIssue = async (issueId: string, constraints: QueryConstraint[] = []) => {
  const q = query(
    collection(db, COLLECTIONS.COMMENTS),
    where('issueId', '==', issueId),
    orderBy('createdAt', 'asc'),
    ...constraints,
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CommentDoc[];
};

// Real-time subscription for comments
export const subscribeToComments = (
  issueId: string,
  onUpdate: (comments: CommentDoc[]) => void,
  onError?: (error: Error) => void,
  constraints: QueryConstraint[] = []
): Unsubscribe => {
  const q = query(
    collection(db, COLLECTIONS.COMMENTS),
    where('issueId', '==', issueId),
    orderBy('createdAt', 'asc'),
    ...constraints
  );
  
  return onSnapshot(
    q,
    (snapshot) => {
      const comments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as CommentDoc[];
      onUpdate(comments);
    },
    (error) => {
      console.error('Error in comments subscription:', error);
      if (onError) onError(error);
    }
  );
};

// Voting system
export interface VoteDoc {
  userId: string;
  vote: 1 | -1; // 1 for upvote, -1 for downvote
  createdAt: Timestamp;
}

export const getUserVote = async (issueId: string, userId: string): Promise<VoteDoc | null> => {
  const voteRef = doc(db, COLLECTIONS.ISSUES, issueId, 'votes', userId);
  const voteSnap = await getDoc(voteRef);
  
  if (voteSnap.exists()) {
    return voteSnap.data() as VoteDoc;
  }
  return null;
};

export const setVote = async (issueId: string, userId: string, vote: 1 | -1) => {
  const batch = writeBatch(db);
  
  // Get current vote if exists
  const currentVote = await getUserVote(issueId, userId);
  const voteRef = doc(db, COLLECTIONS.ISSUES, issueId, 'votes', userId);
  const issueRef = doc(db, COLLECTIONS.ISSUES, issueId);
  
  // Get current issue vote count
  const issueSnap = await getDoc(issueRef);
  if (!issueSnap.exists()) throw new Error('Issue not found');
  
  const currentVotes = (issueSnap.data() as Issue).votes || 0;
  let newVotes = currentVotes;
  
  if (currentVote) {
    // User is changing their vote
    if (currentVote.vote === vote) {
      // Same vote - remove it (toggle off)
      batch.delete(voteRef);
      newVotes = currentVotes - vote;
    } else {
      // Different vote - update it
      batch.set(voteRef, { userId, vote, createdAt: Timestamp.now() });
      newVotes = currentVotes - currentVote.vote + vote; // Remove old, add new
    }
  } else {
    // New vote
    batch.set(voteRef, { userId, vote, createdAt: Timestamp.now() });
    newVotes = currentVotes + vote;
  }
  
  // Update issue vote count
  batch.update(issueRef, { votes: Math.max(0, newVotes), updatedAt: Timestamp.now() });
  
  await batch.commit();
  return newVotes;
};

export const removeVote = async (issueId: string, userId: string) => {
  const batch = writeBatch(db);
  
  const currentVote = await getUserVote(issueId, userId);
  if (!currentVote) return;
  
  const voteRef = doc(db, COLLECTIONS.ISSUES, issueId, 'votes', userId);
  const issueRef = doc(db, COLLECTIONS.ISSUES, issueId);
  
  const issueSnap = await getDoc(issueRef);
  if (!issueSnap.exists()) throw new Error('Issue not found');
  
  const currentVotes = (issueSnap.data() as Issue).votes || 0;
  const newVotes = Math.max(0, currentVotes - currentVote.vote);
  
  batch.delete(voteRef);
  batch.update(issueRef, { votes: newVotes, updatedAt: Timestamp.now() });
  
  await batch.commit();
};

// Get upvote and downvote counts for an issue
export const getIssueVoteCounts = async (issueId: string): Promise<{ upvotes: number; downvotes: number }> => {
  const votesRef = collection(db, COLLECTIONS.ISSUES, issueId, 'votes');
  const votesSnapshot = await getDocs(votesRef);
  
  let upvotes = 0;
  let downvotes = 0;
  
  votesSnapshot.forEach((doc) => {
    const voteData = doc.data() as VoteDoc;
    if (voteData.vote === 1) {
      upvotes++;
    } else if (voteData.vote === -1) {
      downvotes++;
    }
  });
  
  return { upvotes, downvotes };
};

// Count user's top-level comments on an issue
export const countUserTopLevelComments = async (issueId: string, userId: string): Promise<number> => {
  // Get all user comments for this issue
  const q = query(
    collection(db, COLLECTIONS.COMMENTS),
    where('issueId', '==', issueId),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  
  // Filter for top-level (those without parentId field)
  const topLevelCount = snapshot.docs.filter(doc => {
    const data = doc.data();
    return !('parentId' in data) || !data.parentId;
  }).length;
  
  return topLevelCount;
};

// Comment Likes - similar to issue votes
export interface CommentLikeDoc {
  userId: string;
  likedAt: Timestamp;
}

export const getUserCommentLike = async (commentId: string, userId: string): Promise<CommentLikeDoc | null> => {
  const likeRef = doc(db, COLLECTIONS.COMMENTS, commentId, 'likes', userId);
  const likeSnap = await getDoc(likeRef);
  
  if (likeSnap.exists()) {
    return likeSnap.data() as CommentLikeDoc;
  }
  return null;
};

export const toggleCommentLike = async (commentId: string, userId: string): Promise<'liked' | 'unliked'> => {
  const batch = writeBatch(db);
  const likeRef = doc(db, COLLECTIONS.COMMENTS, commentId, 'likes', userId);
  const commentRef = doc(db, COLLECTIONS.COMMENTS, commentId);
  
  // Check if already liked
  const existingLike = await getUserCommentLike(commentId, userId);
  
  // Get current comment like count
  const commentSnap = await getDoc(commentRef);
  if (!commentSnap.exists()) throw new Error('Comment not found');
  
  const currentLikes = (commentSnap.data() as CommentDoc).likes || 0;
  
  if (existingLike) {
    // Unlike
    const newLikes = Math.max(0, currentLikes - 1);
    batch.delete(likeRef);
    batch.update(commentRef, { likes: newLikes });
    await batch.commit();
    return 'unliked';
  } else {
    // Like
    const newLikes = currentLikes + 1;
    batch.set(likeRef, {
      userId,
      likedAt: Timestamp.now(),
    });
    batch.update(commentRef, { likes: newLikes });
    await batch.commit();
    return 'liked';
  }
};

// User Activity Analytics
export interface UserActivity {
  votedIssues: Array<{ issueId: string; vote: 1 | -1; voteDate?: Timestamp; issue?: Issue }>;
  comments: Array<CommentDoc & { issue?: Issue }>;
  likedComments: Array<{ commentId: string; comment?: CommentDoc; issue?: Issue }>;
}

export const getUserActivity = async (userId: string): Promise<UserActivity> => {
  try {
    if (!isFirebaseConfigured || !db) {
      return {
        votedIssues: [],
        comments: [],
        likedComments: [],
      };
    }
    // Get all issues user has voted on
    const issuesSnapshot = await getDocs(collection(db, COLLECTIONS.ISSUES));
    const votedIssues: Array<{ issueId: string; vote: 1 | -1; voteDate?: Timestamp; issue?: Issue }> = [];
    
    for (const issueDoc of issuesSnapshot.docs) {
      try {
        const voteDoc = await getDoc(doc(db, COLLECTIONS.ISSUES, issueDoc.id, 'votes', userId));
        if (voteDoc.exists()) {
          const voteData = voteDoc.data() as VoteDoc;
          votedIssues.push({
            issueId: issueDoc.id,
            vote: voteData.vote,
            voteDate: voteData.createdAt,
            issue: { id: issueDoc.id, ...issueDoc.data() } as Issue,
          });
        }
      } catch (err) {
        console.warn(`[getUserActivity] Failed to get vote for issue ${issueDoc.id}:`, err);
      }
    }

    // Get all comments by user
    const commentsQuery = query(
      collection(db, COLLECTIONS.COMMENTS),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const commentsSnapshot = await getDocs(commentsQuery);
    const comments: Array<CommentDoc & { issue?: Issue }> = [];
    
    for (const commentDoc of commentsSnapshot.docs) {
      try {
        const commentData = { id: commentDoc.id, ...commentDoc.data() } as CommentDoc;
        // Fetch associated issue
        const issueDoc = await getDoc(doc(db, COLLECTIONS.ISSUES, commentData.issueId));
        if (issueDoc.exists()) {
          comments.push({
            ...commentData,
            issue: { id: issueDoc.id, ...issueDoc.data() } as Issue,
          });
        } else {
          comments.push(commentData);
        }
      } catch (err) {
        console.warn(`[getUserActivity] Failed to get comment ${commentDoc.id}:`, err);
      }
    }

    // Get all comments user has liked
    const allCommentsSnapshot = await getDocs(collection(db, COLLECTIONS.COMMENTS));
    const likedComments: Array<{ commentId: string; comment?: CommentDoc; issue?: Issue }> = [];
    
    for (const commentDoc of allCommentsSnapshot.docs) {
      try {
        const likeDoc = await getDoc(doc(db, COLLECTIONS.COMMENTS, commentDoc.id, 'likes', userId));
        if (likeDoc.exists()) {
          const commentData = { id: commentDoc.id, ...commentDoc.data() } as CommentDoc;
          // Fetch associated issue
          const issueDoc = await getDoc(doc(db, COLLECTIONS.ISSUES, commentData.issueId));
          likedComments.push({
            commentId: commentDoc.id,
            comment: commentData,
            issue: issueDoc.exists() ? { id: issueDoc.id, ...issueDoc.data() } as Issue : undefined,
          });
        }
      } catch (err) {
        console.warn(`[getUserActivity] Failed to get liked comment ${commentDoc.id}:`, err);
      }
    }

    return {
      votedIssues,
      comments,
      likedComments,
    };
  } catch (error) {
    console.error('[getUserActivity] Error:', error);
    throw error;
  }
};

// Export Firestore utilities for custom queries
export { collection, query, where, orderBy, limit, increment, arrayUnion, doc, updateDoc, Timestamp, setDoc, onSnapshot };
export type { DocumentData, QueryConstraint, Unsubscribe, FieldValue };
