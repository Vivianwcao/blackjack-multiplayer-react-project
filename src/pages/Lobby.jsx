import React, { useRef, useState, useEffect, useMemo, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Popup from "../components/Popup/Popup";
import {
	AuthContext,
	useAuth,
} from "../Firebase/FirebaseAuthentification/AuthProvider";
import { db } from "../Firebase/Config";
import {
	onSnapshot,
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
import {
	gamesCollectionNameTwoPlayers,
	playersCollectionName,
	gamesCollectionRef2,
	getGameDocRef,
	getPlayersCollectionRef,
	getPlayerDocRef,
	addNewGame,
	updateGame,
	deleteSingleGame,
	deleteGame,
	getNumberOfPlayers,
	createPlayer,
	updatePlayer,
	removePlayerFromGame,
	checkNumberOfHands,
	createHand,
	updateHand,
	deleteAllPlayers,
} from "../Firebase/FirestoreDatabase/firebaseGame";

const Lobby = () => {
	const { user } = useAuth();
	const [gamesList, setGamesList] = useState([]);

	const gameDocRef = useRef(null);
	const playerDocRef = useRef(null);
	const userLobby = useRef({ uid: null, joinedGameId: null });

	const [isPopupOpen, setIsPopupOpen] = useState(false);

	//Toggle functions
	const openPopup = () => setIsPopupOpen(true);
	const closePopup = () => setIsPopupOpen(false);

	const navigate = useNavigate();
	const handleEnterGame = (navigateTo, gameId) => {
		console.log("inside handleEnter game: ");
		navigateTo(`/${gameId}`);
	};

	//Helper -- Check if user has already joined a game
	const userJoinedGame = (uid) => {
		for (let game of gamesList) {
			if (game?.players) {
				const joined = game.players.some((player) => player.id === uid);
				if (joined) {
					return game.id;
				}
			}
		}
		return null;
	};

	//UI toggle
	const joined = useMemo(() => userJoinedGame(user?.uid), [user, gamesList]);

	//check if user's joined game has two players including the user.
	const joinedGameReady = () => {
		console.log(joined);
		if (!user) return null;
		if (joined && gamesList.length) {
			for (let game of gamesList) {
				if (game.players.length === 2) {
					//return game id or undefined if other player pairs
					const gameId = game.players.some((player) => player.id === user.uid);
					if (gameId) {
						openPopup();
						return game.id;
					}
					closePopup();
					return null;
				}
			}
		}
		closePopup();
		return null;
	};

	//UI toggle
	const gameReady = useMemo(() => joinedGameReady(), [user, gamesList]);
	console.log("Is game ready??", gameReady);

	const handleCreateNewGame = async () => {
		if (!user) {
			console.log("User not signed in");
			return;
		}
		try {
			//create new game
			const gameRef = await addNewGame(
				gamesCollectionRef2,
				"waiting",
				null,
				null
			);
			console.log(`Game: ${gameRef.id} created`);
			//join this game
			handleJoinGame(gameRef.id);
		} catch (err) {
			console.error("Error creating game: ", err);
		}
	};

	const handleJoinGame = async (gameId) => {
		let { uid, joinedGameId } = userLobby.current;
		if (!user) {
			console.log("User not signed in");
			return;
		}
		if (user.uid !== uid) {
			console.log("Something went wrong here....not the correct user.");
			return;
		}
		if (joinedGameId) {
			console.log(`User ${user.uid} has already joined game: ${joinedGameId}`);
		}
		if (!joinedGameId) {
			// add player to game.
			const gameRef = getGameDocRef(gamesCollectionNameTwoPlayers, gameId);
			try {
				await createPlayer(gameRef, "waiting", user.uid);
				userLobby.current.joinedGameId = gameId; //minimizing latency
				console.log(`User ${user.uid} is in game: ${gameRef.id}`);
			} catch (err) {
				console.error("Error joining game: ", err);
			}
		}
	};

	//delete game without players sub-collection
	const deleteOneGame = async (gamesCollectionNameTwoPlayers, gameDocName) => {
		await deleteSingleGame(gamesCollectionNameTwoPlayers, gameDocName);
	};

	//remove game remotely if empty game.
	const removeEmptyGame = async () => {
		//check firestore database if any empty game
		const gamesCollectionSnap = await getDocs(gamesCollectionRef2);

		//create a list of delete promises
		const deletePromises = gamesCollectionSnap.docs.map(async (gameDoc) => {
			const gameDocRef = getGameDocRef(
				gamesCollectionNameTwoPlayers,
				gameDoc.id
			);

			const playersCollectionRef = collection(
				gameDocRef,
				playersCollectionName
			);

			const collectionSnap = await getDocs(playersCollectionRef);
			if (collectionSnap.size === 0) {
				return deleteOneGame(gamesCollectionNameTwoPlayers, gameDoc.id);
			}
			//implicitly return undefined if players in the game
		});
		//filter out undefined
		const filteredDeletePromises = deletePromises.filter((promise) => promise);
		if (filteredDeletePromises.length)
			await Promise.all(filteredDeletePromises);
	};

	const handleLeaveGame = async (gameId) => {
		console.log(user, userLobby.current.joinedGameId, gameId);
		if (!user) {
			console.log("User not signed in");
			return;
		}
		if (gameId !== userLobby.current.joinedGameId) {
			console.log("User not in this game.");
			return;
		}
		try {
			await removePlayerFromGame(playerDocRef.current);
			userLobby.current.joinedGameId = null; // Reset here. Minimizing latency
			//removeEmptyGame();
			closePopup();
		} catch (err) {
			console.error(err);
		}
	};

	useEffect(() => {
		let unsubscribeGamesList;
		let unsubscribersList;

		const { unsubscribeGames, unsubscribers } = attachOnSnapshotListeners();
		unsubscribeGamesList = unsubscribeGames;
		unsubscribersList = unsubscribers;
		console.log("**Firestore onSnapshot listeners mounted/attached.**");

		return () => {
			// Unsubscribe from the games collection listener
			unsubscribersList.forEach((unsubscribe) => unsubscribe()); // Unsubscribe from players listeners
			unsubscribeGamesList();
			console.log("~.~Firestore onSnapshot listeners unmounted/removed~.~");
		};
	}, []);

	useEffect(() => {
		console.log("~ ~ ~ ~ ~ UseEffect in Lobby runs~ ~ ~ ~ ~ ");

		if (user) {
			userLobby.current.uid = user.uid;
			const gameId = userJoinedGame(user.uid);
			if (gameId) {
				userLobby.current.joinedGameId = gameId;
				gameDocRef.current = getGameDocRef(
					gamesCollectionNameTwoPlayers,
					gameId
				);
				playerDocRef.current = getPlayerDocRef(
					gamesCollectionNameTwoPlayers,
					gameId,
					playersCollectionName,
					user.uid
				);
			} else {
				userLobby.current.joinedGameId = null;
			}
		} else {
			//not signed in
			userLobby.current.uid = null;
		}
	}, [user, gamesList]);

	//Firestore listener on game and players
	const attachOnSnapshotListeners = () => {
		//List for inner listeners
		let unsubscribers = [];

		//Outer lister on games
		const unsubscribeGames = onSnapshot(
			gamesCollectionRef2,
			(gamesSnapshot) => {
				//setGameList upon every outer listener firing.
				setGamesList(
					gamesSnapshot.docs.map((gameDoc) => ({
						id: gameDoc.id,
						...gameDoc.data(),
						players: [],
					}))
				);

				//cleanup the old inner listeners -> ready for next new firing
				unsubscribers.forEach((unsc) => unsc());
				unsubscribers = [];

				// mapping game collection snapshot to a list of game objects.
				unsubscribers = gamesSnapshot.docs.map((gameDoc) => {
					//get each playersCollectionRef.
					const playersCollectionRef = collection(
						gamesCollectionRef2,
						gameDoc.id,
						playersCollectionName
					);

					//inner listener on each game's players collection
					const unsubscribePlayers = onSnapshot(
						playersCollectionRef,
						(playersSnapshot) => {
							//create a list of players of each game
							const playersList = playersSnapshot.docs.map((playerDoc) => ({
								id: playerDoc.id,
								...playerDoc.data(),
							}));

							//add the player list to each game object
							let gameObj = { id: gameDoc.id, ...gameDoc.data() };
							gameObj.players = playersList;

							//setGameList upon every inner listener firing.
							setGamesList((pre) => {
								let filteredPre = pre.filter((game) => game.id !== gameObj.id);
								return [...filteredPre, gameObj];
							});
						}
					);
					// explicitly return each listener's unsubscribe function to [unsubscribers].map(...).
					return unsubscribePlayers;
				});
			}
		);
		// return subscribe functions of all listeners.
		return { unsubscribeGames, unsubscribers };
	};

	return (
		<div className="lobby">
			{console.log(
				"* * * * * re-render * * * * *userLobby in jsx",
				userLobby.current,
				gamesList
			)}
			{
				<Popup
					isOpen={isPopupOpen}
					handleBtnLeft={() => handleLeaveGame(joined)}
					handleBtnRight={() => handleEnterGame(navigate, joined)}
					gameId={joined}
					btnLeftText="Leave Game"
					btnRightText="Enter Game !"
				/>
			}
			{gamesList
				.sort((a, b) => a.timestamp - b.timestamp)
				.map((game) => (
					<div key={game.id}>
						{/* <Link to={`/${game.id}`}> */}
						<p>{`Game room ${game.id}`}</p>
						<p>{`Players in: ${game.players ? game.players.length : "0"}`}</p>
						{/*{gameReady === game.id ? <button>Enter game!</button> : null}*/}

						<button
							onClick={() => handleJoinGame(game.id)}
							disabled={!user || joined}
						>
							Join game
						</button>
						<button
							onClick={() => handleLeaveGame(game.id)}
							disabled={!(user && joined === game.id)}
						>
							Leave game
						</button>
						{/* </Link> */}
					</div>
				))}
			<button onClick={handleCreateNewGame} disabled={!user || joined}>
				Create and join new game
			</button>
		</div>
	);
};
export default Lobby;
