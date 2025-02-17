import React, { useRef, useState, useEffect } from "react";
import "./Game.scss";
import {
	db,
	gamesCollectionRef,
	addNewGame,
	updateGame,
	getNumberOfPlayers,
	createPlayer,
	updatePlayer,
	checkNumberOfHands,
	createHand,
	updateHand,
	deleteAllPlayers,
} from "../Firebase/FirestoreDatabase/firebase";
import {
	onSnapshot,
	query,
	where,
	collection,
	doc,
	setDoc,
	getDoc,
	getDocs,
	addDoc,
	updateDoc,
	arrayUnion,
	increment,
} from "firebase/firestore";

("use client"); // This is a Client Component

const Game = () => {
	const [players, setPlayers] = useState([]);
	const [joined, setJoined] = useState(false);
	const playerDocRef = useRef(null);

	const handleJoin = async () => {
		console.log(players);
		let playerRef = await createPlayer({
			gameDocRef: gameDocRef,
			name: "Jane",
			status: "waiting",
		});
		playerDocRef.current = playerRef;
		setJoined(true);
	};

	// useEffect(() => {
	// 	//Attach onSnapshot listener for real-time updates on "players" collection on Firestore.
	// 	const unsubscribe = onSnapshot(playersCollectionRef, (snapshot) => {
	// 		const playersList = snapshot.docs.map((doc) => ({
	// 			id: doc.id,
	// 			...doc.data(),
	// 		}));
	// 		setPlayers(playersList);
	// 	});

	// 	return () => unsubscribe(); // Clean up listener on component unmount
	// }, []);

	return (
		<div>
			<p>{players.length} joined...</p>
			<button className="game__join" onClick={handleJoin} disabled={joined}>
				{joined ? "You are in!" : "Join Game"}
			</button>
		</div>
	);
};

export default Game;
