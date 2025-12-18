import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';

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

const USER_ID = '1B2CYbVTBbbnLVl8vcWTk44jhQv2';

async function main() {
  const ref = doc(db, 'users', USER_ID);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    console.log('User doc missing');
    return;
  }
  const data = snap.data();
  const updatedAt = data.updatedAt;
  const createdAtValue = updatedAt?.toMillis ? updatedAt.toMillis() : updatedAt || Date.now();
  await updateDoc(ref, { createdAt: createdAtValue });
  console.log('createdAt set to', new Date(createdAtValue).toISOString());
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
