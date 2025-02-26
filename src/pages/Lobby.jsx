import React, { useRef, useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { db } from "../Firebase/Config";
import {
	gameCollectionNameTwoPlayers,
	playersCollectionName,
	gamesCollectionRef2,
	getGameDocRef,
	getPlayersCollectionRef,
	getPlayerDocRef,
	addNewGame,
	updateGame,
	getNumberOfPlayers,
	createPlayer,
	updatePlayer,
	removePlayerFromGame,
	checkNumberOfHands,
	createHand,
	updateHand,
	deleteAllPlayers,
} from "../Firebase/FirestoreDatabase/firebaseGame";

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
	const { user, gamesList } = useAuth();
	console.log("gamesList from authProvider on <Lobby />", gamesList);

	const [userLobby, setUserLobby] = useState({ uid: null, joinedGameId: null });
	const gameDocRef = useRef(null);
	const playerDocRef = useRef(null);

	const handleCreateNewGame = async () => {
		try {
			gamesCollectionRef2.current = await addNewGame(
				gamesCollectionRef2,
				"waiting",
				null,
				null
			);
		} catch (err) {
			console.error("Error creating game: ", err);
		}
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

	const handleJoinGame = async (gameId) => {
		let { uid, joinedGameId } = userLobby;
		if (!user) {
			console.log("User not signed in");
			return;
		}
		if (user.uid !== uid) {
			console.log("Something went wrong here....not the correct user.");
			return;
		}
		if (joinedGameId) {
			console.log(`User has already joined game: ${joinedGameId}`);
		}
		if (!joinedGameId) {
			// add player to game.
			const gameRef = getGameDocRef(gameCollectionNameTwoPlayers, gameId);

			try {
				const playerRef = await createPlayer(gameRef, "waiting", user.uid);
				setUserLobby((pre) => ({ ...pre, joinedGameId: gameId }));
			} catch (err) {
				console.error("Error joining game: ", err);
			}
		}
	};
	const handleLeaveGame = async (gameId) => {
		if (gameId !== userLobby?.joinedGameId) {
			console.log("User not in this game.");
			return;
		}
		try {
			await removePlayerFromGame(playerDocRef.current);
		} catch (err) {
			console.error(err);
		}
	};

	useEffect(() => {
		if (user) {
			const gameId = userJoinedGame(user.uid);
			setUserLobby((pre) => ({
				...pre,
				uid: user.uid,
				joinedGameId: gameId,
			}));
			console.log("userLobby in useEffect", userLobby);
			if (gameId) {
				gameDocRef.current = getGameDocRef(
					gameCollectionNameTwoPlayers,
					gameId
				);
				playerDocRef.current = getPlayerDocRef(
					gameCollectionNameTwoPlayers,
					gameId,
					playersCollectionName,
					user.uid
				);
			}

			console.log(gameDocRef.current);
			console.log(playerDocRef.current);
		}
	}, [user, gamesList]);

	return (
		<div className="lobby">
			{console.log("userLobby in jsx", userLobby)}
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
							disabled={!user || userLobby.joinedGameId}
						>
							Join game
						</button>
						<button
							onClick={() => handleLeaveGame(game.id)}
							disabled={!user || userLobby.joinedGameId !== game.id}
						>
							Leave game
						</button>
						{/* </Link> */}
					</div>
				))}
			<button
				onClick={handleCreateNewGame}
				disabled={!user || userLobby.joinedGameId}
			>
				Create new game
			</button>
		</div>
	);
};
export default Lobby;
