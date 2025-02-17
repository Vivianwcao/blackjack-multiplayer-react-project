import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
const firestoreData = import.meta.env;

const firebaseConfig = {
	apiKey: firestoreData.VITE_FIREBASE_API_KEY,
	authDomain: firestoreData.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: firestoreData.VITE_FIREBASE_PROJECT_ID,
	storageBucket: firestoreData.VITE_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: firestoreData.VITE_FIREBASE_MESSAGING_SENDER_ID,
	appId: firestoreData.VITE_FIREBASE_APP_ID,
	measurementId: firestoreData.VITE_FIREBASE_MEASUREMENT_ID,
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
