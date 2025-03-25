import React, { useRef, useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Popup from "../../components/Popup/Popup";
import { useAuth } from "../../Firebase/FirebaseAuthentification/AuthProvider";
import { onSnapshot, collection } from "firebase/firestore";
import * as fbGame from "../../Firebase/FirestoreDatabase/firebaseGame";
import useToggle from "../../utils/hooks/useToggle";
import { useGameContext } from "../../components/GameProvider";
import "../style.scss";
import "./Lobby.scss";

const Lobby = () => {
	const { user, users } = useAuth();
	const [gamesList, setGamesList] = useState([]);

	const gameDocRef = useRef(null);
	const playerDocRef = useRef(null);
	const userLobby = useRef({ uid: null, joinedGame: null });

	const [popEnterGame, toggleTrueEnterGame, toggleFalseEnterGame] =
		useToggle(false);

	const navigate = useNavigate();
	const handleEnterGame = (navigateTo, game) => {
		navigateTo(`/${game.gameId}`);
	};

	//Helper -- Check if user has already joined a game
	const userJoinedGame = (uid) => {
		for (let game of gamesList) {
			//find the game where the user is in
			if (game?.playerId?.length > 0 && game.playerId.includes(uid)) {
				//side effects here
				if (
					game.isOngoing ||
					game.playerId.length === game.maxPlayers ||
					game.gameStatus !== "waiting"
				)
					toggleTrueEnterGame();
				else toggleFalseEnterGame();

				return game; //return game.id of the user
			}
		}
		toggleFalseEnterGame();
		return null;
	};

	//UI add/leave/join game buttons toggle
	const joined = useMemo(() => userJoinedGame(user?.uid), [user, gamesList]);

	const handleCreateNewGame = async (
		maxPlayers,
		isOngoing = false,
		deckId = null
	) => {
		if (!user) {
			console.log("User not signed in");
			return;
		}
		try {
			//create new game
			const gameRef = await fbGame.addNewGame(
				fbGame.gamesCollectionRef,
				maxPlayers,
				isOngoing,
				deckId
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
		let { uid, joinedGame } = userLobby.current;
		if (!user) {
			console.log("User not signed in");
			return;
		}
		if (user.uid !== uid) {
			console.log("Something went wrong here....not the correct user.");
			return;
		}
		if (joinedGame) {
			console.log(
				`User ${user.uid} has already joined game: ${joinedGame.gameId}`
			);
		}
		if (!joinedGame) {
			// add player to game.
			const gameRef = fbGame.getGameDocRef(fbGame.gamesCollectionName, gameId);
			try {
				await fbGame.createPlayer(gameRef, "waiting", user.uid);
			} catch (err) {
				console.error("Error joining game: ", err);
			}
		}
	};

	const handleLeaveGame = async (game) => {
		if (!user) {
			console.log("User not signed in");
			return;
		}
		if (game.gameId !== userLobby.current.joinedGame.gameId) {
			console.log("User not in this game.");
			return;
		}
		try {
			await fbGame.removePlayerFromGame(
				playerDocRef.current,
				gameDocRef.current
			);
			userLobby.current.joinedGame = null; // Reset here. Minimizing latency
			//setTimeout(removeEmptyGame, 100); //debounce for latency

			const gameRef = fbGame.getGameDocRef(
				fbGame.gamesCollectionName,
				game.gameId
			);
			await fbGame.removeEmptyGame(gameRef);

			toggleFalseEnterGame();
		} catch (err) {
			console.error(err);
		}
	};

	const joinGameConditions = (game) => {
		const basicCondition =
			user && !joined && game?.playerId?.length < game.maxPlayers;
		if (game.isOngoing) {
			return basicCondition; //any time
		} else {
			return basicCondition && game.gameStatus === "waiting";
		}
	};

	useEffect(() => {
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
			userLobby.current.joinedGame = null;
			return;
		}

		userLobby.current.joinedGame = joined;
		gameDocRef.current = fbGame.getGameDocRef(
			fbGame.gamesCollectionName,
			joined.gameId
		);
		playerDocRef.current = fbGame.getPlayerDocRef(
			fbGame.gamesCollectionName,
			joined.gameId,
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
				gamesList,
				userLobby.current
			)}

			<button
				className="btn btn--lobby"
				hidden={false}
				onClick={() => handleCreateNewGame(5, true, "b7u5yr1uqy1z")}
			>
				generate an ongoing game for test
			</button>
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
				.map((game, i) => (
					<div className="game-room" key={i}>
						<p>{`Game room ${game.gameId}`}</p>
						<p>{`Players in: ${
							game?.playerId?.length ? game?.playerId?.length : ""
						}/${game.maxPlayers}`}</p>

						{joinGameConditions(game) && (
							<button
								className="btn btn--lobby"
								onClick={() => handleJoinGame(game.gameId)}
							>
								Join game
							</button>
						)}
						{user && joined?.gameId === game.gameId && (
							<button
								className="btn btn--lobby"
								onClick={() => handleLeaveGame(game)}
							>
								Leave game
							</button>
						)}
						{game.gameStatus !== "waiting" && <p>Game is in progress ...</p>}
					</div>
				))}
			{user && !joined && (
				<div className="game-room__create-game-wrapper">
					<button
						className="btn btn--lobby"
						onClick={() => handleCreateNewGame(1)}
					>
						Create and join new single player game
					</button>
					<button
						className="btn btn--lobby"
						onClick={() => handleCreateNewGame(2)}
					>
						Create and join a new two-player game
					</button>
					<button
						className="btn btn--lobby"
						onClick={() => handleCreateNewGame(3)}
					>
						Create and join a new three-player game
					</button>
				</div>
			)}
		</div>
	);
};
export default Lobby;
