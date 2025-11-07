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
  Timestamp,
  DocumentData,
  QueryConstraint,
  writeBatch,
} from 'firebase/firestore';
import { db } from './config';
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
  const docRef = await addDoc(collection(db, COLLECTIONS.ISSUES), {
    ...issueData,
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
  createdAt: Timestamp;
}

export const createComment = async (data: Omit<CommentDoc, 'id' | 'createdAt'>) => {
  const now = Timestamp.now();
  const commentData: Record<string, unknown> = {
    issueId: data.issueId,
    userId: data.userId,
    userName: data.userName,
    content: data.content,
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

// Export Firestore utilities for custom queries
export { collection, query, where, orderBy, limit, Timestamp, setDoc };
export type { DocumentData, QueryConstraint };
