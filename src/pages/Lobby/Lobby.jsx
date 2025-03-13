import React, { useRef, useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Popup from "../../components/Popup/Popup";
import { useAuth } from "../../Firebase/FirebaseAuthentification/AuthProvider";
import { onSnapshot, collection, getDocs } from "firebase/firestore";
import * as fbGame from "../../Firebase/FirestoreDatabase/firebaseGame";
import useToggle from "../../utils/hooks/useToggle";
import "./Lobby.scss";

const Lobby = () => {
	const { user } = useAuth();
	const [gamesList, setGamesList] = useState([]);

	const gameDocRef = useRef(null);
	const playerDocRef = useRef(null);
	const userLobby = useRef({ uid: null, joinedGameId: null });

	const [popEnterGame, toggleTrueEnterGame, toggleFalseEnterGame] =
		useToggle(false);

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

	//UI add/leave/join game buttons toggle
	const joined = useMemo(() => userJoinedGame(user?.uid), [user, gamesList]);

	//check if user's joined game has two players including the user.
	const joinedGameReady = () => {
		//console.log(joined);
		if (!user) return null;
		if (joined && gamesList.length) {
			for (let game of gamesList) {
				if (game.players.length === fbGame.maxPlayers) {
					//return game id or undefined if other player pairs
					const gameId = game.players.some((player) => player.id === user.uid);
					if (gameId) {
						toggleTrueEnterGame();
						return game.id;
					}
					toggleFalseEnterGame();
					return null;
				}
			}
		}
		toggleFalseEnterGame();
		return null;
	};

	//UI add/leave/join game buttons toggle
	const gameReady = useMemo(() => joinedGameReady(), [user, gamesList]);
	//console.log("Is game ready??", gameReady);

	const handleCreateNewGame = async () => {
		if (!user) {
			console.log("User not signed in");
			return;
		}
		try {
			//create new game
			const gameRef = await fbGame.addNewGame(fbGame.gamesCollectionRef);
			await fbGame.updateGame(gameRef, { gameRef, gameId: gameRef.id });
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
			const gameRef = fbGame.getGameDocRef(fbGame.gamesCollectionName, gameId);
			try {
				await fbGame.createPlayer(gameRef, "waiting", user.uid);
				userLobby.current.joinedGameId = gameId; //minimizing latency
			} catch (err) {
				console.error("Error joining game: ", err);
			}
		}
	};

	//remove game remotely if empty game.
	const removeEmptyGame = async () => {
		//check firestore database if any empty game
		const gamesCollectionSnap = await getDocs(fbGame.gamesCollectionRef);

		//create a list of delete promises
		const deletePromises = gamesCollectionSnap.docs.map(async (gameDoc) => {
			const gameDocRef = fbGame.getGameDocRef(
				fbGame.gamesCollectionName,
				gameDoc.id
			);

			const playersCollectionRef = collection(
				gameDocRef,
				fbGame.playersCollectionName
			);

			const collectionSnap = await getDocs(playersCollectionRef);
			if (collectionSnap.size === 0) {
				return fbGame.deleteSingleGame(fbGame.gamesCollectionName, gameDoc.id);
			}
			return null;
		});
		//filter out undefined
		const filteredDeletePromises = deletePromises.filter(
			(promise) => promise !== null
		);

		if (filteredDeletePromises.length)
			try {
				const res = await Promise.all(filteredDeletePromises);
				res.forEach((msg) => console.log(msg));
			} catch (err) {
				console.error(err.message);
			}
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
			await fbGame.removePlayerFromGame(
				playerDocRef.current,
				gameDocRef.current
			);
			userLobby.current.joinedGameId = null; // Reset here. Minimizing latency
			setTimeout(removeEmptyGame, 100); //debounce for latency
			toggleFalseEnterGame();
		} catch (err) {
			console.error(err.message);
		}
	};
	useEffect(() => {
		console.log("~ ~ ~ ~ ~ UseEffect in Lobby runs~ ~ ~ ~ ~ ");

		if (user) {
			userLobby.current.uid = user.uid;
			const gameId = userJoinedGame(user.uid);
			if (gameId) {
				userLobby.current.joinedGameId = gameId;
				gameDocRef.current = fbGame.getGameDocRef(
					fbGame.gamesCollectionName,
					gameId
				);
				playerDocRef.current = fbGame.getPlayerDocRef(
					fbGame.gamesCollectionName,
					gameId,
					fbGame.playersCollectionName,
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

	useEffect(() => {
		const { unsubscribeGames, unsubscribers } = attachOnSnapshotListeners();
		console.log("**Firestore nested game listeners mounted/attached.**");

		return () => {
			// Unsubscribe from the games collection listener
			unsubscribers.forEach((unsubscribe) => unsubscribe()); // Unsubscribe from players listeners
			unsubscribeGames();
			console.log("~.~Firestore nested game listeners UNmounted/removed~.~");
		};
	}, []);

	//Firestore listener on game and players
	const attachOnSnapshotListeners = () => {
		//List for inner listeners
		let unsubscribers = [];

		//Outer lister on games
		const unsubscribeGames = onSnapshot(
			fbGame.gamesCollectionRef,
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
						fbGame.gamesCollectionRef,
						gameDoc.id,
						fbGame.playersCollectionName
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

			<Popup
				isOpen={popEnterGame}
				handleBtnLeft={() => handleLeaveGame(joined)}
				handleBtnRight={() => handleEnterGame(navigate, joined)}
				btnLeftText="Leave Game"
				btnRightText="Enter Game !"
			>
				<div>
					<h2 className="popup__title">Floating Window</h2>
					<p className="popup__text">
						This is a pop-up modal in React with SCSS!
					</p>
				</div>
			</Popup>

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
