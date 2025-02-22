import { db } from "../Config.js";
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

export const collectionName = "users";

const getUsersCollectionRef = (usersCollectionName) =>
	collection(db, usersCollectionName);

export const createUser = async (usersCollectionName, userUid) => {
	let usersCollectionRef = getUsersCollectionRef(usersCollectionName);
	const userDocRef = doc(usersCollectionRef, userUid);
	await setDoc((usersCollectionRef, userDocRef), {}, { merge: true });
};

export const updateUser = async (usersCollectionName, userUid, gameDocId) => {
	let usersCollectionRef = getUsersCollectionRef(usersCollectionName);
	const userDocRef = doc(usersCollectionRef, userUid);
	await updateDoc(userDocRef, { gameId: gameDocId });
};
//createNewUser( usersCollectionRef, "Ku0hTKiATpWEcKHRKl3AGTyZeIH3" );
