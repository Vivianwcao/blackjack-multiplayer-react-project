import React, { useContext, createContext } from "react";
import { collection, getDocs } from "firebase/firestore";
const GameContext = createContext(null);
import * as fbGame from "../Firebase/FirestoreDatabase/firebaseGame";

export const GameProvider = ({ children }) => {
	//remove game remotely if empty game.
	const removeEmptyGame = async () => {
		//check firestore database if any empty game
		const gamesCollectionSnap = await getDocs(fbGame.gamesCollectionRef);

		//create a list of delete promises
		const deletePromises = gamesCollectionSnap.docs.map(async (gameDoc) => {
			const gameDocRef = fbGame.getGameDocRef(
				fbGame.gamesCollectionName,
				gameDoc.id
			);

			const playersCollectionRef = collection(
				gameDocRef,
				fbGame.playersCollectionName
			);

			const collectionSnap = await getDocs(playersCollectionRef);
			if (collectionSnap.size === 0) {
				return fbGame.deleteSingleGame(fbGame.gamesCollectionName, gameDoc.id);
			}
			return null;
		});
		//filter out undefined
		const filteredDeletePromises = deletePromises.filter(
			(promise) => promise !== null
		);

		if (filteredDeletePromises.length)
			try {
				const res = await Promise.all(filteredDeletePromises);
				res.forEach((msg) => console.log(msg));
			} catch (err) {
				console.error(err.message);
			}
	};

	//end game if someone leaves
	const resetPlayerData = async (game, players, gameId) => {
		try {
			if (game.gameStatus === "waiting") {
				//if game not started yet -> keep game
				const promiseList = players.map((player) =>
					fbGame.updatePlayer(player.playerRef, { bet: 0, status: "waiting" })
				);
				await Promise.all(promiseList);
			}
			if (game.gameStatus !== "waiting") {
				//if game started already -> delete game
				await fbGame.deleteGame(
					fbGame.gamesCollectionName,
					gameId,
					fbGame.playersCollectionName
				);
			}
		} catch (err) {
			console.log(err.message);
		}
	};

	return (
		<GameContext.Provider value={{ resetPlayerData, removeEmptyGame }}>
			{children}
		</GameContext.Provider>
	);
};
export const useGameContext = () => useContext(GameContext);
