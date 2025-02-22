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
} from "firebase/firestore";

export const gameCollectionNameTwoPlayers = "games";
export const playerCollectionName = "players";
const getGamesCollectionRef = (gamescollectionName) =>
	collection(db, gamescollectionName);

export const gamesCollectionRef2 = getGamesCollectionRef(
	gameCollectionNameTwoPlayers
);

export const getGameDocRef = (gamescollectionName, gameDocName) =>
	doc(db, gamescollectionName, gameDocName);

export const getPlayersCollectionRef = (
	gamescollectionName,
	gameDocName,
	playerCollectionName
) =>
	collection(
		getGameDocRef(db, gamescollectionName, gameDocName),
		playerCollectionName
	);

export const getPlayerDocRef = (
	gamescollectionName,
	gameDocName,
	playerCollectionName,
	playerDocId
) =>
	doc(db, gamescollectionName, gameDocName, playerCollectionName, playerDocId);

export const addNewGame = async (
	gamesCollectionRef,
	gameStatus,
	currentPlayerUid,
	deckId
) => {
	let gameDocRef = await addDoc(
		gamesCollectionRef,
		{
			gameStatus,
			currentPlayerUid,
			deckId,
		},
		{ merge: true }
	);
	return gameDocRef;
};

export const updateGame = async (gameDocRef, obj) => {
	//gameStatus: "waiting", "dealing", "playerTurn", "dealerTurn", "gameOver"
	await updateDoc(gameDocRef, obj);
};

//helper--count the # of players, for index
export const getNumberOfPlayers = async (gameDocRef) => {
	//get players list size, need ref to players collection
	let playersCollectionRef = collection(gameDocRef, playerCollectionName);
	let playersSnap = await getDocs(playersCollectionRef);
	return playersSnap.size;
};

export const createPlayer = async (gameDocRef, status, uid) => {
	let numOfPlayers = await getNumberOfPlayers(gameDocRef);
	if (numOfPlayers > 1) {
		console.log("2 players maximum. The room is full");
		return;
	} else {
		let playerDocRef = doc(gameDocRef, playerCollectionName, uid);
		await setDoc(
			playerDocRef,
			{
				status,
			},
			{ merge: true }
		);
		return playerDocRef;
	}
};

//status: "waiting", "playing", "stand", "busted", "won", "lost", "dropped","dealer"
export const updatePlayer = async (playerDocRef, changeObj) => {
	updateDoc(playerDocRef, changeObj);
};

//Delete all players
export const deleteAllPlayers = async (playersCollectionRef) => {
	const playersCollectionSnapshot = await getDocs(playersCollectionRef);
	const deletePromises = playersCollectionSnapshot.docs.map((playerDoc) =>
		deleteDoc(playerDoc.ref)
	);
	await Promise.all(deletePromises);
	console.log("All players deleted");
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
