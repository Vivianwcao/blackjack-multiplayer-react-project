import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
const provider = new GoogleAuthProvider();
import { auth } from "../Config";

export const SignInWithGoogle = async () => {
	try {
		const result = await signInWithPopup(auth, provider);
		console.log("User pressed button to sign in:", result.user);
		return result.user; // Returns user details
	} catch (error) {
		console.error("Google Sign-In Error:", error);
		return null;
	}
};

export const SignOut = async () => {
	try {
		await signOut(auth);
		console.log("User pressed button to sign out");
	} catch (error) {
		console.error("Sign-out error:", error);
	}
};
