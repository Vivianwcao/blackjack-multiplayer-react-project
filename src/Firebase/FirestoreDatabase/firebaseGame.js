import { db } from "../Config";
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
	deleteDoc,
	runTransaction,
} from "firebase/firestore";

export const gamesCollectionNameTwoPlayers = "games";
export const playersCollectionName = "players";
const getGamesCollectionRef = (gamescollectionName) =>
	collection(db, gamescollectionName);

export const gamesCollectionRef2 = getGamesCollectionRef(
	gamesCollectionNameTwoPlayers
);

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
	gameStatus,
	currentPlayerIndex,
	deckId
) => {
	let gameDocRef = await addDoc(
		gamesCollectionRef,
		{
			timestamp: Date.now(),
			gameStatus,
			currentPlayerIndex,
			deckId,
			playersCount: 0,
		},
		{ merge: true }
	);
	return gameDocRef;
};

export const updateGame = async (gameDocRef, obj) => {
	//gameStatus: "waiting", "dealing", "playerTurn", "dealerTurn", "gameOver"
	await updateDoc(gameDocRef, obj);
};

//helper--count the # of players
export const getNumberOfPlayers = async (gameDocRef) => {
	//get players list size, need ref to players collection
	let playersCollectionRef = collection(gameDocRef, playersCollectionName);
	let playersSnap = await getDocs(playersCollectionRef);
	return playersSnap.size;
};

export const createPlayer = async (gameDocRef, status, uid) => {
	const numOfPlayers = await getNumberOfPlayers(gameDocRef);
	if (numOfPlayers > 1) {
		console.log("2 players maximum. The room is full");
		return;
	} else {
		const playerDocRef = doc(gameDocRef, playersCollectionName, uid);
		const playerData = { status, timestamp: Date.now(), playerIndex: null };
		await runTransaction(db, async (transaction) => {
			transaction.set(playerDocRef, playerData);
			transaction.update(gameDocRef, { playersCount: increment(1) });
			console.log(`Player ${playerDocRef.id} added to game ${gameDocRef.id}`);
			return playerDocRef;
		});
		//await setDoc(playerDocRef, playerData, { merge: true });
		//return playerDocRef;
	}
};

//status: "waiting", "playing", "stand", "busted", "won", "lost", "dropped","dealer"
export const updatePlayer = async (playerDocRef, changeObj) => {
	updateDoc(playerDocRef, changeObj);
};

export const removePlayerFromGame = async (playerDocRef, gameDocRef) => {
	const playerDocSnapshot = await getDoc(playerDocRef);
	if (playerDocSnapshot.exists()) {
		await runTransaction(db, async (transaction) => {
			transaction.delete(playerDocRef);
			transaction.update(gameDocRef, { playersCount: increment(-1) });
			console.log(
				`Player ${playerDocRef.id} removed from game ${gameDocRef.id}`
			);
			return playerDocRef;
		});
	}
};

//Delete a game without sub-collections
export const deleteSingleGame = async (gamescollectionName, gameDocName) => {
	const gameDocRef = getGameDocRef(gamescollectionName, gameDocName);
	await deleteDoc(gameDocRef);
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

export const checkNumberOfHands = async (playerDocRef) => {
	let handsCollectionRef = collection(playerDocRef, "hands");
	let handSnapShot = await getDocs(handsCollectionRef);
	let numberOfHands = handSnapShot.size;
	console.log("numberOfHands:  ", numberOfHands);
	return { handsCollectionRef, numberOfHands };
};

export const createHand = async (playerDocRef, initialBet) => {
	let { handsCollectionRef, numberOfHands } = await checkNumberOfHands(
		playerDocRef
	);
	let handDocRef = doc(
		handsCollectionRef,
		playerDocRef.id.concat(numberOfHands.toString())
	);
	await setDoc(handDocRef, { bet: initialBet, payout: 0 }, { merge: true });
	return handDocRef;
};

export const updateHand = async (handDocRef, obj) => {
	await updateDoc(handDocRef, obj);
};
