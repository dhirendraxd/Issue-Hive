import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

async function checkUsers() {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log('\n=== Current Users in Firestore ===\n');
    
    if (usersSnapshot.empty) {
      console.log('No users found in Firestore');
    } else {
      usersSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`User ID: ${doc.id}`);
        console.log(`  Display Name: ${data.displayName || 'N/A'}`);
        console.log(`  Email: ${data.email || 'N/A'}`);
        console.log(`  Username: ${data.username || 'N/A'}`);
        console.log(`  Created At: ${data.createdAt ? new Date(data.createdAt).toISOString() : 'MISSING ❌'}`);
        console.log(`  Updated At: ${data.updatedAt ? new Date(data.updatedAt).toISOString() : 'N/A'}`);
        console.log('---');
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();
