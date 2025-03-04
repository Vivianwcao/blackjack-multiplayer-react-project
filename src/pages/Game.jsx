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
	const [character, setCharacter] = useState(null);
	const [opponent, setOpponent] = useState(null);
	const [characterHandsCollection, setCharacterHandsCollection] =
		useState(null);
	const [opponentHandsCollection, setOpponentHandsCollection] = useState(null);
	const { gameId } = useParams();
	const gameDocRef = useRef(null);
	const characterDocRef = useRef(null);
	const opponentDocRef = useRef(null);

	console.log(gameId);

	//listener on player
	const getPlayerRefs = async (gameDocRef, playersCollectionName) => {
		const playerCollectionRef = collection(gameDocRef, playersCollectionName);
		const snapshot = await getDocs(playerCollectionRef);
		if (snapshot.empty) {
			console.log("No player in this game.");
			return null;
		}

		for (let player of snapshot.docs) {
			if (player.id === user?.uid) {
				characterDocRef.current = doc(playerCollectionRef, user.uid);
			}
			opponentDocRef.current = doc(playerCollectionRef, player.id);
		}
		console.log(characterDocRef.current);
		console.log(opponentDocRef.current);
	};

	//onSnapshot listener on game
	const addGameListener = async (gameRef) => {
		if (!gameRef) return null; //No listener is attached here yet.
		try {
			//check if gameRef is valid.
			const docSnapshot = await getDoc(gameRef);

			if (!docSnapshot.exists()) {
				gameDocRef.current = null; //reset gameRef
				console.log(`Game with id: ${gameRef.id} does not exist`);
				return null; //return undefined
			}

			//proceed with valid gameDocRef
			return onSnapshot(gameRef, (snapshot) => {
				if (!snapshot.exists()) {
					gameDocRef.current = null; //reset gameRef
					console.log(`Game with id: ${gameRef.id} does not exist`);
					return; // No value needed
				}
				setGame(snapshot.data());
				console.log("**setGame successfully.**");
			});
		} catch (error) {
			console.error("Error checking game document:", error);
			gameDocRef.current = null;
			return null;
		}
	};

	useEffect(() => {
		//set refs, could be invalid
		gameDocRef.current = fbGame.getGameDocRef(
			fbGame.gamesCollectionNameTwoPlayers,
			gameId
		);
		console.log(gameDocRef.current);
		getPlayerRefs(gameDocRef.current, fbGame.playersCollectionName);

		//call to mount listeners
		let unsubscribeGame = null;
		const func = async () => {
			unsubscribeGame = await addGameListener(gameDocRef.current);
		};
		func();
		if (unsubscribeGame) {
			console.log("**Firestore listener on game mounted/attached.**");
		}

		return () => {
			unsubscribeGame?.(); //call function if not null/undefined
			console.log("~.~Firestore listener on game UNmounted/removed~.~");
		};
	}, []);

	return (
		<div>
			{console.log("* * * * * re-render * * * * *userLobby in jsx", game)}
			<p>...</p>
		</div>
	);
};

export default Game;
