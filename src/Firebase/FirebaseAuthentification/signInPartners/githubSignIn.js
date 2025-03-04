import { auth } from "../../Config";
import { signInWithPopup, GithubAuthProvider } from "firebase/auth";
import { linkProvider } from "./linkProviders";

const signInWithGithub = async () => {
	const provider = new GithubAuthProvider();
	try {
		const result = await signInWithPopup(auth, provider);
		console.log("User pressed button to sign in github:", result.user);
		await linkProvider("google");
	} catch (error) {
		console.error("GitHub Sign-In Error:", error);
	}
};

// Handles Github sign-in & sign-out
export const handleGithubSignIn = async () => await signInWithGithub();

export const handleSignOut = async () => await SignOut();
