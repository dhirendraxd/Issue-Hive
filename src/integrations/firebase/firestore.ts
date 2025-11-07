import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  DocumentData,
  QueryConstraint,
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
  createdAt: Timestamp;
}

export const createComment = async (data: Omit<CommentDoc, 'id' | 'createdAt'>) => {
  const now = Timestamp.now();
  const docRef = await addDoc(collection(db, COLLECTIONS.COMMENTS), {
    ...data,
    createdAt: now,
  });
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

// Export Firestore utilities for custom queries
export { collection, query, where, orderBy, limit, Timestamp };
export type { DocumentData, QueryConstraint };
