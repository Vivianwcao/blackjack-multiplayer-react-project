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

export const createUser = async (usersCollectionName, userUid, object) => {
	let userDocRef = doc(db, usersCollectionName, userUid);
	try {
		await setDoc(userDocRef, object, { merge: true });
		return `User ${userUid}'s account recorded in firstore DB.`;
	} catch (err) {
		throw err;
	}
};

export const updateUser = async (usersCollectionName, userUid, obj) => {
	let userDocRef = doc(db, usersCollectionName, userUid);
	await updateDoc(userDocRef, obj);
};
