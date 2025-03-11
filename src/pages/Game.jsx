import React, { useRef, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../Firebase/FirebaseAuthentification/AuthProvider";
import * as fbGame from "../Firebase/FirestoreDatabase/firebaseGame";
import {
	onSnapshot,
	collection,
	getDoc,
	getDocs,
	doc,
} from "firebase/firestore";
import Popup from "../components/Popup/Popup";
import "./Game.scss";

const Game = () => {
	const { user } = useAuth();
	const [game, setGame] = useState(null);
	const [players, setPlayers] = useState([]);
	const { gameId } = useParams();
	const gameDocRef = useRef(null);
	const betRef = useRef(null);

	//Toggle functions
	const [isPopupOpen, setIsPopupOpen] = useState(false);
	const openPopup = () => setIsPopupOpen(true);
	const closePopup = () => setIsPopupOpen(false);

	const findMe = () => players?.find((player) => player.id === user?.uid);
	const me = findMe();

	//listeners on list of players
	const addPlayersListeners = (gameRef) => {
		if (!gameRef) return null;
		const playersCollectionRef = collection(
			gameRef,
			fbGame.playersCollectionName
		);
		return onSnapshot(playersCollectionRef, (snapshot) => {
			if (snapshot.size !== fbGame.maxPlayers) {
				setPlayers([]);
				return null;
			}
			let newList = [];
			snapshot.docs.map((doc) => newList.push({ id: doc.id, ...doc.data() }));
			newList.sort((a, b) => a.timestamp - b.timestamp);
			setPlayers(newList);
			console.log("**setPlayers successfully.**");
			console.log("**Firestore listener on players mounted/attached.**");
		});
	};

	//onSnapshot listener on game
	const addGameListener = (gameRef) => {
		if (!gameRef) return null;
		//return unsubscribe function
		return onSnapshot(gameRef, (snapshot) => {
			if (!snapshot.exists()) {
				gameDocRef.current = null; //reset gameRef
				console.log(`Game with id: ${gameRef.id} does not exist`);
				return; // No value needed
			}
			console.log("**Firestore listener on game mounted/attached.**");
			setGame(snapshot.data());
			console.log("**setGame successfully.**");
		});
	};

	const handleAddBet = async () => {
		const bet = betRef.current.value;
		console.log(bet);
		//update player's bet in db
		await fbGame.updatePlayer();
	};

	useEffect(() => {
		//ask to place bet

		console.log(me);
		if (
			me?.status === "waiting" &&
			me?.bet == 0 &&
			game?.gameStatus === "waiting"
		) {
			openPopup();
		}
	}, [players, game]);

	useEffect(() => {
		if (!user?.uid) {
			console.log("User not loaded yet");
			return; // No cleanup needed if user isn’t ready
		}

		//set ref using game id from params.
		gameDocRef.current = fbGame.getGameDocRef(
			fbGame.gamesCollectionName,
			gameId
		);
		//attach listeners
		const unsubscribeGame = addGameListener(gameDocRef.current);
		const unsubscribePlayers = addPlayersListeners(gameDocRef.current);

		return () => {
			unsubscribeGame?.();
			console.log("**Firestore listener on game UNmounted/attached.**");
			unsubscribePlayers?.();
			console.log("**Firestore listener on players UNmounted/attached.**");
		};
	}, [user?.uid, gameId]);

	return (
		<div>
			<Popup
				isOpen={isPopupOpen}
				handleBtnLeft={handleAddBet}
				btnLeftText="Confirm"
			>
				<h2 className="pop-title">Place a bet</h2>
				<input
					className="pop-input"
					ref={betRef}
					placeholder="Enter a bet ..."
					type="number"
					min="1"
				/>
			</Popup>
			{console.log(
				"* ~ * ~ * ~ * ~ * re-render * ~ * ~ * ~ * ~ *in game",
				game
			)}
			{console.log(user)}
			{console.log(players)}
			<p>...</p>
		</div>
	);
};

export default Game;
