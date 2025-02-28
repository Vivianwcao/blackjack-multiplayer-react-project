import React, { useRef, useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { db } from "../Firebase/Config";
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

import {
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
			const gameRef = getGameDocRef(gamesCollectionNameTwoPlayers, gameId);
			try {
				await createPlayer(gameRef, "waiting", user.uid);
				userLobby.current.joinedGameId = gameId; //minimizing latency
				console.log(`User ${user.uid} is in game: ${gameRef.id}`);

				// setUserLobby((pre) => ({ ...pre, joinedGameId: gameId }));
			} catch (err) {
				console.error("Error joining game: ", err);
			}
		}
	};

	//delete game without players sub-collection
	const deleteOneGame = async (gamesCollectionNameTwoPlayers, gameDocName) => {
		await deleteSingleGame(gamesCollectionNameTwoPlayers, gameDocName);
	};

	//helper remove if empty game room
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
		if (gameId !== userLobby.current.joinedGameId) {
			console.log("User not in this game.");
			return;
		}
		try {
			await removePlayerFromGame(playerDocRef.current);
			userLobby.current.joinedGameId = null; // Reset here. Minimizing latency
			removeEmptyGame();
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

	return (
		<div className="lobby">
			{/* <button onClick={removeEmptyGame}>remove empty</button> */}
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
							disabled={!user || userJoinedGame(user.uid) === game.id}
						>
							Join game
						</button>
						<button
							onClick={() => handleLeaveGame(game.id)}
							disabled={!(user && userJoinedGame(user.uid) === game.id)}
						>
							Leave game
						</button>
						{/* </Link> */}
					</div>
				))}
			<button
				onClick={handleCreateNewGame}
				disabled={!user || userJoinedGame(user.uid)}
			>
				Create and join new game
			</button>
		</div>
	);
};
export default Lobby;
