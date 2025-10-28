import { collection, getDocs } from 'firebase/firestore';
import { db } from './config';
import { createIssue, COLLECTIONS } from './firestore';
import type { Issue } from '@/types/issue';

/**
 * Seed Firestore with initial demo issues
 * Only run this once when setting up a new Firebase project
 */
export async function seedFirestoreIssues() {
  // Check if issues already exist
  const issuesSnapshot = await getDocs(collection(db, COLLECTIONS.ISSUES));
  
  if (!issuesSnapshot.empty) {
    console.log('Firestore already has issues, skipping seed');
    return;
  }

  const rid = () => crypto.randomUUID();

  const seedIssues: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      title: "Extend cafeteria hours during exams",
      description: "Many students study late; having warm food options until 11 PM would help.",
      category: "Administration",
      status: "in_progress",
      votes: 34,
      user: {
        name: "Jordan Smith",
        avatar: "https://i.pravatar.cc/150?img=2&u=jordan",
      },
    },
    {
      title: "More charging stations in classrooms",
      description: "Outlets are limited and far from desks; add charging rails along walls.",
      category: "Facilities",
      status: "resolved",
      votes: 21,
      user: {
        name: "Sam Taylor",
        avatar: "https://i.pravatar.cc/150?img=3&u=sam",
      },
    },
    {
      title: "Improve lighting in parking lot",
      description: "The parking lot is very dark at night, making students feel unsafe. Better lighting would help.",
      category: "Facilities",
      status: "in_progress",
      votes: 28,
      user: {
        name: "Casey Morgan",
        avatar: "https://i.pravatar.cc/150?img=4&u=casey",
      },
    },
    {
      title: "Fix broken AC in Study Hall",
      description: "The air conditioning in Study Hall Building A stopped working; it's too hot to study.",
      category: "Facilities",
      status: "resolved",
      votes: 19,
      user: {
        name: "Riley Park",
        avatar: "https://i.pravatar.cc/150?img=5&u=riley",
      },
    },
    {
      title: "Add more online course options",
      description: "Students need more flexibility with remote learning options for elective courses.",
      category: "Academics",
      status: "received",
      votes: 42,
      user: {
        name: "Alex Chen",
        avatar: "https://i.pravatar.cc/150?img=6&u=alex",
      },
    },
    {
      title: "Weekend library hours extension",
      description: "Library closes too early on weekends. Extend hours to 10 PM on Saturdays and Sundays.",
      category: "Facilities",
      status: "in_progress",
      votes: 56,
      user: {
        name: "Morgan Davis",
        avatar: "https://i.pravatar.cc/150?img=7&u=morgan",
      },
    },
  ];

  console.log('Seeding Firestore with demo issues...');
  
  const promises = seedIssues.map(issue => createIssue(issue));
  await Promise.all(promises);
  
  console.log(`✅ Successfully seeded ${seedIssues.length} issues to Firestore`);
}

/**
 * Migrate existing localStorage issues to Firestore
 * This is a one-time migration helper
 */
export async function migrateLocalStorageToFirestore() {
  try {
    const localData = localStorage.getItem('issuehive:issues');
    if (!localData) {
      console.log('No local storage data found');
      return;
    }

    const localIssues: Issue[] = JSON.parse(localData);
    
    if (localIssues.length === 0) {
      console.log('No issues to migrate');
      return;
    }

    console.log(`Migrating ${localIssues.length} issues from localStorage to Firestore...`);

    const promises = localIssues.map(issue => {
      const { id, createdAt, updatedAt, ...issueData } = issue;
      return createIssue(issueData);
    });

    await Promise.all(promises);
    
    console.log(`✅ Successfully migrated ${localIssues.length} issues to Firestore`);
    console.log('You can now safely clear localStorage or switch to Firebase hook');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}
