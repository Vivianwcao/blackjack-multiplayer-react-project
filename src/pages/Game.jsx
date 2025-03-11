import React, { useRef, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../Firebase/FirebaseAuthentification/AuthProvider";
import * as fbGame from "../Firebase/FirestoreDatabase/firebaseGame";
import {
	onSnapshot,
	collection,
	getDoc,
	getDocs,
	doc,
} from "firebase/firestore";
import { db } from "../Firebase/Config";
import "./Game.scss";

const Game = () => {
	const { user } = useAuth();
	const [game, setGame] = useState(null);
	const [players, setPlayers] = useState([]);
	const { gameId } = useParams();
	const gameDocRef = useRef(null);

	//listeners on list of players
	const addPlayersListeners = (gameRef) => {
		if (!gameRef) return null;
		const playersCollectionRef = collection(
			gameRef,
			fbGame.playersCollectionName
		);
		return onSnapshot(playersCollectionRef, (snapshot) => {
			console.log(snapshot.size);
			if (snapshot.size !== fbGame.maxPlayers) {
				return null;
			}
			let newList = [];
			snapshot.docs.map((doc) => newList.push({ id: doc.id, ...doc.data() }));
			newList.sort((a, b) => a.timestamp - b.timestamp);
			setPlayers(newList);
			console.log("**setPlayers successfully.**");
			console.log("**Firestore listener on players mounted/attached.**");
		});
	};

	//onSnapshot listener on game
	const addGameListener = (gameRef) => {
		if (!gameRef) return null;
		//return unsubscribe function
		return onSnapshot(gameRef, (snapshot) => {
			if (!snapshot.exists()) {
				gameDocRef.current = null; //reset gameRef
				console.log(`Game with id: ${gameRef.id} does not exist`);
				return; // No value needed
			}
			console.log("**Firestore listener on game mounted/attached.**");
			setGame(snapshot.data());
			console.log("**setGame successfully.**");
		});
	};

	useEffect(() => {
		if (!user?.uid) {
			console.log("User not loaded yet");
			return; // No cleanup needed if user isn’t ready
		}

		//set ref using game id from params.
		gameDocRef.current = fbGame.getGameDocRef(
			fbGame.gamesCollectionNameTwoPlayers,
			gameId
		);
		const unsubscribeGame = addGameListener(gameDocRef.current);
		const unsubscribePlayers = addPlayersListeners(gameDocRef.current);

		return () => {
			unsubscribeGame?.();
			console.log("**Firestore listener on game UNmounted/attached.**");
			unsubscribePlayers?.();
			console.log("**Firestore listener on players UNmounted/attached.**");
		};
	}, [user?.uid, gameId]);

	return (
		<div>
			{console.log(
				"* ~ * ~ * ~ * ~ * re-render * ~ * ~ * ~ * ~ *in game",
				game
			)}
			{console.log(user)}
			{console.log(players)}
			<p>...</p>
		</div>
	);
};

export default Game;
