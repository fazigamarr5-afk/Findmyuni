const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, doc, setDoc } = require('firebase/firestore');
const dotenv = require('dotenv');

// Load environment variables from .env (VITE_FIREBASE_* vars)
dotenv.config();

// Firebase configuration — read from environment, never hardcode keys in source
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('ERROR: Set VITE_FIREBASE_* env vars in scrape-my-uni/.env (see .env.example)');
  process.exit(1);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Admin user to add
const adminUser = {
  email: 'admin@findmyuni.com',
  name: 'Admin User',
  createdAt: new Date().toISOString(),
  permissions: ['users.read', 'users.write', 'universities.read', 'universities.write']
};

// Function to add admin
async function addAdmin() {
  try {
    // You can either use addDoc to generate a random ID
    const docRef = await addDoc(collection(db, 'admins'), adminUser);
    console.log(`Admin added with ID: ${docRef.id}`);
    
    // Or use setDoc with a custom ID
    // await setDoc(doc(db, 'admins', 'admin1'), adminUser);
    // console.log('Admin added with ID: admin1');
    
    process.exit(0);
  } catch (error) {
    console.error('Error adding admin:', error);
    process.exit(1);
  }
}

addAdmin(); 