import React, { useRef, useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
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
import { useAuth } from "../Firebase/FirebaseAuthentification/AuthProvider";

const Lobby = () => {
	const user = useAuth();
	const [gamesList, setGamesList] = useState([]);
	const [joined, setJoined] = useState(false);
	const gameDocRef = useRef(null);
	const playerDocRef = useRef(null);

	const handleCreateNewGame = async () => {
		gamesCollectionRef.current = await addNewGame(
			gamesCollectionRef,
			"waiting",
			0,
			null
		);
	};

	const handleJoinGame = async (gameId) => {
		let gameRef = doc(db, "games", gameId);

		let playerRef = await createPlayer(gameRef, "", "waiting");
		gameDocRef.current = gameRef;
		console.log(gameDocRef.current);
		playerDocRef.current = playerRef;
		console.log(playerDocRef.current);
		setJoined(true);
	};

	//Attach onSnapshot listeners to games collection, each game and its players collection
	useEffect(() => {
		let unsubscribers = [];

		const unsubscribeGames = onSnapshot(gamesCollectionRef, (gameSnapshot) => {
			// let gamesList = [];
			unsubscribers = gameSnapshot.docs.map((gameDoc) => {
				let gameObj = { id: gameDoc.id, ...gameDoc.data() };

				const playersCollectionRef = collection(
					gamesCollectionRef,
					gameDoc.id,
					"players"
				);
				const unsubscribePlayers = onSnapshot(
					playersCollectionRef,
					(playerSnapshot) => {
						const playersList = playerSnapshot.docs.map((playerDoc) => ({
							id: playerDoc.id,
							...playerDoc.data(),
						}));
						gameObj.players = playersList;
						//gamesList.push(gameObj);
						setGamesList((previous) => {
							let filteredPrevious = previous.filter(
								(game) => game.id !== gameObj.id
							);
							return [...filteredPrevious, gameObj];
						});
					}
				);
				return unsubscribePlayers; // Clean up listener on component unmount
			});
		});

		return () => {
			unsubscribeGames(); // Unsubscribe from the games collection listener
			unsubscribers.forEach((unsubscribe) => unsubscribe()); // Unsubscribe from players listeners
		};
	}, []);

	return (
		<div className="lobby">
			{console.log(gamesList)}
			{gamesList.map((game, i) => (
				<div key={i}>
					{/* <Link to={`/${game.id}`}> */}
					<p>{`Game room ${i + 1}`}</p>
					<p>{`Players in: ${game.players ? game.players.length : "0"}`}</p>
					<button onClick={() => handleJoinGame(game.id)} disabled={joined}>
						Join game
					</button>
					{/* </Link> */}
				</div>
			))}
			<button onClick={handleCreateNewGame} disabled={joined}>
				Create new game
			</button>
		</div>
	);
};
export default Lobby;
