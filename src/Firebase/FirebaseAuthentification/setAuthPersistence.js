import { useEffect } from "react";
import { setPersistence, browserSessionPersistence } from "firebase/auth";
import { auth } from "../Config";

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

// Optional: Function to listen for authentication state changes
export const OnAuthStateChangedListener = (callback) => {
	return auth.onAuthStateChanged(callback);
};
