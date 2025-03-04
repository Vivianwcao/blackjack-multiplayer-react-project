import { auth } from "../../Config";
import {
	linkWithPopup,
	GoogleAuthProvider,
	GithubAuthProvider,
	FacebookAuthProvider,
} from "firebase/auth";

// Define available providers
const providers = {
	google: new GoogleAuthProvider(),
	github: new GithubAuthProvider(),
	facebook: new FacebookAuthProvider(),
};

export const linkProvider = async (providerName) => {
	const user = auth.currentUser;

	if (!user) {
		console.error("No user is currently signed in.");
		return;
	}

	if (!providers[providerName]) {
		console.error("Invalid provider name:", providerName);
		return;
	}

	try {
		// Sign in with the selected provider and link it to the current account
		const result = await linkWithPopup(user, providers[providerName]);
		console.log(
			`${providerName} successfully linked to your account!`,
			result.user
		);
	} catch (error) {
		if (error.code === "auth/credential-already-in-use") {
			console.error("This provider is already linked to another account.");
		} else {
			console.error("Error linking account:", error);
		}
	}
};
