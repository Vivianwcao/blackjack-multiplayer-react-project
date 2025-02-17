import db from "../Config";
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

let gamesCollectionRef = collection(db, "games");
//let gameDocRef = doc(db, "games", "game"); //docId is 'game'
//let playersCollectionRef = collection(gameDocRef, "players"); //collectionId is 'players'

const addNewGame = async (
	gamesCollectionRef,
	gameStatus,
	currentPlayerIndex,
	deckId
) => {
	let gameDocRef = await addDoc(
		gamesCollectionRef,
		{
			gameStatus,
			currentPlayerIndex,
			deckId,
		},
		{ merge: true }
	);
	return gameDocRef;
};
const updateGame = async (gameDocRef, obj) => {
	//gameStatus: "waiting", "dealing", "playerTurn", "dealerTurn", "gameOver"
	await updateDoc(gameDocRef, obj);
};
//helper--count the # of players, for index
const getNumberOfPlayers = async (gameDocRef) => {
	//get players list size, need ref to players collection
	let playersCollectionRef = collection(gameDocRef, "players");
	let playersSnap = await getDocs(playersCollectionRef);
	let numberOfPlayers = playersSnap.size;
	console.log("numberOfPlayers: ", numberOfPlayers);
	return numberOfPlayers;
};

const createPlayer = async (gameDocRef, name, status) => {
	let playerIndex = await getNumberOfPlayers(gameDocRef);
	if (playerIndex > 1) {
		console.log("2 players maximum. The room is full");
		return;
	} else {
		let playerDocRef = doc(gameDocRef, "players", playerIndex.toString());
		await setDoc(
			playerDocRef,
			{
				status,
				name,
			},
			{ merge: true }
		);
		console.log(`Player added at index ${playerIndex}`);
		return playerDocRef;
	}
};

//status: "waiting", "playing", "stand", "busted", "won", "lost", "dropped","dealer"
const updatePlayer = async (playerDocRef, changeObj) => {
	updateDoc(playerDocRef, changeObj);
};

//Delete all players
const deleteAllPlayers = async (playersCollectionRef) => {
	const playersCollectionSnapshot = await getDocs(playersCollectionRef);
	const deletePromises = playersCollectionSnapshot.docs.map((playerDoc) =>
		deleteDoc(playerDoc.ref)
	);
	await Promise.all(deletePromises);
	console.log("All players deleted");
};

const checkNumberOfHands = async (playerDocRef) => {
	let handsCollectionRef = collection(playerDocRef, "hands");
	let handSnapShot = await getDocs(handsCollectionRef);
	let numberOfHands = handSnapShot.size;
	console.log("numberOfHands:  ", numberOfHands);
	return { handsCollectionRef, numberOfHands };
};

const createHand = async (playerDocRef, initialBet) => {
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

const updateHand = async (handDocRef, obj) => {
	await updateDoc(handDocRef, obj);
};
export {
	db,
	gamesCollectionRef,
	addNewGame,
	updateGame,
	getNumberOfPlayers,
	createPlayer,
	updatePlayer,
	checkNumberOfHands,
	createHand,
	updateHand,
	deleteAllPlayers,
};
