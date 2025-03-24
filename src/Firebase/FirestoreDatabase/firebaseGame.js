import React from "react";
import { db } from "../Config";
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
	deleteDoc,
	runTransaction,
	arrayRemove,
} from "firebase/firestore";

export const gamesCollectionName = "games";
export const playersCollectionName = "players";
const getGamesCollectionRef = (gamescollectionName) =>
	collection(db, gamescollectionName);

export const gamesCollectionRef = getGamesCollectionRef(gamesCollectionName);

export const getGameDocRef = (gamescollectionName, gameDocName) =>
	doc(db, gamescollectionName, gameDocName);

export const getPlayersCollectionRef = (
	gamescollectionName,
	gameDocName,
	playersCollectionName
) => collection(db, gamescollectionName, gameDocName, playersCollectionName);

export const getPlayerDocRef = (
	gamescollectionName,
	gameDocName,
	playersCollectionName,
	playerDocId
) =>
	doc(db, gamescollectionName, gameDocName, playersCollectionName, playerDocId);

export const addNewGame = async (
	gamesCollectionRef,
	maxPlayers,
	isOngoing = false,
	deckId = null
) => {
	let gameDocRef = await addDoc(
		gamesCollectionRef,
		{
			isOngoing,
			dealerHasBlackjack: false,
			timestamp: Date.now(),
			gameStatus: "waiting",
			deckId,
			maxPlayers,
		},
		{ merge: true }
	);
	return gameDocRef;
};

export const updateGame = async (gameDocRef, obj) => {
	//gameStatus: "waiting", "dealing", "playerTurn", "dealerTurn", "gameOver"
	try {
		await updateDoc(gameDocRef, obj);
		return `Updated game ${gameDocRef.id} successfully`;
	} catch (err) {
		throw err;
	}
};

export const updateGameDealer = async (gameDocRef, cardList) => {
	try {
		await updateDoc(gameDocRef, {
			dealer: arrayUnion(...cardList),
		});
		return `Updated dealer from game ${gameDocRef.id} successfully`;
	} catch (err) {
		throw err;
	}
};

export const createPlayer = async (gameDocRef, status, uid) => {
	const gameSnap = await getDoc(gameDocRef);
	if (gameSnap.exists()) {
		try {
			const gameData = gameSnap.data();
			const numOfPlayers = gameData?.playerId?.length;
			const maxPlayers = gameData.maxPlayers;
			if (numOfPlayers && numOfPlayers === maxPlayers) {
				console.log(`${maxPlayers} players maximum. The room is full`);
				return;
			} else {
				const playerDocRef = doc(gameDocRef, playersCollectionName, uid);
				const playerData = {
					status,
					id: uid,
					playerRef: playerDocRef,
					gameRef: gameDocRef,
					gameId: gameDocRef.id,
					timestamp: Date.now(),
					playerTurnTimestamp: null,
					bet: 0,
					doubleBet: false,
					hasBlackjack: false,
					busted: false,
					canHit: true,
					donePlaying: false,
					deckId: null,
				};
				await runTransaction(db, async (transaction) => {
					transaction.set(playerDocRef, playerData);
					transaction.update(gameDocRef, {
						playerRef: arrayUnion(playerDocRef),
						playerId: arrayUnion(playerDocRef.id),
					});
					console.log(
						`Player ${playerDocRef.id} added to game ${gameDocRef.id}`
					);
					return playerDocRef;
				});
				//await setDoc(playerDocRef, playerData, { merge: true });
				//return playerDocRef;
			}
		} catch (err) {
			throw err;
		}
	}
};

//status: "waiting", "playing", "stand", "busted", "won", "lost", "dropped","dealer"
export const updatePlayer = async (playerDocRef, changeObj) => {
	try {
		await updateDoc(playerDocRef, changeObj);
		return `Updated player ${playerDocRef.id} successfully`;
	} catch (err) {
		throw err;
	}
};

export const updatePlayerHand = async (playerDocRef, cardList) => {
	try {
		await updateDoc(playerDocRef, { hand: arrayUnion(...cardList) });
		return `Updated player ${playerDocRef.id}'s hand successfully`;
	} catch (err) {
		throw err;
	}
};

export const removePlayerFromGame = async (playerDocRef, gameDocRef) => {
	try {
		const playerDocSnapshot = await getDoc(playerDocRef);

		if (playerDocSnapshot.exists()) {
			await runTransaction(db, async (transaction) => {
				transaction.delete(playerDocRef);
				transaction.update(gameDocRef, {
					playerRef: arrayRemove(playerDocRef),
					playerId: arrayRemove(playerDocRef.id),
				});
				console.log(
					`Player ${playerDocRef.id} removed from game ${gameDocRef.id}`
				);
				return playerDocRef;
			});
		}
	} catch (err) {
		throw err;
	}
};

//remove game remotely if empty game.
export const removeEmptyGame = async (gameDocRef) => {
	try {
		const gameDocSnap = await getDoc(gameDocRef);
		if (gameDocSnap.exists()) {
			if (gameDocSnap.data().isOngoing === true) return;
			const playersCollectionRef = collection(
				gameDocRef,
				playersCollectionName
			);
			const playersCollectionSnapshot = await getDocs(playersCollectionRef);
			if (playersCollectionSnapshot.empty) {
				const res = await deleteSingleGame(gameDocRef);
				console.log(res);
			}
		}
	} catch (err) {
		throw err;
	}
};

//Delete a game without sub-collections
export const deleteSingleGame = async (gameDocRef) => {
	try {
		await deleteDoc(gameDocRef);
		return `Deleted game ${gameDocRef.id} successfully`;
	} catch (err) {
		throw err;
	}
};

//Delete all players of a game
export const deleteAllPlayers = async (playersCollectionRef) => {
	const playersCollectionSnapshot = await getDocs(playersCollectionRef);
	if (playersCollectionSnapshot.empty) {
		console.log(`No players in this game to delete.`);
		return;
	}
	const deletePromises = playersCollectionSnapshot.docs.map((playerDoc) =>
		deleteDoc(playerDoc.ref)
	);
	await Promise.all(deletePromises);
	console.log("All players deleted");
};

//delete a game and its players sub-collection.
export const deleteGame = async (
	gamescollectionName,
	gameDocName,
	playersCollectionName
) => {
	const gameDocRef = getGameDocRef(gamescollectionName, gameDocName);
	const playersCollectionRef = collection(gameDocRef, playersCollectionName);
	//delete its player collection.
	await deleteAllPlayers(playersCollectionRef);
	//delete game doc.
	const gameSnapshot = await getDoc(gameDocRef);
	if (gameSnapshot.exists()) {
		await deleteDoc(gameDocRef);
		console.log(`Game: ${gameDocName} deleted`);
	}
};

// export const checkNumberOfHands = async (playerDocRef) => {
//  let handsCollectionRef = collection(playerDocRef, "hands");
//  let handSnapShot = await getDocs(handsCollectionRef);
//  let numberOfHands = handSnapShot.size;
//  console.log("numberOfHands:  ", numberOfHands);
//  return { handsCollectionRef, numberOfHands };
// };

// export const createHand = async (playerDocRef, initialBet) => {
//  let { handsCollectionRef, numberOfHands } = await checkNumberOfHands(
//    playerDocRef
//  );
//  let handDocRef = doc(
//    handsCollectionRef,
//    playerDocRef.id.concat(numberOfHands.toString())
//  );
//  await setDoc(
//    handDocRef,
//    { bet: initialBet, payout: 0, split: false, playerId: playerDocRef.id },
//    { merge: true }
//  );
//  return handDocRef;
// };

// export const updateHand = async (handDocRef, obj) => {
//  await updateDoc(handDocRef, obj);
// };
