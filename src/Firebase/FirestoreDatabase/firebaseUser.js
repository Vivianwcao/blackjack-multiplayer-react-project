import { db } from "../Config.js";
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
} from "firebase/firestore";

export const collectionName = "users";

export const createUser = async (usersCollectionName, userUid) => {
	let userDocRef = doc(db, usersCollectionName, userUid);
	await setDoc(userDocRef, { time: new Date(), gameId: null }, { merge: true });
};

export const updateUser = async (usersCollectionName, userUid, gameDocId) => {
	let userDocRef = doc(db, usersCollectionName, userUid);
	await updateDoc(userDocRef, { gameId: gameDocId });
};

export const getJoinedGame = async (usersCollectionName, userUid) => {
	let userDocRef = doc(db, usersCollectionName, userUid);
	const docSnapShot = await getDoc(userDocRef);
	console.log("docSnapShot.data().gameId: ", docSnapShot.data().gameId);
	if (docSnapShot.exists()) return docSnapShot.data().gameId;
};
