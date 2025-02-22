import React, { useRef, useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { db } from "../Firebase/Config";
import {
	gameCollectionNameTwoPlayers,
	playerCollectionName,
	gamesCollectionRef2,
	getGameDocRef,
	getPlayersCollectionRef,
	getPlayerDocRef,
	addNewGame,
	updateGame,
	getNumberOfPlayers,
	createPlayer,
	updatePlayer,
	checkNumberOfHands,
	createHand,
	updateHand,
	deleteAllPlayers,
} from "../Firebase/FirestoreDatabase/firebaseGame";
import {
	collectionName,
	updateUser,
} from "../Firebase/FirestoreDatabase/firebaseUser";
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
		try {
			gamesCollectionRef2.current = await addNewGame(
				gamesCollectionRef2,
				"waiting",
				0,
				null
			);
		} catch (err) {
			console.error("Error creating game: ", err);
		}
	};

	const handleJoinGame = async (gameId) => {
		const gameRef = doc(db, gameCollectionNameTwoPlayers, gameId);

		try {
			const playerRef = await createPlayer(gameRef, "waiting", user.uid);
			gameDocRef.current = gameRef;
			playerDocRef.current = playerRef;
			//update user's gameDocId.
			await updateUser(collectionName, user.uid, gameId);
		} catch (err) {
			console.error("Error joining game: ", err);
		}

		console.log(gameDocRef.current);
		console.log(playerDocRef.current);

		//setJoined(true);
	};

	//Attach onSnapshot listeners to games collection, each game and its players collection
	useEffect(() => {
		console.log(user);
		let unsubscribers = [];

		const unsubscribeGames = onSnapshot(
			gamesCollectionRef2,
			(gamesSnapshot) => {
				// mapping game collection snapshot to a list of game objects.
				unsubscribers = gamesSnapshot.docs.map((gameDoc) => {
					let gameObj = { id: gameDoc.id, ...gameDoc.data() };

					//get each playersCollectionRef.
					const playersCollectionRef = collection(
						gamesCollectionRef2,
						gameDoc.id,
						playerCollectionName
					);
					//create a snapshot of each players collection
					const unsubscribePlayers = onSnapshot(
						playersCollectionRef,
						(playersSnapshot) => {
							//create a list of players of each game
							const playersList = playersSnapshot.docs.map((playerDoc) => ({
								id: playerDoc.id,
								...playerDoc.data(),
							}));
							//add the player list to each game object
							gameObj.players = playersList;

							setGamesList((previous) => {
								let filteredPrevious = previous.filter(
									(game) => game.id !== gameObj.id
								);
								return [...filteredPrevious, gameObj];
							});
						}
					);
					// explicit return each listener's unsubscribe function to [unsubscribers].map().
					return unsubscribePlayers;
				});
			}
		);

		return () => {
			unsubscribeGames(); // Unsubscribe from the games collection listener
			unsubscribers.forEach((unsubscribe) => unsubscribe()); // Unsubscribe from players listeners
		};
	}, []);

	return (
		<div className="lobby">
			{gamesList
				.sort((a, b) => a.id.localeCompare(b.id))
				.map((game, i) => (
					<div key={i}>
						{/* <Link to={`/${game.id}`}> */}
						<p>{`Game room ${i + 1}`}</p>
						<p>{`Players in: ${game.players ? game.players.length : "0"}`}</p>
						<div></div>
						<button
							onClick={() => handleJoinGame(game.id)}
							disabled={!user || joined}
						>
							Join game
						</button>
						<button disabled={!user || !joined}>Leave game</button>
						{/* </Link> */}
					</div>
				))}
			<button onClick={handleCreateNewGame} disabled={!user || joined}>
				Create new game
			</button>
		</div>
	);
};
export default Lobby;
