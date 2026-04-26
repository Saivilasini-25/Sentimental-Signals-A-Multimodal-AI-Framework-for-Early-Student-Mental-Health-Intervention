// src/services/firestoreService.js
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase';

// Save a PHQ-9 test result for a user
export const savePhqResult = async (uid, score, risk) => {
  const colRef = collection(db, 'users', uid, 'phqResults');
  await addDoc(colRef, {
    score,
    risk,
    createdAt: new Date().toISOString()
  });
};

// Get latest single PHQ-9 result
export const getLatestPhqResult = async (uid) => {
  const colRef = collection(db, 'users', uid, 'phqResults');
  const q = query(colRef, orderBy('createdAt', 'desc'), limit(1)); // [web:248][web:252]
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
};

// Get multiple latest PHQ-9 results (for dashboard history)
export const getLatestPhqResults = async (uid, n = 3) => {
  const colRef = collection(db, 'users', uid, 'phqResults');
  const q = query(colRef, orderBy('createdAt', 'desc'), limit(n)); // [web:248][web:252]
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// Save a mood journal entry with AI result
export const saveJournalEntry = async (uid, text, label, score) => {
  const colRef = collection(db, 'users', uid, 'journalEntries');
  await addDoc(colRef, {
    text,
    label,
    score,
    createdAt: new Date().toISOString()
  });
};

// Get latest single journal entry
export const getLatestJournalEntry = async (uid) => {
  const colRef = collection(db, 'users', uid, 'journalEntries');
  const q = query(colRef, orderBy('createdAt', 'desc'), limit(1)); // [web:248][web:252]
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
};

// Get mood history (last N entries) for dashboard/chart
export const getMoodHistory = async (uid, n = 10) => {
  const colRef = collection(db, 'users', uid, 'journalEntries');
  const q = query(colRef, orderBy('createdAt', 'desc'), limit(n)); // [web:248][web:252]
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// Save or update safety plan for a user
export const saveSafetyPlan = async (uid, plan) => {
  const docRef = doc(db, 'users', uid, 'meta', 'safetyPlan');
  await setDoc(docRef, {
    ...plan,
    updatedAt: new Date().toISOString()
  }); // [web:285][web:288][web:291]
};

// Get safety plan for a user
export const getSafetyPlan = async (uid) => {
  const docRef = doc(db, 'users', uid, 'meta', 'safetyPlan');
  const snap = await getDoc(docRef); // [web:285][web:286]
  if (!snap.exists()) return null;
  return snap.data();
};

// Save a camera mood snapshot with metadata
export const saveCameraMoodSnapshot = async (uid, data) => {
  const colRef = collection(db, 'users', uid, 'cameraMoodSnapshots');
  await addDoc(colRef, {
    ...data,
    createdAt: new Date().toISOString()
  }); // [web:288][web:312][web:358]
};

// Get camera mood history (last N check-ins)
export const getCameraMoodHistory = async (uid, n = 10) => {
  const colRef = collection(db, 'users', uid, 'cameraMoodSnapshots');
  const q = query(colRef, orderBy('createdAt', 'desc'), limit(n)); // [web:248][web:252]
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};
