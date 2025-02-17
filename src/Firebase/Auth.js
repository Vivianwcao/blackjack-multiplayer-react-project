import { initializeApp } from "firebase/app";
import { useEffect } from "react";
import {
	getAuth,
	signInWithPopup,
	GoogleAuthProvider,
	signOut,
	setPersistence,
	browserSessionPersistence,
} from "firebase/auth";

//import { app } from "./firebaseConfig"; // Import your Firebase config
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
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Set authentication persistence to session only (prevents auto-login on new tab/window)
export const SetAuthPersistence = () => {
	useEffect(() => {
		const applyPersistence = async () => {
			try {
				await setPersistence(auth, browserSessionPersistence);
				console.log("Auth persistence set to session");
			} catch (error) {
				console.error("Error setting persistence:", error);
			}
		};

		applyPersistence();
	}, []);

	return null; // No UI needed, just setting persistence
};

export const SignInWithGoogle = async () => {
	try {
		const result = await signInWithPopup(auth, provider);
		console.log("User signed in:", result.user);
		return result.user; // Returns user details
	} catch (error) {
		console.error("Google Sign-In Error:", error);
		return null;
	}
};

export const Logout = async () => {
	try {
		await signOut(auth);
		console.log("User signed out");
	} catch (error) {
		console.error("Sign-out error:", error);
	}
};

// Optional: Function to listen for authentication state changes
export const OnAuthStateChangedListener = (callback) => {
	return auth.onAuthStateChanged(callback);
};
