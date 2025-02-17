import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { auth } from "../Config";
const provider = new GoogleAuthProvider();

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
