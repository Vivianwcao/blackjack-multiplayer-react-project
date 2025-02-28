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

	const gameDocRef = useRef(null);
	const playerDocRef = useRef(null);
	const userLobby = useRef({ uid: null, joinedGameId: null });

	const handleCreateNewGame = async () => {
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
			const gameRef = getGameDocRef(gameCollectionNameTwoPlayers, gameId);
			try {
				await createPlayer(gameRef, "waiting", user.uid);
				console.log(`User ${user.uid} is in game: ${gameRef.id}`);

				// setUserLobby((pre) => ({ ...pre, joinedGameId: gameId }));
			} catch (err) {
				console.error("Error joining game: ", err);
			}
		}
	};

	// //Test function
	// const deleteOneGame = async (gameCollectionNameTwoPlayers, gameDocName) => {
	// 	await deleteSingleGame(gameCollectionNameTwoPlayers, gameDocName);
	// };

	//helper remove if empty game room
	const removeEmptyGame = async () => {
		const emptyGames = gamesList.filter(
			(game) => game.players.length === 0 && game.playersAddedCount > 0
		);
		console.log("Empty games...", emptyGames);
		if (emptyGames.length > 0) {
			const promisesList = emptyGames.map((game) =>
				deleteGame(gameCollectionNameTwoPlayers, game.id, playersCollectionName)
			);
			await Promise.all(promisesList);
		}
	};

	const handleLeaveGame = async (gameId) => {
		if (gameId !== userLobby.current.joinedGameId) {
			console.log("User not in this game.");
			return;
		}
		try {
			await removePlayerFromGame(playerDocRef.current);
		} catch (err) {
			console.error(err);
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

	useEffect(() => {
		console.log("------UseEffect in Lobby runs...");
		if (user) {
			const gameId = userJoinedGame(user.uid);
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
			userLobby.current = { uid: user.uid, joinedGameId: gameId };
		}
	}, [user, gamesList]);

	return (
		<div className="lobby">
			{console.log(
				"------re-render------userLobby in jsx",
				userLobby.current,
				gamesList
			)}
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
							disabled={!user || userLobby.current.joinedGameId}
						>
							Join game
						</button>
						<button
							onClick={() => handleLeaveGame(game.id)}
							disabled={!user || userLobby.current.joinedGameId !== game.id}
						>
							Leave game
						</button>
						{/* </Link> */}
					</div>
				))}
			<button
				onClick={handleCreateNewGame}
				disabled={!user || userLobby.current.joinedGameId}
			>
				Create and join new game
			</button>
		</div>
	);
};
export default Lobby;
