import React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import { setPersistence, browserSessionPersistence } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "../Config";
import { collectionName, createUser } from "../FirestoreDatabase/firebaseUser";
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [users, setUsers] = useState(null);

	// Auth persistence
	const applyAuthSettings = async () => {
		try {
			await setPersistence(auth, browserSessionPersistence);
			console.log("Auth persistence set to session");
		} catch (error) {
			console.error("Error setting persistence:", error);
		}
	};

	// Login/out listener
	const attachAuthListener = () => {
		// attached auth listener and asign the unsubscribe function to a variable.
		const unsubscribeAuthListener = auth.onAuthStateChanged((currentUser) => {
			if (currentUser) {
				setUser(currentUser);
				console.log("AuthListener: user signed in... ");
			} else {
				// User is signed out
				setUser(null);
				console.log("AuthListener:  user signed out... ");
			}
		});
		//return reference to the unsubscribe function.
		return unsubscribeAuthListener;
	};

	useEffect(() => {
		if (!user) return;
		//Create new user -> firestore db Users collection
		const userData = {
			id: user.uid,
			name: user.displayName,
			email: user.email,
			photo: user.photoURL,
			metadata: {
				createdAt: user.metadata.createdAt,
				lastLoginAt: user.metadata.lastLoginAt,
				creationTime: user.metadata.creationTime,
				lastSignInTime: user.metadata.lastSignInTime,
			},
			providerId: user.providerId,
		};
		createUser(collectionName, user.uid, userData)
			.then((res) => {
				console.log(res);
				return getDocs(collection(db, collectionName));
			})
			.then((snapshot) => {
				setUsers(snapshot.docs.map((doc) => doc.data()));
				console.log("------------get users from DB: ", users);
			})
			.catch((err) =>
				console.log(
					`Error with adding user ${user.uid} to Users collection:`,
					err
				)
			);
	}, [user?.uid]);

	useEffect(() => {
		let unsubscribeAuth;

		//call the asyc function and assign the unsubscribe function to unsubscribeAuth.
		applyAuthSettings()
			.then(() => {
				console.log("**Auth persistence mounted.**");
				unsubscribeAuth = attachAuthListener();
				console.log("**onAuthStateChanged listener mounted/attached.**");
			})
			.catch((err) => `Error setting persistence: ${err}`);

		//cleanup if mounting was successful
		return () => {
			if (unsubscribeAuth) {
				unsubscribeAuth();
				console.log("~.~onAuthStateChanged listener unmounted~.~");
			}
		};
	}, []);

	return (
		//{{user}} because user is an object
		<AuthContext.Provider value={{ user, users }}>
			{children}
		</AuthContext.Provider>
	);
};
// Custom hook to use AuthContext
export const useAuth = () => useContext(AuthContext);
