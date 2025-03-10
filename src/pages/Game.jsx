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

	const checkIfHomePlayer = () => {};

	//listeners on list of players
	const addPlayersListeners = async (gameRef) => {
		//let unsubscribePlayers = [];
		const playersSnap = await getDocs(
			collection(gameRef, fbGame.playersCollectionName)
		);
		if (playersSnap.size !== fbGame.maxPlayers) {
			console.log(`Must have ${fbGame.maxPlayers} players to play this game.`);
			return null;
		}
		return playersSnap.docs.map((playerDoc) => {
			return onSnapshot(playerDoc.ref, (snapshot) => {
				if (!snapshot.exists()) {
					console.log(`Player with id: ${playerDoc.id} does not exist`);
					return null;
				}
				setPlayers((pre) => {
					let filteredPre = pre?.filter((player) => player.id !== snapshot.id);
					return [...filteredPre, { id: snapshot.id, ...snapshot.data() }];
				});
				console.log(`Listener attached on player ${playerDoc.id}`);
			});
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
		console.log("**Firestore listener on game mounted/attached.**");
		if (!unsubscribeGame) {
			console.log("No game listener attached");
			return () => {
				console.log("~.~No game listener to unmount~.~");
			};
		}
		async function setupListeners() {
			const unsubscribePlayers = await addPlayersListeners(gameDocRef.current);

			if (!unsubscribePlayers) {
				return () => {
					unsubscribeGame?.();
					console.log(
						"~.~Firestore listener on game UNmounted/removed (no players)~.~"
					);
				};
			}

			return () => {
				unsubscribeGame?.();
				unsubscribePlayers?.forEach((unsub) => unsub());
				console.log("~.~Firestore players listeners UNmounted/removed~.~");
			};
		}

		let cleanupFn;
		setupListeners()
			.then((cleanup) => {
				cleanupFn = cleanup || (() => {}); // Default to empty cleanup if none returned
			})
			.catch((error) => {
				console.error("Error setting up players listeners:", error);
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
			{console.log(players)}
			<p>...</p>
		</div>
	);
};

export default Game;
