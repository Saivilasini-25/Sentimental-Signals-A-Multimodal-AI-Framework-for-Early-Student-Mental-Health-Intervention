import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
   apiKey: "AIzaSyBzl4gSGUb-1aIsQslD5FRu7lhF-xU4XmE",
  authDomain: "mental-health-detector-web.firebaseapp.com",
  projectId: "mental-health-detector-web",
  storageBucket: "mental-health-detector-web.firebasestorage.app",
  messagingSenderId: "710761471544",
  appId: "1:710761471544:web:d57362953c08c42938d0cd",
 measurementId: "G-ZP1KDCL4L3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
const analytics = getAnalytics(app);
