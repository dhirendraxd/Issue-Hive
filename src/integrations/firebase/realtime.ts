/**
 * Firebase Realtime Database Integration
 * Provides CRUD operations and real-time listeners for Realtime Database
 */

import { realtimeDb } from './config';
import {
  ref,
  set,
  get,
  push,
  update,
  remove,
  onValue,
  off,
  query,
  orderByChild,
  equalTo,
  limitToLast,
  DatabaseReference,
  DataSnapshot,
} from 'firebase/database';

// Types
export interface RealtimeIssue {
  id?: string;
  title: string;
  description: string;
  category: string;
  status: string;
  votes: number;
  createdBy: string;
  createdByName: string;
  createdAt: number;
  updatedAt: number;
}

export interface RealtimeNotification {
  id?: string;
  userId: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: number;
}

// Helper function to convert snapshot to array
function snapshotToArray<T>(snapshot: DataSnapshot): T[] {
  const items: T[] = [];
  snapshot.forEach((childSnapshot) => {
    items.push({
      id: childSnapshot.key,
      ...childSnapshot.val(),
    } as T);
  });
  return items;
}

/**
 * ISSUES OPERATIONS
 */

// Create a new issue
export async function createRealtimeIssue(issue: Omit<RealtimeIssue, 'id' | 'createdAt' | 'updatedAt'>) {
  const issuesRef = ref(realtimeDb, 'issues');
  const newIssueRef = push(issuesRef);
  
  const timestamp = Date.now();
  const issueData = {
    ...issue,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  
  await set(newIssueRef, issueData);
  return { id: newIssueRef.key, ...issueData };
}

// Get all issues
export async function getRealtimeIssues(): Promise<RealtimeIssue[]> {
  const issuesRef = ref(realtimeDb, 'issues');
  const snapshot = await get(issuesRef);
  
  if (!snapshot.exists()) {
    return [];
  }
  
  return snapshotToArray<RealtimeIssue>(snapshot);
}

// Get issues by status
export async function getRealtimeIssuesByStatus(status: string): Promise<RealtimeIssue[]> {
  const issuesRef = ref(realtimeDb, 'issues');
  const issuesQuery = query(issuesRef, orderByChild('status'), equalTo(status));
  const snapshot = await get(issuesQuery);
  
  if (!snapshot.exists()) {
    return [];
  }
  
  return snapshotToArray<RealtimeIssue>(snapshot);
}

// Get issues by user
export async function getRealtimeIssuesByUser(userId: string): Promise<RealtimeIssue[]> {
  const issuesRef = ref(realtimeDb, 'issues');
  const issuesQuery = query(issuesRef, orderByChild('createdBy'), equalTo(userId));
  const snapshot = await get(issuesQuery);
  
  if (!snapshot.exists()) {
    return [];
  }
  
  return snapshotToArray<RealtimeIssue>(snapshot);
}

// Update an issue
export async function updateRealtimeIssue(issueId: string, updates: Partial<RealtimeIssue>) {
  const issueRef = ref(realtimeDb, `issues/${issueId}`);
  const updateData = {
    ...updates,
    updatedAt: Date.now(),
  };
  
  await update(issueRef, updateData);
}

// Delete an issue
export async function deleteRealtimeIssue(issueId: string) {
  const issueRef = ref(realtimeDb, `issues/${issueId}`);
  await remove(issueRef);
}

// Increment vote count
export async function incrementRealtimeIssueVotes(issueId: string) {
  const issueRef = ref(realtimeDb, `issues/${issueId}`);
  const snapshot = await get(issueRef);
  
  if (snapshot.exists()) {
    const currentVotes = snapshot.val().votes || 0;
    await update(issueRef, {
      votes: currentVotes + 1,
      updatedAt: Date.now(),
    });
  }
}

/**
 * REAL-TIME LISTENERS
 */

// Listen to all issues in real-time
export function subscribeToRealtimeIssues(
  callback: (issues: RealtimeIssue[]) => void,
  onError?: (error: Error) => void
): () => void {
  const issuesRef = ref(realtimeDb, 'issues');
  
  const unsubscribe = onValue(
    issuesRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const issues = snapshotToArray<RealtimeIssue>(snapshot);
        callback(issues);
      } else {
        callback([]);
      }
    },
    (error) => {
      console.error('Error listening to issues:', error);
      if (onError) onError(error);
    }
  );
  
  // Return cleanup function
  return () => off(issuesRef);
}

// Listen to a specific issue
export function subscribeToRealtimeIssue(
  issueId: string,
  callback: (issue: RealtimeIssue | null) => void,
  onError?: (error: Error) => void
): () => void {
  const issueRef = ref(realtimeDb, `issues/${issueId}`);
  
  const unsubscribe = onValue(
    issueRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.key, ...snapshot.val() } as RealtimeIssue);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Error listening to issue:', error);
      if (onError) onError(error);
    }
  );
  
  return () => off(issueRef);
}

/**
 * NOTIFICATIONS OPERATIONS
 */

// Create a notification
export async function createNotification(notification: Omit<RealtimeNotification, 'id' | 'createdAt'>) {
  const notificationsRef = ref(realtimeDb, 'notifications');
  const newNotificationRef = push(notificationsRef);
  
  const notificationData = {
    ...notification,
    createdAt: Date.now(),
  };
  
  await set(newNotificationRef, notificationData);
  return { id: newNotificationRef.key, ...notificationData };
}

// Get user notifications
export async function getUserNotifications(userId: string): Promise<RealtimeNotification[]> {
  const notificationsRef = ref(realtimeDb, 'notifications');
  const notificationsQuery = query(
    notificationsRef,
    orderByChild('userId'),
    equalTo(userId),
    limitToLast(50)
  );
  
  const snapshot = await get(notificationsQuery);
  
  if (!snapshot.exists()) {
    return [];
  }
  
  return snapshotToArray<RealtimeNotification>(snapshot);
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string) {
  const notificationRef = ref(realtimeDb, `notifications/${notificationId}`);
  await update(notificationRef, { read: true });
}

// Subscribe to user notifications
export function subscribeToUserNotifications(
  userId: string,
  callback: (notifications: RealtimeNotification[]) => void,
  onError?: (error: Error) => void
): () => void {
  const notificationsRef = ref(realtimeDb, 'notifications');
  const notificationsQuery = query(notificationsRef, orderByChild('userId'), equalTo(userId));
  
  const unsubscribe = onValue(
    notificationsQuery,
    (snapshot) => {
      if (snapshot.exists()) {
        const notifications = snapshotToArray<RealtimeNotification>(snapshot);
        callback(notifications);
      } else {
        callback([]);
      }
    },
    (error) => {
      console.error('Error listening to notifications:', error);
      if (onError) onError(error);
    }
  );
  
  return () => off(notificationsRef);
}

/**
 * PRESENCE SYSTEM (Online/Offline tracking)
 */

// Track user online status
export async function setUserOnlineStatus(userId: string, isOnline: boolean) {
  const userStatusRef = ref(realtimeDb, `status/${userId}`);
  await set(userStatusRef, {
    online: isOnline,
    lastSeen: Date.now(),
  });
}

// Subscribe to user online status
export function subscribeToUserStatus(
  userId: string,
  callback: (isOnline: boolean, lastSeen: number) => void
): () => void {
  const userStatusRef = ref(realtimeDb, `status/${userId}`);
  
  const unsubscribe = onValue(userStatusRef, (snapshot) => {
    if (snapshot.exists()) {
      const { online, lastSeen } = snapshot.val();
      callback(online, lastSeen);
    } else {
      callback(false, Date.now());
    }
  });
  
  return () => off(userStatusRef);
}

/**
 * LIVE CHAT / COMMENTS
 */

export interface RealtimeComment {
  id?: string;
  issueId: string;
  userId: string;
  userName: string;
  message: string;
  createdAt: number;
}

// Add a comment to an issue
export async function addRealtimeComment(comment: Omit<RealtimeComment, 'id' | 'createdAt'>) {
  const commentsRef = ref(realtimeDb, `comments/${comment.issueId}`);
  const newCommentRef = push(commentsRef);
  
  const commentData = {
    ...comment,
    createdAt: Date.now(),
  };
  
  await set(newCommentRef, commentData);
  return { id: newCommentRef.key, ...commentData };
}

// Subscribe to issue comments
export function subscribeToIssueComments(
  issueId: string,
  callback: (comments: RealtimeComment[]) => void
): () => void {
  const commentsRef = ref(realtimeDb, `comments/${issueId}`);
  
  const unsubscribe = onValue(commentsRef, (snapshot) => {
    if (snapshot.exists()) {
      const comments = snapshotToArray<RealtimeComment>(snapshot);
      callback(comments.sort((a, b) => a.createdAt - b.createdAt));
    } else {
      callback([]);
    }
  });
  
  return () => off(commentsRef);
}
