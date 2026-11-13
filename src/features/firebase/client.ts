import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const config = {
  // These are public Firebase Web app settings for the shared TripNote workspace.
  // Environment variables can override them for local/staging deployments.
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCQ92hodZVXM29V38tSmI_CUynricGZzhg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "trip-note-2ab10.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "trip-note-2ab10",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "trip-note-2ab10.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "161698840951",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:161698840951:web:7e3f08fd86fa2e28e9a172",
};

export const isFirebaseConfigured = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);

const app = isFirebaseConfigured ? (getApps().length ? getApp() : initializeApp(config)) : null;

export const firestore = app ? getFirestore(app) : null;
