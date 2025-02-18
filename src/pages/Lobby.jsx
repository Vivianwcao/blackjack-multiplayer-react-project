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

const Lobby = () => {
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
		const unsubscribeGames = onSnapshot(gamesCollectionRef, (gameSnapshot) => {
			let gamesList = [];
			const unsubscribeGame = gameSnapshot.docs.forEach((gameDoc) => {
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
						gamesList.push(gameObj);
						//setGamesList((previous) => [...previous, gameObj]);
					}
				);
				return unsubscribePlayers; // Clean up listener on component unmount
			});
			setGamesList(gamesList);
			console.log(gamesList);
			return () => {
				unsubscribeGame.forEach((unsubscribe) => unsubscribe());
			};
		});

		return () => unsubscribeGames();
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
