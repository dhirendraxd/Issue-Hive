/**
 * Activity Tracker - Local storage-based activity logging system
 * Tracks all user activities (votes, comments, likes) and stores them locally
 */

export type ActivityType = 'upvote' | 'downvote' | 'comment' | 'reply' | 'like_comment' | 'unlike_comment' | 'remove_vote';

export interface ActivityEntry {
  id: string;
  userId: string;
  type: ActivityType;
  timestamp: number;
  data: {
    issueId?: string;
    commentId?: string;
    parentCommentId?: string;
    voteValue?: 1 | -1;
    content?: string;
  };
}

export interface ActivitySummary {
  upvotesGiven: number;
  downvotesGiven: number;
  commentsMade: number;
  repliesMade: number;
  commentsLiked: number;
  totalEngagement: number;
  activities: ActivityEntry[];
}

const STORAGE_KEY = 'user_activity_log';
const MAX_ACTIVITIES = 1000; // Keep last 1000 activities

/**
 * Get all activities for a user
 */
export function getUserActivities(userId: string): ActivityEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const allActivities: ActivityEntry[] = JSON.parse(stored);
    return allActivities.filter(a => a.userId === userId);
  } catch (error) {
    console.error('[ActivityTracker] Error reading activities:', error);
    return [];
  }
}

/**
 * Log a new activity
 */
export function logActivity(
  userId: string,
  type: ActivityType,
  data: ActivityEntry['data']
): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const allActivities: ActivityEntry[] = stored ? JSON.parse(stored) : [];
    
    const newActivity: ActivityEntry = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type,
      timestamp: Date.now(),
      data,
    };
    
    // Add new activity at the beginning
    allActivities.unshift(newActivity);
    
    // Keep only the last MAX_ACTIVITIES entries
    const trimmed = allActivities.slice(0, MAX_ACTIVITIES);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    
    console.log(`[ActivityTracker] ✅ Logged ${type}:`, data);
  } catch (error) {
    console.error('[ActivityTracker] Error logging activity:', error);
  }
}

/**
 * Calculate activity summary for a user
 */
export function getActivitySummary(userId: string): ActivitySummary {
  const activities = getUserActivities(userId);
  
  // Track current state (handle vote changes)
  const currentVotes = new Map<string, 1 | -1>(); // issueId -> vote
  const currentCommentLikes = new Set<string>(); // commentId
  
  let commentsMade = 0;
  let repliesMade = 0;
  
  // Process activities from oldest to newest to get current state
  const sortedActivities = [...activities].reverse();
  
  for (const activity of sortedActivities) {
    switch (activity.type) {
      case 'upvote':
        if (activity.data.issueId) {
          currentVotes.set(activity.data.issueId, 1);
        }
        break;
      
      case 'downvote':
        if (activity.data.issueId) {
          currentVotes.set(activity.data.issueId, -1);
        }
        break;
      
      case 'remove_vote':
        if (activity.data.issueId) {
          currentVotes.delete(activity.data.issueId);
        }
        break;
      
      case 'comment':
        commentsMade++;
        break;
      
      case 'reply':
        repliesMade++;
        break;
      
      case 'like_comment':
        if (activity.data.commentId) {
          currentCommentLikes.add(activity.data.commentId);
        }
        break;
      
      case 'unlike_comment':
        if (activity.data.commentId) {
          currentCommentLikes.delete(activity.data.commentId);
        }
        break;
    }
  }
  
  // Count upvotes and downvotes
  let upvotesGiven = 0;
  let downvotesGiven = 0;
  
  for (const vote of currentVotes.values()) {
    if (vote === 1) upvotesGiven++;
    else if (vote === -1) downvotesGiven++;
  }
  
  const commentsLiked = currentCommentLikes.size;
  const totalEngagement = upvotesGiven + downvotesGiven + commentsMade + repliesMade + commentsLiked;
  
  return {
    upvotesGiven,
    downvotesGiven,
    commentsMade,
    repliesMade,
    commentsLiked,
    totalEngagement,
    activities: activities.slice(0, 50), // Return last 50 activities
  };
}

/**
 * Clear all activities for a user (useful for testing or user request)
 */
export function clearUserActivities(userId: string): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    
    const allActivities: ActivityEntry[] = JSON.parse(stored);
    const filtered = allActivities.filter(a => a.userId !== userId);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    console.log(`[ActivityTracker] Cleared activities for user ${userId}`);
  } catch (error) {
    console.error('[ActivityTracker] Error clearing activities:', error);
  }
}

/**
 * Export activities as JSON (for backup or debugging)
 */
export function exportActivities(userId: string): string {
  const activities = getUserActivities(userId);
  return JSON.stringify(activities, null, 2);
}

/**
 * Get recent activities (for display in UI)
 */
export function getRecentActivities(userId: string, limit: number = 10): ActivityEntry[] {
  const activities = getUserActivities(userId);
  return activities.slice(0, limit);
}
