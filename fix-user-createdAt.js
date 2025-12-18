import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDAnazLfiG1gh6LU1X4RP2LPnhJTPI-W_I",
  authDomain: "issue-hive-64473.firebaseapp.com",
  projectId: "issue-hive-64473",
  storageBucket: "issue-hive-64473.firebasestorage.app",
  messagingSenderId: "632176633299",
  appId: "1:632176633299:web:48e22f30872eeddd59eff4",
  measurementId: "G-W0ZVTXR82P"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function fixCreatedAt() {
  try {
    // Get all users from Firestore
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    console.log('\n=== Fixing createdAt for users ===\n');
    
    for (const userDoc of usersSnapshot.docs) {
      const data = userDoc.data();
      
      // Check if createdAt is missing
      if (!data.createdAt) {
        console.log(`Fixing user: ${userDoc.id}`);
        console.log(`  Email: ${data.email}`);
        
        // Use updatedAt if available, otherwise use current time
        const createdAt = data.updatedAt || Date.now();
        
        await updateDoc(doc(db, 'users', userDoc.id), {
          createdAt: createdAt
        });
        
        console.log(`  ✅ Added createdAt: ${new Date(createdAt).toISOString()}`);
      } else {
        console.log(`User ${userDoc.id} already has createdAt: ${new Date(data.createdAt).toISOString()}`);
      }
    }
    
    console.log('\n✅ All users fixed!\n');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixCreatedAt();
