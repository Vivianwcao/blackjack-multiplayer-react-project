import React, { useRef, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../Firebase/FirebaseAuthentification/AuthProvider";
import * as fbGame from "../../Firebase/FirestoreDatabase/firebaseGame";
import {
	onSnapshot,
	collection,
	getDoc,
	getDocs,
	doc,
} from "firebase/firestore";
import Popup from "../../components/Popup/Popup";
import "./Game.scss";
import useToggle from "../../utils/hooks/useToggle";
import * as cardMachine from "../../utils/api-helper/cardMachine";

const backOfCardImg = "https://deckofcardsapi.com/static/img/back.png";

const Game = () => {
	const { user } = useAuth();
	const [game, setGame] = useState(null);
	const [players, setPlayers] = useState(null);
	const { gameId } = useParams();
	const gameDocRef = useRef(null);
	const betRef = useRef(null);

	const nav = useNavigate();

	//Toggle functions
	const [popBet, toggleTrueBet, toggleFalseBet] = useToggle(false);
	const [popLeaveGame, toggleTruePopLeaveGame, toggleFalsePopLeaveGame] =
		useToggle(false);

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
				//setPlayers([]);
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

	//pop & ask to place a bet
	const handleAddBet = async () => {
		const betStr = betRef.current.value;
		//update player's bet in db
		await fbGame.updatePlayer(me.playerRef, {
			bet: +betStr,
		}); //get number
		toggleFalseBet();

		// set up game intial draw stage
		if (
			players.every((player) => player.bet > 0) //meaning me is the last
		) {
			playingInitialDraw();
		}
	};

	const handleQuitGame = async () => {
		try {
			await fbGame.removePlayerFromGame(me.playerRef, game.gameRef);
		} catch (err) {
			console.log(err.message);
		}
	};

	//quit game
	const cancelGame = async () => {
		try {
			if (game.gameStatus === "waiting") {
				//if game not started yet -> keep game
				const promiseList = players.map((player) =>
					fbGame.updatePlayer(player.playerRef, { bet: 0, status: "waiting" })
				);
				await Promise.all(promiseList);
			}
			if (game.gameStatus !== "waiting") {
				//if game started already -> delete game
				await fbGame.deleteGame(
					fbGame.gamesCollectionName,
					gameId,
					fbGame.playersCollectionName
				);
			}
		} catch (err) {
			console.log(err.message);
		}

		toggleTruePopLeaveGame();
		return;
	};

	//gameStatus -> "dealing"
	//api call -> get deck, first 2 cards
	//player status -> "playing"
	const playingInitialDraw = async () => {
		try {
			const res1 = await fbGame.updateGame(game.gameRef, {
				gameStatus: "dealing",
			});
			console.log(res1);

			//get new deck
			const { deck_id } = await cardMachine.newDeck();

			//update deckId in db : game && player-me
			let promiseList = [];
			if (!game.deckId) {
				promiseList.push(fbGame.updateGame(game.gameRef, { deckId: deck_id }));
			}
			if (!me.deckId) {
				promiseList.push(
					fbGame.updatePlayer(me.playerRef, {
						deckId: deck_id,
						status: "playing",
					})
				);
			}
			const res = await Promise.all(promiseList);
			res.forEach((msg) => console.log(msg)); //success message

			//draw two cards each ->setGame, setPlayers
			if (!game.dealer) {
				const { cards } = await cardMachine.drawTwoCards(deck_id);
				await fbGame.updateGameDealer(game.gameRef, ...cards);
			}
			if (!me.hand) {
				const { cards } = await cardMachine.drawTwoCards(deck_id);
				await fbGame.updatePlayerHand(me.playerRef, ...cards);
			}
		} catch (err) {
			console.error(err.message);
		}
	};

	useEffect(() => {
		if (!players || !game) {
			console.log("Players or game state not loaded.");
			return;
		}
		if (game.playersCount !== fbGame.maxPlayers) return;

		//ask to place a bet
		if (
			me.status === "waiting" &&
			me.bet == 0 &&
			game.gameStatus === "waiting"
		) {
			//ask to place a bet
			toggleTrueBet((pre) => !pre);
		}
		//set up game intial draw stage
		// if (
		// 	players.every((player) => player.bet > 0) &&
		// 	game.gameStatus === "waiting"
		// ) {
		// 	playingInitialDraw();
		// }
	}, [players, game]);

	useEffect(() => {
		if (!players || !game) {
			console.log("Players or game state not loaded.");
			return;
		}
		//quit game if player leaves
		if (game.playersCount !== fbGame.maxPlayers) {
			cancelGame();
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
		<div className="game">
			<Popup isOpen={popBet} handleBtnLeft={handleAddBet} btnLeftText="Confirm">
				<h2 className="pop-title">Place a bet</h2>
				<input
					className="pop-input"
					ref={betRef}
					placeholder="Enter a bet ..."
					type="number"
					min="1"
				/>
			</Popup>
			<Popup
				isOpen={popLeaveGame}
				handleBtnLeft={() => nav("/")}
				btnLeftText="Confirm"
			>
				<h2 className="pop-title">
					Someone has left the game ... going back to lobby
				</h2>
			</Popup>
			{console.log(
				"* ~ * ~ * ~ * ~ * re-render * ~ * ~ * ~ * ~ *in game",
				game
			)}
			{console.log(user)}
			{console.log(players)}
			<button onClick={handleQuitGame}>Quit game</button>
			<div className="game__opponents-container"></div>
			<div className="game__dealer-container"></div>
			<div className="game__me-container"></div>
			<div className="game__control-board"></div>
		</div>
	);
};

export default Game;
