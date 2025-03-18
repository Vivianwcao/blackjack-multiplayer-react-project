import { auth } from "../../Config";
import { signInWithPopup, GithubAuthProvider } from "firebase/auth";
import { linkProvider } from "./linkProviders";

const provider = new GithubAuthProvider();

const signInWithGithub = async () => {
	try {
		const result = await signInWithPopup(auth, provider);

		//await linkProvider( "google" );

		console.log("User pressed button to sign in github:", result.user);
		return result.user;
	} catch (error) {
		console.error("Error during sign-in with Github account:", error);
	}
};

// Handles Github sign-in & sign-out
export const handleGithubSignIn = async () => await signInWithGithub();
