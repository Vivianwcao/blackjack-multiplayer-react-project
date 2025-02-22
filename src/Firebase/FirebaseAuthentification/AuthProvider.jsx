import { createContext, useContext, useState, useEffect } from "react";
import { OnAuthStateChangedListener } from "./setAuthPersistence";
import { collectionName, createUser } from "../FirestoreDatabase/firebaseUser";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);

	// // Auth State Listener (Detects login/SignOut)--clean syntax
	// useEffect(() => {
	// 	const unsubscribe = OnAuthStateChangedListener(setUser);
	// 	return unsubscribe; // Cleanup listener on unmount
	// }, []);

	// Auth State Listener (Detects login/SignOut)--explainary syntax
	useEffect(() => {
		const unsubscribe = OnAuthStateChangedListener((currentUser) => {
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
		return () => unsubscribe();
	}, []);

	return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
};
// Custom hook to use AuthContext
export const useAuth = () => useContext(AuthContext);
