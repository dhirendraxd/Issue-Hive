// Firebase Test & Setup Script
// Run this in the browser console to test Firebase and seed demo data

console.log('🔥 Firebase Test & Setup Script');
console.log('================================\n');

// Test 1: Check Firebase initialization
console.log('1️⃣ Testing Firebase initialization...');
import { auth, db, storage, analytics } from './src/integrations/firebase/config';

console.log('✅ Firebase initialized successfully!');
console.log('  - Auth:', auth ? 'Ready' : 'Not initialized');
console.log('  - Firestore:', db ? 'Ready' : 'Not initialized');
console.log('  - Storage:', storage ? 'Ready' : 'Not initialized');
console.log('  - Analytics:', analytics ? 'Ready' : 'Not initialized');
console.log('');

// Test 2: Check environment variables
console.log('2️⃣ Checking environment variables...');
const envVars = {
  'API Key': import.meta.env.VITE_FIREBASE_API_KEY?.substring(0, 10) + '...',
  'Auth Domain': import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  'Project ID': import.meta.env.VITE_FIREBASE_PROJECT_ID,
  'Storage Bucket': import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  'Messaging Sender ID': import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  'App ID': import.meta.env.VITE_FIREBASE_APP_ID?.substring(0, 20) + '...',
  'Measurement ID': import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

Object.entries(envVars).forEach(([key, value]) => {
  console.log(`  - ${key}:`, value || '❌ Missing');
});
console.log('');

// Test 3: Seed demo data
console.log('3️⃣ Ready to seed demo data!');
console.log('  Run: await seedData()');
console.log('');

async function seedData() {
  try {
    console.log('🌱 Seeding Firestore with demo data...');
    const { seedFirestoreIssues } = await import('./src/integrations/firebase/seed');
    await seedFirestoreIssues();
    console.log('✅ Demo data seeded successfully!');
    console.log('  Check Firestore Console to verify: https://console.firebase.google.com');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
}

// Test 4: Migration helper
async function migrateData() {
  try {
    console.log('🔄 Migrating localStorage to Firestore...');
    const { migrateLocalStorageToFirestore } = await import('./src/integrations/firebase/seed');
    await migrateLocalStorageToFirestore();
    console.log('✅ Migration complete!');
  } catch (error) {
    console.error('❌ Error migrating data:', error);
  }
}

// Make functions available globally
window.seedData = seedData;
window.migrateData = migrateData;

console.log('📝 Available commands:');
console.log('  - seedData()      : Seed demo issues to Firestore');
console.log('  - migrateData()   : Migrate localStorage to Firestore');
console.log('');
console.log('🎉 Firebase is ready to use!');
console.log('   Visit: http://localhost:8081');
