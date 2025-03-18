import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { auth } from "../../Config";
import { linkProvider } from "./linkProviders";

const provider = new GoogleAuthProvider();

const signInWithGoogle = async () => {
	try {
		const result = await signInWithPopup(auth, provider);

		//await linkProvider("github");

		console.log("User pressed button to sign in google:", result.user);
		return result.user; // Returns user details
	} catch (error) {
		console.error("Error during sign-in with Google account:", error);
	}
};

const signOutAll = async () => {
	try {
		await signOut(auth);
		console.log("User pressed button to sign out");
	} catch (error) {
		console.error("Error signing out:", error);
	}
};

// Handles Google sign-in & sign-out
export const handleGoogleSignIn = async () => await signInWithGoogle();

export const handleSignOut = async () => await signOutAll();
