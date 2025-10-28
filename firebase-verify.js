/**
 * Firebase Setup Verification Script
 * Run this to verify your Firebase configuration after enabling services
 * 
 * Usage in browser console:
 *   Copy and paste this entire file, or run individual test functions
 */

console.log('🔥 Firebase Setup Verification');
console.log('================================\n');

// Import Firebase services
import { auth, db, storage, analytics } from './src/integrations/firebase/config.ts';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, getDocs, query, limit } from 'firebase/firestore';

// Test 1: Check service initialization
export async function testServices() {
  console.log('1️⃣  Testing Firebase Services...\n');
  
  const results = {
    auth: !!auth,
    firestore: !!db,
    storage: !!storage,
    analytics: !!analytics,
  };
  
  console.log('Service Status:');
  Object.entries(results).forEach(([service, status]) => {
    console.log(`  ${status ? '✅' : '❌'} ${service}: ${status ? 'Ready' : 'Not initialized'}`);
  });
  
  const allReady = Object.values(results).every(v => v);
  console.log(`\n${allReady ? '✅' : '❌'} All services: ${allReady ? 'Ready' : 'Some services not initialized'}\n`);
  
  return results;
}

// Test 2: Check Firestore connection
export async function testFirestore() {
  console.log('2️⃣  Testing Firestore Connection...\n');
  
  try {
    // Try to read from issues collection
    const issuesRef = collection(db, 'issues');
    const q = query(issuesRef, limit(1));
    const snapshot = await getDocs(q);
    
    console.log('✅ Firestore connected successfully!');
    console.log(`   Found ${snapshot.size} issue(s) in database`);
    console.log('   Collection: issues\n');
    
    return { success: true, count: snapshot.size };
  } catch (error) {
    console.error('❌ Firestore connection failed:');
    console.error('   Error:', error.message);
    console.error('\n   Possible issues:');
    console.error('   - Firestore not enabled in Firebase Console');
    console.error('   - Security rules too restrictive');
    console.error('   - Network connection issue\n');
    
    return { success: false, error: error.message };
  }
}

// Test 3: Test authentication (optional - creates test user)
export async function testAuth() {
  console.log('3️⃣  Testing Authentication...\n');
  
  console.log('Current auth state:', auth.currentUser ? `Signed in as ${auth.currentUser.email}` : 'Not signed in');
  console.log('\nTo test auth, run:');
  console.log('  - testSignUp("test@example.com", "password123")');
  console.log('  - testSignIn("test@example.com", "password123")');
  console.log('  - auth.signOut()\n');
  
  return { user: auth.currentUser };
}

// Test 4: Seed demo data
export async function seedDemoData() {
  console.log('4️⃣  Seeding Demo Data...\n');
  
  try {
    const { seedFirestoreIssues } = await import('./src/integrations/firebase/seed.ts');
    await seedFirestoreIssues();
    console.log('✅ Demo data seeded successfully!\n');
    return { success: true };
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.error('\n   This might be because:');
    console.error('   - Issues already exist (check Firestore Console)');
    console.error('   - Authentication required by security rules');
    console.error('   - Permission denied\n');
    return { success: false, error: error.message };
  }
}

// Helper: Sign up test user
export async function testSignUp(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('✅ Sign up successful!');
    console.log('   User:', userCredential.user.email);
    console.log('   UID:', userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error('❌ Sign up failed:', error.message);
    if (error.code === 'auth/email-already-in-use') {
      console.log('   Try signing in instead: testSignIn("' + email + '", "' + password + '")');
    }
    throw error;
  }
}

// Helper: Sign in test user
export async function testSignIn(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Sign in successful!');
    console.log('   User:', userCredential.user.email);
    console.log('   UID:', userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error('❌ Sign in failed:', error.message);
    throw error;
  }
}

// Helper: Test creating an issue
export async function testCreateIssue() {
  console.log('5️⃣  Testing Issue Creation...\n');
  
  if (!auth.currentUser) {
    console.error('❌ Not signed in. Sign in first:');
    console.log('   testSignIn("email@example.com", "password")\n');
    return { success: false, error: 'Not authenticated' };
  }
  
  try {
    const { createIssue } = await import('./src/integrations/firebase/firestore.ts');
    
    const issueId = await createIssue({
      title: 'Test Issue',
      description: 'This is a test issue created via verification script',
      category: 'Other',
      status: 'received',
      votes: 0,
    });
    
    console.log('✅ Issue created successfully!');
    console.log('   Issue ID:', issueId);
    console.log('   Check Firestore Console to verify\n');
    
    return { success: true, issueId };
  } catch (error) {
    console.error('❌ Issue creation failed:', error.message);
    console.error('\n   Possible issues:');
    console.error('   - Security rules require authentication');
    console.error('   - Missing required fields');
    console.error('   - Permission denied\n');
    
    return { success: false, error: error.message };
  }
}

// Run all tests
export async function runAllTests() {
  console.log('🚀 Running All Firebase Tests\n');
  console.log('================================\n');
  
  const results = {};
  
  results.services = await testServices();
  results.firestore = await testFirestore();
  results.auth = await testAuth();
  
  console.log('\n📊 Test Summary');
  console.log('================================');
  console.log('Services:', results.services.auth && results.services.firestore ? '✅ OK' : '❌ Failed');
  console.log('Firestore:', results.firestore.success ? '✅ OK' : '❌ Failed');
  console.log('Auth:', '✅ Ready (manual test required)');
  
  console.log('\n💡 Next Steps:');
  if (!results.firestore.success) {
    console.log('1. Enable Firestore in Firebase Console');
    console.log('2. Update security rules (see firestore.rules file)');
  } else if (results.firestore.count === 0) {
    console.log('1. Seed demo data: await seedDemoData()');
    console.log('2. Or create issue: await testSignUp("test@test.com", "password123") then await testCreateIssue()');
  } else {
    console.log('✅ Everything looks good! Start using Firebase in your app.');
    console.log('   Update components to use: import { useIssuesFirebase as useIssues }');
  }
  
  console.log('\nFirebase Console: https://console.firebase.google.com/project/issue-hive-64473');
  console.log('');
  
  return results;
}

// Auto-run on load
console.log('Available test functions:');
console.log('  - runAllTests()       : Run all verification tests');
console.log('  - testServices()      : Check service initialization');
console.log('  - testFirestore()     : Test Firestore connection');
console.log('  - testAuth()          : Check auth status');
console.log('  - seedDemoData()      : Seed demo issues');
console.log('  - testSignUp(email, password)   : Create test user');
console.log('  - testSignIn(email, password)   : Sign in test user');
console.log('  - testCreateIssue()   : Create a test issue');
console.log('\nRun: await runAllTests()');
console.log('');

// Make functions available globally
if (typeof window !== 'undefined') {
  window.runAllTests = runAllTests;
  window.testServices = testServices;
  window.testFirestore = testFirestore;
  window.testAuth = testAuth;
  window.seedDemoData = seedDemoData;
  window.testSignUp = testSignUp;
  window.testSignIn = testSignIn;
  window.testCreateIssue = testCreateIssue;
}
