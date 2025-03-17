import React, { useContext, createContext } from "react";
import { collection, getDocs, getDoc } from "firebase/firestore";
const GameContext = createContext(null);
import * as fbGame from "../Firebase/FirestoreDatabase/firebaseGame";

export const GameProvider = ({ children }) => {
	//remove game remotely if empty game.
	const removeEmptyGame = async (gameDocRef) => {
		try {
			const gameDocSnap = await getDoc(gameDocRef);
			if (gameDocSnap.exists()) {
				const gameData = gameDocSnap.data();
				console.log("Document data:", gameData);
				if (gameData.playersCount === 0) {
					const res = await fbGame.deleteSingleGame(gameDocRef);
					console.log(res);
				}
			} else {
				console.log(`game ${gameDocRef.id} does not exist`);
				return;
			}
		} catch (err) {
			throw new Error(err.message);
		}
	};

	return (
		<GameContext.Provider value={{ removeEmptyGame }}>
			{children}
		</GameContext.Provider>
	);
};
export const useGameContext = () => useContext(GameContext);
