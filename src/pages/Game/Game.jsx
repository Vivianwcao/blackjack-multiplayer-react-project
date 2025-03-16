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
	increment,
} from "firebase/firestore";
import Popup from "../../components/Popup/Popup";
import "./Game.scss";
import useToggle from "../../utils/hooks/useToggle";
import * as cardMachine from "../../utils/api-helper/cardMachine";
import * as cardsCalculator from "../../utils/cardsCalculators";
import { useGameContext } from "../../components/gameProvider";
const backOfCardImg = "https://deckofcardsapi.com/static/img/back.png";

const Game = () => {
	const { user } = useAuth();
	const { removeEmptyGame } = useGameContext();
	const { gameId } = useParams();
	const [game, setGame] = useState(null);
	const [players, setPlayers] = useState(null);
	const gameDocRef = useRef(null);
	const betRef = useRef(null);

	const nav = useNavigate();

	//Toggle functions
	const [popBet, toggleTrueBet, toggleFalseBet] = useToggle(false);
	const [popGameCloses, toggleTrueGameCloses, toggleFalseGameCloses] =
		useToggle(false);
	const [popQuitGame, toggleTrueQuitGame, toggleFalseQuitGame] =
		useToggle(false);

	const findMe = () => players?.find((player) => player.id === user?.uid);
	const me = findMe();
	const currentPlayer = players?.at(game?.currentPlayerIndex);
	const opponents = players?.filter((player) => player.id !== user?.uid);

	//listeners on list of players
	const addPlayersListeners = (gameRef) => {
		if (!gameRef) return null;
		const playersCollectionRef = collection(
			gameRef,
			fbGame.playersCollectionName
		);
		return onSnapshot(playersCollectionRef, (snapshot) => {
			// if (snapshot.size !== fbGame.maxPlayers) {
			// 	//setPlayers([]);
			// 	return null;
			// }
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
		try {
			//get new deck
			const { deck_id } = await cardMachine.newDeck();

			if (
				//meaning "me" is the last to place bet
				players
					.filter((player) => player.id !== user.uid)
					.every((player) => player.bet > 0)
			) {
				//Everyone has placed their bet
				//update gameStatus -> dealing
				//update deckId in db : game && all players
				let promiseList = [];
				promiseList.push(
					fbGame.updateGame(gameDocRef.current, {
						deckId: deck_id,
						gameStatus: "dealing",
					})
				);
				players.forEach((player) =>
					promiseList.push(
						fbGame.updatePlayer(player.playerRef, {
							deckId: deck_id,
							status: "playing",
						})
					)
				);
				const res = await Promise.all(promiseList);
				res.forEach((msg) => console.log(msg)); //success message

				await playingInitialDraw(deck_id);
				//update gameStatus -> playerTurn
				const res1 = await fbGame.updateGame(game.gameRef, {
					gameStatus: "playerTurn",
				});
				console.log(res1);
			}
		} catch (err) {
			console.error(err.message);
		}
	};

	//gameStatus -> "dealing"
	//api call -> get deck, first 2 cards
	//player status -> "playing"
	const playingInitialDraw = async (deck_id) => {
		try {
			//draw two cards each ->setGame, setPlayers
			const totalNum = 2 * (game.playersCount + 1);
			const { cards } = await cardMachine.drawCards(deck_id, totalNum);

			//populate each player's hand
			let promises = players.map((player) => {
				let cardsForEach = cards.splice(0, 2);
				return fbGame.updatePlayerHand(player.playerRef, cardsForEach);
			});
			promises.push(fbGame.updateGameDealer(gameDocRef.current, cards));
			const resp = await Promise.all(promises);
			resp.forEach((msg) => console.log(msg));
		} catch (err) {
			console.error(err.message);
		}
	};

	const handleQuitGame = async () => {
		try {
			await fbGame.removePlayerFromGame(me.playerRef, game.gameRef);
			await removeEmptyGame(game.gameRef);

			nav("/");
		} catch (err) {
			console.log(err.message);
		}
	};

	const checkForNextPlayer = async () => {
		try {
			//check if last player yes -> dealer turn
			const currentPlayerI = game.currentPlayerIndex;
			if (currentPlayerI === game.playersCount - 1) {
				//yes -> dealer turn
				const res = await fbGame.updateGame(game.gameRef, {
					gameStatus: "dealerTurn",
				});
				console.log(res);
				return;
			}
			if (currentPlayerI < game.playersCount - 1) {
				//yes -> change gameStatus currentPlayerIndex +1
				const res = await fbGame.updateGame(game.gameRef, {
					currentPlayerIndex: increment(1),
				});

				console.log(res);
				return;
			}
		} catch (err) {
			throw new Error(err.message);
		}
	};

	const handleHit = async () => {
		try {
			//Re-shuffle deck
			await cardMachine.shuffleDeck(currentPlayer.deckId);
			//draw one card
			const { cards } = await cardMachine.drawSingleCard(currentPlayer.deckId);
			await fbGame.updatePlayerHand(currentPlayer.playerRef, cards);

			//check if doubleBet === true -> no more hit
			if (currentPlayer.doubleBet === true) {
				const res = await fbGame.updatePlayer(currentPlayer.playerRef, {
					canHit: false,
				});
				console.log(res);
			}
			//check if busted latency error!
			if (cardsCalculator.isBusted(currentPlayer.hand)) {
				const res = await fbGame.updatePlayer(currentPlayer.playerRef, {
					busted: true,
					status: "lost",
				});
				console.log(res);
				await checkForNextPlayer();
				return;
			}
		} catch (err) {
			console.log(err.message);
		}
	};
	const handleStand = async () => {
		//check if last player is a player or dealer
		await checkForNextPlayer();
	};
	const handleDBet = async () => {
		try {
			const res = await fbGame.updatePlayer(currentPlayer.playerRef, {
				bet: 2 * currentPlayer.bet,
				doubleBet: true,
			});
			console.log(res);
		} catch (err) {
			console.log(err.message);
		}
	};

	useEffect(() => {
		if (!players || !game) {
			console.log("Players or game state not loaded.");
			return;
		}
		//quit game if player leaves
		if (game.playersCount < fbGame.maxPlayers) {
			// cancelGame();
			toggleTrueGameCloses();
		}
	}, [players, game]);

	useEffect(() => {
		if (!players || !game) {
			console.log("Players or game state not loaded.");
			return;
		}

		//ask to place a bet
		if (
			me.status === "waiting" &&
			me.bet == 0 &&
			game.gameStatus === "waiting"
		) {
			//ask to place a bet
			toggleTrueBet((pre) => !pre);
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

	const controlBoardCondition = () =>
		game?.gameStatus === "playerTurn" &&
		currentPlayer?.id === user?.uid &&
		currentPlayer?.busted === false;

	const handleDBetCondition = () =>
		currentPlayer?.hand.length === 2 && currentPlayer?.doubleBet === false;

	return !user?.uid ? (
		<div>Please log in first</div>
	) : !game?.playerId.includes(user.uid) ? (
		<div>You are not in this game</div>
	) : (
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
				isOpen={popGameCloses}
				handleBtnLeft={toggleFalseGameCloses}
				btnLeftText="Confirm"
			>
				<h2 className="pop-title">
					Someone has left the game ... game continues ...
				</h2>
			</Popup>
			<Popup
				isOpen={popQuitGame}
				handleBtnLeft={toggleFalseQuitGame}
				handleBtnRight={handleQuitGame}
				btnLeftText="Cancel"
				btnRightText="Quit Game"
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
			<button onClick={toggleTrueQuitGame}>Quit game</button>
			<div className="game__opponents-container">
				{opponents?.map((player) =>
					player?.hand?.map(({ image, code }, i) => (
						<div key={i}>
							<img
								className="game__card game__card--opponent"
								src={image}
								alt={code}
							/>
						</div>
					))
				)}
			</div>
			<div className="game__dealer-container">
				{game?.dealer?.map(({ image, code }, i) => (
					<div key={i}>
						<img
							className="game__card game__card--dealer"
							src={
								i === 1 && game?.gameStatus !== "dealerTurn"
									? backOfCardImg
									: image
							}
							alt={code}
						/>
					</div>
				))}
			</div>
			<div className="game__me-container">
				{me?.hand?.map(({ image, code }, i) => (
					<div key={i}>
						<img className="game__card game__card--me" src={image} alt={code} />
					</div>
				))}
			</div>
			{console.log("+++++++++", game?.currentPlayerIndex)}
			{console.log("+++++++++", currentPlayer?.id)}
			{console.log("+++++++++", user?.uid)}
			{controlBoardCondition() && (
				<div className="game__control-board">
					{currentPlayer.canHit === true && (
						<button onClick={handleHit}>Hit!</button>
					)}
					<button onClick={handleStand}>Stand</button>
					{handleDBetCondition() && (
						<button onClick={handleDBet}>Double bet</button>
					)}
				</div>
			)}
			<div className="game__info">
				<p>My bet: ${me?.bet}</p>
			</div>
		</div>
	);
};

export default Game;
