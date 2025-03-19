import { auth } from "../../Config";
import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
} from "firebase/auth";

export const handleSignUp = async (email, password) => {
	try {
		const userCredential = await createUserWithEmailAndPassword(
			auth,
			email,
			password
		);
		console.log("User signed up:", userCredential.user);
	} catch (error) {
		console.error("Error signing up:", error.message);
	}
};

export const handleSignIn = async (email, password) => {
	try {
		const userCredential = await signInWithEmailAndPassword(
			auth,
			email,
			password
		);
		console.log("User signed in:", userCredential.user);
	} catch (error) {
		console.error("Error signing in:", error.message);
	}
};
