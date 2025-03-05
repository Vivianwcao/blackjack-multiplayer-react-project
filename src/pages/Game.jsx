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
	const { gameId } = useParams();
	const gameDocRef = useRef(null);
	const characterDocRef = useRef(null);
	const opponentDocRef = useRef(null);

	//check if valid gameDocRef
	//Async don't go well inside useEffect()
	const checkValidGameRef = async (gameRef) => {
		if (!gameRef) return null; //No listener is attached here yet.
		try {
			//check if gameRef is valid.
			const docSnapshot = await getDoc(gameRef);

			if (!docSnapshot.exists()) {
				gameDocRef.current = null; //reset gameRef
				console.log(`Game with id: ${gameRef.id} does not exist`);
				return null;
			}
			return gameRef;
		} catch (error) {
			console.error("Error checking game document:", error);
			gameDocRef.current = null;
			return null;
		}
	};

	const setPlayerRefs = async (gameDocRef, playersCollectionName) => {
		if (!gameDocRef || !user?.uid) {
			console.log("Invalid gameDocRef or user not loaded");
			return false;
		}
		const playerCollectionRef = collection(gameDocRef, playersCollectionName);
		const snapshot = await getDocs(playerCollectionRef);
		if (snapshot.empty) {
			console.log("No player in this game.");
			return false;
		}
		if (snapshot.size !== 2) {
			console.log("Only 2 players allowed in this game.");
			return false;
		}
		for (let player of snapshot.docs) {
			if (player.id === user?.uid) {
				characterDocRef.current = doc(playerCollectionRef, user.uid);
			}
			opponentDocRef.current = doc(playerCollectionRef, player.id);
		}
		return true;
	};

	//listener on player
	const addPlayerListener = (playerRef, setFunction) => {
		if (!playerRef) {
			console.log("Error: Doc ref is null or undefined.");
			return null;
		}
		return onSnapshot(playerRef, (snapshot) => {
			if (!snapshot.exists()) {
				console.log(`Player with id: ${playerRef.id} does not exist`);
				return;
			}
			setFunction(snapshot.data());
			console.log(`Listener attached on player ${playerRef.id}`);
		});
	};

	//onSnapshot listener on game
	const addGameListener = (gameRef) => {
		if (!gameRef) return null;
		return onSnapshot(gameRef, (snapshot) => {
			if (!snapshot.exists()) {
				gameDocRef.current = null; //reset gameRef
				console.log(`Game with id: ${gameRef.id} does not exist`);
				unsubscribe(); // Unsubscribe immediately
				return; // No value needed
			}
			setGame(snapshot.data());

			console.log("**setGame successfully.**");
		});
	};

	useEffect(() => {
		if (!user?.uid) {
			console.log("User not loaded yet");
			return; // No cleanup needed if user isn’t ready
		}

		gameDocRef.current = fbGame.getGameDocRef(
			fbGame.gamesCollectionNameTwoPlayers,
			gameId
		);

		async function setupListeners() {
			const unsubscribeGame = addGameListener(gameDocRef.current);
			if (!unsubscribeGame) {
				console.log("No game listener attached");
				return () => {
					console.log("~.~No game listener to unmount~.~");
				};
			}

			console.log("**Firestore listener on game mounted/attached.**");
			const playersSet = await setPlayerRefs(
				gameDocRef.current,
				fbGame.playersCollectionName
			);

			if (!playersSet) {
				return () => {
					unsubscribeGame?.();
					console.log(
						"~.~Firestore listener on game UNmounted/removed (no players)~.~"
					);
				};
			}

			const unsubscribeCharacter = addPlayerListener(
				characterDocRef.current,
				setCharacter
			);
			const unsubscribeOpponent = addPlayerListener(
				opponentDocRef.current,
				setOpponent
			);

			return () => {
				unsubscribeGame?.();
				unsubscribeCharacter?.();
				unsubscribeOpponent?.();
				console.log("~.~Firestore listeners UNmounted/removed~.~");
			};
		}

		let cleanupFn;
		setupListeners()
			.then((cleanup) => {
				cleanupFn = cleanup || (() => {}); // Default to empty cleanup if none returned
			})
			.catch((error) => {
				console.error("Error setting up listeners:", error);
				cleanupFn = () => {}; // Ensure cleanup is always defined
			});

		return () => {
			if (cleanupFn) cleanupFn();
		};
	}, [user?.uid, gameId]);

	return (
		<div>
			{console.log(
				"* ~ * ~ * ~ * ~ * re-render * ~ * ~ * ~ * ~ *in game",
				game
			)}
			{console.log(user)}
			{console.log(character)}
			{console.log(opponent)}
			{console.log(characterDocRef.current)}
			{console.log(opponentDocRef.current)}
			<p>...</p>
		</div>
	);
};

export default Game;
