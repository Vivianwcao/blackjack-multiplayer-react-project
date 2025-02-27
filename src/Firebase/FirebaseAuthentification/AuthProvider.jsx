import React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import { setPersistence, browserSessionPersistence } from "firebase/auth";
import { onSnapshot, collection } from "firebase/firestore";
import {
	playersCollectionName,
	gamesCollectionRef2,
} from "../FirestoreDatabase/firebaseGame";
import { auth } from "../Config";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [gamesList, setGamesList] = useState([]);

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

	//Firestore listener on game and players
	const attachOnSnapshotListeners = () => {
		//List for inner listeners
		let unsubscribers = [];

		//Outer lister on games
		const unsubscribeGames = onSnapshot(
			gamesCollectionRef2,
			(gamesSnapshot) => {
				//setGameList upon every outer listener firing.
				setGamesList(
					gamesSnapshot.docs.map((gameDoc) => ({
						id: gameDoc.id,
						...gameDoc.data(),
						players: [],
					}))
				);

				//cleanup the old inner listeners -> ready for next new firing
				unsubscribers.forEach((unsc) => unsc());
				unsubscribers = [];

				// mapping game collection snapshot to a list of game objects.
				unsubscribers = gamesSnapshot.docs.map((gameDoc) => {
					//get each playersCollectionRef.
					const playersCollectionRef = collection(
						gamesCollectionRef2,
						gameDoc.id,
						playersCollectionName
					);

					//inner listener on each game's players collection
					const unsubscribePlayers = onSnapshot(
						playersCollectionRef,
						(playersSnapshot) => {
							//create a list of players of each game
							const playersList = playersSnapshot.docs.map((playerDoc) => ({
								id: playerDoc.id,
								...playerDoc.data(),
							}));

							//add the player list to each game object
							let gameObj = { id: gameDoc.id, ...gameDoc.data() };
							gameObj.players = playersList;

							//setGameList upon every inner listener firing.
							setGamesList((pre) => {
								let filteredPre = pre.filter((game) => game.id !== gameObj.id);
								return [...filteredPre, gameObj];
							});
						}
					);
					// explicitly return each listener's unsubscribe function to [unsubscribers].map(...).
					return unsubscribePlayers;
				});
			}
		);
		// return subscribe functions of all listeners.
		return { unsubscribeGames, unsubscribers };
	};

	useEffect(() => {
		let unsubscribeAuth;
		let unsubscribeGamesList;
		let unsubscribersList;

		//call the asyc function and assign the unsubscribe function to unsubscribeAuth.
		applyAuthSettings()
			.then(() => {
				console.log("**Auth persistence mounted.**");
				unsubscribeAuth = attachAuthListener();
				console.log("**onAuthStateChanged listener mounted/attached.**");
			})
			.then(() => {
				const { unsubscribeGames, unsubscribers } = attachOnSnapshotListeners();
				unsubscribeGamesList = unsubscribeGames;
				unsubscribersList = unsubscribers;
				console.log("**Firestore onSnapshot listeners mounted/attached.**");
			})
			.catch((err) => `Error setting persistence: ${err}`);

		//cleanup if mounting was successful
		return () => {
			if (unsubscribeAuth) {
				unsubscribeAuth();
				console.log("~.~onAuthStateChanged listener unmounted~.~");
			}
			// Unsubscribe from the games collection listener
			unsubscribersList.forEach((unsubscribe) => unsubscribe()); // Unsubscribe from players listeners
			unsubscribeGamesList();
			console.log("~.~Firestore onSnapshot listeners unmounted/removed~.~");
		};
	}, []);

	return (
		<AuthContext.Provider value={{ user, gamesList }}>
			{children}
		</AuthContext.Provider>
	);
};
// Custom hook to use AuthContext
export const useAuth = () => useContext(AuthContext);
