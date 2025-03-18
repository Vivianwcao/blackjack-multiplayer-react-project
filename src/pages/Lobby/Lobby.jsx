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
	const { user, users } = useAuth();
	// const { removeEmptyGame } = useGameContext();
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
			if (game?.playersCount > 0 && game.playerId.includes(uid)) {
				//side effects here
				if (
					game.playersCount === game.maxPlayers ||
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

	const handleCreateNewGame = async (maxPlayers) => {
		if (!user) {
			console.log("User not signed in");
			return;
		}
		try {
			//create new game
			const gameRef = await fbGame.addNewGame(
				fbGame.gamesCollectionRef,
				maxPlayers
			);
			await fbGame.updateGame(gameRef, {
				gameRef,
				gameId: gameRef.id,
			});
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
			await fbGame.removeEmptyGame(gameRef);

			toggleFalseEnterGame();
		} catch (err) {
			console.error(err);
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
		const unsubscribeGames = attachGamesListener();
		console.log("**Firestore game listener mounted/attached.**");

		return () => {
			// Unsubscribe game listener.
			unsubscribeGames();
			console.log("~.~Firestore game listener UNMOUNTED/removed~.~");
		};
	}, []);

	//Firestore listener on game and players
	const attachGamesListener = () => {
		return onSnapshot(fbGame.gamesCollectionRef, (gamesSnapshot) => {
			setGamesList(
				gamesSnapshot.docs.map((gameDoc) => ({
					id: gameDoc.id,
					...gameDoc.data(),
				}))
			);
		});
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
						<p>{`Players in: ${game.playersCount}`}</p>

						{user &&
							!joined &&
							game.playersCount < game.maxPlayers &&
							game.gameStatus === "waiting" && (
								<button onClick={() => handleJoinGame(game.id)}>
									Join game
								</button>
							)}
						{user && joined === game.id && (
							<button onClick={() => handleLeaveGame(game.id)}>
								Leave game
							</button>
						)}
					</div>
				))}
			{user && !joined && (
				<div className="game-room__create-game-wrapper">
					<button onClick={() => handleCreateNewGame(1)}>
						Create and join new single player game
					</button>
					<button onClick={() => handleCreateNewGame(2)}>
						Create and join a new two-player game
					</button>
					<button onClick={() => handleCreateNewGame(3)}>
						Create and join a new three-player game
					</button>
				</div>
			)}
		</div>
	);
};
export default Lobby;
