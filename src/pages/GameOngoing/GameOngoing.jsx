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
import { toast, Slide } from "react-toastify";
import Popup from "../../components/Popup/Popup";
import useToggle from "../../utils/hooks/useToggle";
import * as cardMachine from "../../utils/api-helper/cardMachine";
import * as cardsCalculator from "../../utils/cardsCalculators";
import { showToast } from "../../components/Toasts/Toast";
import "./GameOngoing.scss";

const backOfCardImg = "https://deckofcardsapi.com/static/img/back.png";

const GameOngoing = () => {
	const { user, users } = useAuth();
	const { gameOngoingId } = useParams();
	const [game, setGame] = useState(null);
	const [players, setPlayers] = useState(null);
	const gameDocRef = useRef(null);
	const betRef = useRef(null);

	const gameRef = useRef(game);

	//get the latest game doc before next batch re-render
	useEffect(() => {
		gameRef.current = game;
	}, [game]);

	const playersRef = useRef(players);

	//get the latest players list before next batch re-render
	useEffect(() => {
		playersRef.current = players;
	}, [players]);

	const prePlayerIdRef = useRef({
		prePlayerId: [],
		initialRender: true,
	});

	//get the very initial playerId list once game state loads.
	useEffect(() => {
		if (!game?.playerId?.length) return; //if game not loaded/no players in yet
		if (prePlayerIdRef.current.initialRender === true) {
			prePlayerIdRef.current.prePlayerId = game.playerId; //only run once
			prePlayerIdRef.current.initialRender = false;
			return;
		}
	}, [game?.playerId]);

	const nav = useNavigate();

	//Toggle functions
	const [popBet, toggleTrueBet, toggleFalseBet] = useToggle(false);
	const [popGameCloses, toggleTrueGameCloses, toggleFalseGameCloses] =
		useToggle(false);
	const [popQuitGame, toggleTrueQuitGame, toggleFalseQuitGame] =
		useToggle(false);

	const getMe = (playersList) =>
		playersList?.find((player) => player?.id === user?.uid);
	const me = getMe(players);

	const getOpponents = (playersList) =>
		playersList?.filter((player) => player?.id !== user?.uid);
	const opponents = getOpponents(players);

	const getCurrentPlayer = (playersList) =>
		playersList?.find((player) => player?.donePlaying === false);
	const currentPlayer = getCurrentPlayer(players);

	//listeners on list of players
	const addPlayersListeners = (gameRef) => {
		if (!gameRef) return null;
		const playersCollectionRef = collection(
			gameRef,
			fbGame.playersCollectionName
		);
		return onSnapshot(playersCollectionRef, (snapshot) => {
			let newList = [];
			snapshot.docs.map((doc) => newList.push({ id: doc.id, ...doc.data() }));
			newList.sort((a, b) => a.timestamp - b.timestamp);
			//playersRef.current = newList; //get the latest players list before setPlayers
			setPlayers(newList);
			console.log("**setPlayers successfully.**");
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

			setGame(snapshot.data());
			console.log("**setGame successfully.**");
		});
	};

	const handleGameCloses = () => {
		if (game?.gameStatus === "waiting") nav("/");
		toggleFalseGameCloses();
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
			const { deck_id } = await cardMachine.newDeck(game.maxPlayers);

			//get the latest players from playersRef.
			const updatedPlayers = playersRef.current;
			console.log("~~~~~~~~~~", updatedPlayers);
			if (
				//meaning "me" is the last to place bet
				updatedPlayers.every((player) => player.bet > 0)
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
			console.error(err);
		}
	};

	const blackjackOutcome = async () => {
		//create a local me off the updated playersRef.
		const updatedMe = getMe(playersRef.current);

		//get the latest game from gameRef.
		const updatedGame = gameRef.current;

		console.log("!!!!!!!!!!!!", updatedMe.hand, updatedGame.dealer);

		//check for if anyone has natural blackjack(first 2 cards)
		const IHaveBlackjack = cardsCalculator.hasBlackJack(updatedMe.hand);
		const dealerHasBlackjack = cardsCalculator.hasBlackJack(updatedGame.dealer);

		let updates = { donePlaying: true, canHit: false };
		if (IHaveBlackjack && !dealerHasBlackjack) {
			//I win against the dealer
			updates = { ...updates, status: "win", hasBlackJack: true };
		} else if (!IHaveBlackjack && dealerHasBlackjack) {
			//I lost against the dealer
			updates = { ...updates, status: "lost", hasBlackJack: false };
		} else if (IHaveBlackjack && dealerHasBlackjack) {
			//push/tie
			updates = { ...updates, status: "push", hasBlackJack: true };
		}
		//if neither has -> continue game
		try {
			const res = await fbGame.updatePlayer(updatedMe, updates);
			console.log(res);
		} catch (err) {
			console.log(err);
		}
	};

	//gameStatus -> "dealing"
	//api call -> get deck, first 2 cards
	//immediately check for blackjack
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

			await blackjackOutcome();
		} catch (err) {
			console.error(err);
		}
	};

	const handleQuitGame = async () => {
		try {
			await fbGame.removePlayerFromGame(me.playerRef, game.gameRef);

			nav("/");
			let delay = setTimeout(
				async () => await fbGame.removeEmptyGame(game.gameRef),
				300
			);
			const cancelTimeout = () => clearTimeout(delay);
		} catch (err) {
			console.log(err);
		}
	};

	const checkForNextPlayer = async () => {
		//create a local currentPlayer with the latest players list from ref.
		const updatedCurrentPlayer = getCurrentPlayer(playersRef.current);
		try {
			//check if last player yes -> dealer turn
			if (!updatedCurrentPlayer) {
				//yes -> dealer turn
				const res = await fbGame.updateGame(game.gameRef, {
					gameStatus: "dealerTurn",
				});
				console.log(res);
				return;
			}
		} catch (err) {
			throw new Error(err);
		}
	};

	const updateIsBusted = async (player) => {
		try {
			const res = await fbGame.updatePlayer(player.playerRef, {
				busted: true,
				canHit: false,
				donePlaying: true,
				status: "lost",
			});
			console.log(res);
			return;
		} catch (err) {
			console.log(err);
		}
	};

	const handleHit = async () => {
		try {
			//Re-shuffle deck
			await cardMachine.shuffleDeck(game.deckId);
			//draw one card
			const { cards } = await cardMachine.drawSingleCard(game.deckId);
			await fbGame.updatePlayerHand(currentPlayer.playerRef, cards);

			//check if doubleBet === true -> canHit -> false
			if (currentPlayer.doubleBet === true) {
				const res = await fbGame.updatePlayer(currentPlayer.playerRef, {
					canHit: false,
				});
				console.log(res);
			}

			//create a local currentPlayer with the latest players list from ref.
			const updatedCurrentPlayer = getCurrentPlayer(playersRef.current);

			//check if busted  === true -> canHit -> false
			if (cardsCalculator.isBusted(updatedCurrentPlayer.hand)) {
				await updateIsBusted(updatedCurrentPlayer);
				await checkForNextPlayer();
				return;
			}
		} catch (err) {
			console.log(err);
		}
	};
	const handleStand = async () => {
		try {
			const res = await fbGame.updatePlayer(currentPlayer.playerRef, {
				canHit: false,
				donePlaying: true,
			});
			console.log(res);

			//check if last player is a player or dealer
			await checkForNextPlayer();
			return;
		} catch (err) {
			console.log(err);
		}
	};

	const handleDBet = async () => {
		try {
			const res = await fbGame.updatePlayer(currentPlayer.playerRef, {
				bet: 2 * currentPlayer.bet,
				doubleBet: true,
			});
			console.log(res);
		} catch (err) {
			console.log(err);
		}
	};

	useEffect(() => {
		if (!user) {
			console.log("User not loaded yet");
			return; // No cleanup needed if user isn’t ready
		}
		if (!players || !game) {
			console.log("Players or game state not loaded.");
			return;
		}
		if (!users) {
			console.log("Users not loaded yet");
			return; // No cleanup needed if user isn’t ready
		}
		//console.log("!!!!!!!!!", game.playerId, prePlayerIdRef.current.prePlayerId);
		const prePIds = prePlayerIdRef.current.prePlayerId;

		//notify user of player quits (anytime))/joins(while gameStatus === 'waiting')
		if (game.playersCount > prePIds.length) {
			// let pId = game.playerId[game.playersCount - 1];
			let pId;
			for (let id of game.playerId) {
				if (!prePIds?.includes(id)) {
					pId = id; //find the new player who enters
				}
			}
			pId !== user.uid &&
				showToast(
					`${
						users?.find((user) => user.id === pId)?.name || "Someone "
					} enters ...`
				);
		}

		if (game.playersCount < prePIds.length) {
			let pId;
			for (let id of prePIds) {
				if (!game.playerId.includes(id)) {
					pId = id; //find the player who left
				}
			}
			//show toast on other users' page
			pId !== user.uid &&
				showToast(
					`${
						users?.find((user) => user.id === pId)?.name || "Someone "
					} left ...`
				);
			//if !initial draw -> go back to lobby page.
			game?.gameStatus === "waiting" && nav("/");
		}
		//updates prePlayerId ref
		prePlayerIdRef.current.prePlayerId = game.playerId;
	}, [game?.playersCount]);

	useEffect(() => {
		if (!players || !game) {
			console.log("Players or game state not loaded.");
			return;
		}

		//ask to place a bet
		if (
			me?.status === "waiting" &&
			me?.bet == 0 &&
			game?.gameStatus === "waiting" &&
			game?.playersCount === game?.maxPlayers
		)
			//ask to place a bet
			toggleTrueBet();
		else toggleFalseBet();
	}, [players, game]);

	useEffect(() => {
		if (!user?.uid) {
			console.log("User not loaded yet");
			return; // No cleanup needed if user isn’t ready
		}

		//set ref using game id from params.
		gameDocRef.current = fbGame.getGameDocRef(
			fbGame.gamesCollectionName,
			gameOngoingId
		);
		//attach listeners
		const unsubscribeGame = addGameListener(gameDocRef.current);
		console.log("**Firestore listener on game mounted/attached.**");
		const unsubscribePlayers = addPlayersListeners(gameDocRef.current);
		console.log("**Firestore listener on players mounted/attached.**");

		return () => {
			unsubscribeGame?.();
			console.log("**Firestore listener on game UNmounted/attached.**");
			unsubscribePlayers?.();
			console.log("**Firestore listener on players UNmounted/attached.**");
		};
	}, [user?.uid, gameOngoingId]);

	const controlBoardCondition = () =>
		game?.gameStatus === "playerTurn" &&
		currentPlayer?.id === user?.uid &&
		currentPlayer?.donePlaying === false;

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
				handleBtnLeft={handleGameCloses}
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

			{console.log("* ~ * ~ * ~ * ~ * re-render * ~ * ~ * ~ * ~ * in game")}
			{console.log(players)}
			{/* { console.log( user ) } */}

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
								i === 1 &&
								game?.gameStatus !== "dealerTurn" &&
								me?.hasBlackJack === false
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
				<p>
					My total hand: Low:
					{me?.hand && cardsCalculator.calculateHand(me.hand).min} High:
					{me?.hand && cardsCalculator.calculateHand(me.hand).max}
				</p>
			</div>
		</div>
	);
};

export default GameOngoing;
