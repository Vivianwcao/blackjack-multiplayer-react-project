import React, { useRef, useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Popup from "../../components/Popup/Popup";
import { useAuth } from "../../Firebase/FirebaseAuthentification/AuthProvider";
import { onSnapshot, collection } from "firebase/firestore";
import * as fbGame from "../../Firebase/FirestoreDatabase/firebaseGame";
import useToggle from "../../utils/hooks/useToggle";
import { useGameContext } from "../../components/GameProvider";
import "./Lobby.scss";

const Lobby = () => {
	const { user } = useAuth();
	const { removeEmptyGame } = useGameContext();
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
			//find the game where the user is in
			if (game?.playerId?.length > 0 && game.playerId.includes(uid)) {
				//side effects here
				if (
					game.players.length === fbGame.maxPlayers ||
					game.gameStatus !== "waiting"
				)
					toggleTrueEnterGame();
				else toggleFalseEnterGame();

				return game.id; //return game.id of the user
			}
		}
		toggleFalseEnterGame();
		return null;
	};

	//UI add/leave/join game buttons toggle
	const joined = useMemo(() => userJoinedGame(user?.uid), [user, gamesList]);

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
			await handleJoinGame(gameRef.id);
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

	const handleLeaveGame = async (gameId) => {
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
			//setTimeout(removeEmptyGame, 100); //debounce for latency

			const gameRef = fbGame.getGameDocRef(fbGame.gamesCollectionName, gameId);
			await removeEmptyGame(gameRef);

			toggleFalseEnterGame();
		} catch (err) {
			console.error(err.message);
		}
	};
	useEffect(() => {
		console.log("~ ~ ~ ~ ~ UseEffect in Lobby runs~ ~ ~ ~ ~ ");
		if (!user) {
			//not signed in/not loaded
			userLobby.current.uid = null;
			return;
		}
		if (!gamesList) {
			return;
		}
		userLobby.current.uid = user.uid;

		if (!joined) {
			userLobby.current.joinedGameId = null;
			return;
		}

		userLobby.current.joinedGameId = joined;
		gameDocRef.current = fbGame.getGameDocRef(
			fbGame.gamesCollectionName,
			joined
		);
		playerDocRef.current = fbGame.getPlayerDocRef(
			fbGame.gamesCollectionName,
			joined,
			fbGame.playersCollectionName,
			user.uid
		);
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
					<div className="game-room" key={game.id}>
						<p>{`Game room ${game.id}`}</p>
						<p>{`Players in: ${game.players ? game.players.length : "0"}`}</p>

						{user && !joined && game.gameStatus === "waiting" && (
							<button onClick={() => handleJoinGame(game.id)}>Join game</button>
						)}
						{user && joined === game.id && (
							<button onClick={() => handleLeaveGame(game.id)}>
								Leave game
							</button>
						)}
					</div>
				))}
			{user && !joined && (
				<button onClick={handleCreateNewGame}>Create and join new game</button>
			)}
		</div>
	);
};
export default Lobby;
