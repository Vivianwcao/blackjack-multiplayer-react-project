import { auth, microsoftProvider } from "../../Config";
import { signInWithPopup } from "firebase/auth";

const signInWithMicrosoft = async () => {
	try {
		const result = await signInWithPopup(auth, microsoftProvider);
		console.log("Microsoft account user info:", result.user);
	} catch (error) {
		console.error("Error during sign-in with Microsoft account:", error);
	}
};
export const handleMicrosoftSignIn = async () => await signInWithMicrosoft();
