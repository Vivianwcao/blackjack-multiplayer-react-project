import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
const firebaseConfig = {
	apiKey: "AIzaSyCnS10Dnxo_VV0CmL6Y1cZTzDHBS8u2CSw",
	authDomain: "cards-game-9d1ca.firebaseapp.com",
	projectId: "cards-game-9d1ca",
	storageBucket: "cards-game-9d1ca.firebasestorage.app",
	messagingSenderId: "13098124469",
	appId: "1:13098124469:web:e2d97b04dd444c20e66afc",
	measurementId: "G-FRSCERXRYW",
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
