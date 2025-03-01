import React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import { setPersistence, browserSessionPersistence } from "firebase/auth";
import { auth } from "../Config";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);

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
		<AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
	);
};
// Custom hook to use AuthContext
export const useAuth = () => useContext(AuthContext);
