import { createContext, useContext, useState, useEffect } from "react";
import { setPersistence, browserSessionPersistence } from "firebase/auth";
import { auth } from "../Config";
import { collectionName, createUser } from "../FirestoreDatabase/firebaseUser";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const applyAuthSettings = async () => {
		try {
			await setPersistence(auth, browserSessionPersistence);
			console.log("Auth persistence set to session");

			// attached auth listener and asign the unsubscribe function to a variable.
			const unsubscribeAuthListener = auth.onAuthStateChanged((currentUser) => {
				if (currentUser) {
					// User is signed in
					setUser(currentUser);
					//create/recreate a user doc in firestore users collection
					createUser(collectionName, currentUser.uid);
					console.log("listener user signed in... ");
				} else {
					// User is signed out
					setUser(null);
					console.log("listener user signed out... ");
				}
			});
			//return reference to the unsubscribe function.
			return unsubscribeAuthListener;
		} catch (error) {
			console.error("Error setting persistence:", error);
		}
	};
	useEffect(() => {
		// const setApplyAuthSettings = async () => {
		// 	//call to run the function and get the unsubscribe function returned.
		// 	const unsubscribe = await applyAuthSettings();
		// 	if (unsubscribe) return unsubscribe;
		// 	//if !unsubscribe, default return undefined
		// };
		let unsubscribeAuth;
		//call the asyc function and assign the unsubscribe function to unsubscribeAuth.
		applyAuthSettings()
			.then((unsbsc) => (unsubscribeAuth = unsbsc))
			.catch((err) => `Error setting persistence: ${err}`);
		//cleanup if mounting was successful
		return () => {
			if (unsubscribeAuth) {
				console.log("Unsubscribing from auth state listener...");
				unsubscribeAuth();
			}
		};
	}, []);

	return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
};
// Custom hook to use AuthContext
export const useAuth = () => useContext(AuthContext);
