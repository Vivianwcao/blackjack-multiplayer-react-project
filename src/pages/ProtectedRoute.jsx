import React, { useRef, useState, useEffect } from "react";
import { getDoc } from "firebase/firestore";
import { useParams } from "react-router-dom";
import * as fbGame from "../Firebase/FirestoreDatabase/firebaseGame";
import { useAuth } from "../Firebase/FirebaseAuthentification/AuthProvider";

//a page to route to the right content
const ProtectedRoute = ({ game: Game, gameOngoing: GameOngoing }) => {
	const { user, users } = useAuth();
	const { gameId } = useParams();
	const isOngoingGame = useRef(null);

	const checkIfOngoingGame = async (gameId) => {
		const gameDocRef = fbGame.getGameDocRef(fbGame.gamesCollectionName, gameId);
		try {
			const gameSnap = await getDoc(gameDocRef);
			if (gameSnap.exists()) {
				const gameData = gameSnap.data();
				console.log(gameData);
				const isOngoing = gameData.isOngoing;
				isOngoingGame.current = isOngoing ? true : false;
			}
		} catch (err) {
			console.error(err);
		}
	};
	checkIfOngoingGame(gameId);
	if (isOngoingGame.current) return <GameOngoing />;
	else return <Game />;
};

export default ProtectedRoute;
