import React, { useRef, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../Firebase/FirebaseAuthentification/AuthProvider";
import { db } from "../../Firebase/Config";
import * as fbGame from "../../Firebase/FirestoreDatabase/firebaseGame";
import {
	onSnapshot,
	collection,
	getDoc,
	getDocs,
	doc,
	increment,
	runTransaction,
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
	const { gameId } = useParams();
	const [game, setGame] = useState(null);
	const [players, setPlayers] = useState(null);
	const gameDocRef = useRef(null); //from gameId in params
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
	const [popGameOver, toggleTrueGameOver, toggleFalseGameOver] =
		useToggle(false);
	const [popQuitGame, toggleTrueQuitGame, toggleFalseQuitGame] =
		useToggle(false);

	const getMe = (playersList) =>
		playersList?.find((player) => player?.id === user?.uid);
	const me = getMe(players);

	const getOpponents = (playersList) =>
		playersList?.filter((player) => player?.id !== user?.uid);
	const opponents = getOpponents(players);
	89;
	const getCurrentPlayer = (playersList) =>
		// game?.gameStatus !== "gameOver" &&
		// game?.gameStatus !== "dealerTurn" &&
		playersList?.find(
			(player) => player?.donePlaying === false && player?.status === "playing" // with bet and initial draws ready, not lost/won/tie yet
		);
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

	//pop & ask to place a bet & update deckId
	const handleAddBet = async () => {
		const betStr = betRef.current.value;
		//validate betStr a positive integer
		if (!/^[1-9]\d*$/.test(betStr.trim())) {
			console.log("Invalid bet");
			return;
		}
		try {
			//update player's bet in db
			await fbGame.updatePlayer(me.playerRef, {
				bet: +betStr, //get number
				deckId: game.deckId,
			});
			toggleFalseBet();
			await drawInitalCards(game.deckId);
		} catch (err) {
			console.error(err);
		}
	};

	//pop & ask to place a bet
	const drawInitalCards = async (deckId) => {
		// Game intial draws for both dealer and I.
		const num = 2;
		try {
			if (
				//dealer has not drawn 2 cards -> draw 2 cards
				game.gameStatus === "waiting" &&
				(!game.dealer || !game.dealer.length)
			) {
				const { cards } = await cardMachine.drawCards(deckId, num);
				const resp = await fbGame.updateGameDealer(gameDocRef.current, cards);
				console.log(resp);
			}

			if (
				//draw initial 2 cards for myself if not done yet.
				!me.hand ||
				!me.hand.length
			) {
				const { cards } = await cardMachine.drawCards(deckId, num);
				const resp = await fbGame.updatePlayerHand(me.playerRef, cards);
				console.log(resp);
			}
			let promiseList = [];
			if (game.gameStatus === "waiting") {
				promiseList.push(
					fbGame.updateGame(gameDocRef.current, { gameStatus: "playerTurn" })
				);
			}
			promiseList.push(
				fbGame.updatePlayer(me.playerRef, { deckId, status: "playing" })
			);
			const res = await Promise.all(promiseList);
			res.forEach((msg) => console.log(msg)); //success message

			//immediately check for blackjack
			await blackjackOutcome();
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
		const IHaveBlackjack = cardsCalculator.hasBlackjack(updatedMe.hand);
		const dealerHasBlackjack = cardsCalculator.hasBlackjack(updatedGame.dealer);

		let playerUpdates;
		let dealerUpdates;

		if (IHaveBlackjack && !dealerHasBlackjack) {
			//I won against the dealer
			//game continues for the rest
			playerUpdates = {
				donePlaying: true,
				canHit: false,
				playerUpdates,
				status: "won",
				hasBlackjack: true,
			};
			//toggleTrueGameOver(); //only scenario where i won before game is over.
		} else if (!IHaveBlackjack && dealerHasBlackjack) {
			//I lost against the dealer
			playerUpdates = {
				donePlaying: true,
				canHit: false,
				playerUpdates,
				status: "lost",
				hasBlackjack: false,
			};
			dealerUpdates = { dealerHasBlackjack: true, gameStatus: "gameOver" };
		} else if (IHaveBlackjack && dealerHasBlackjack) {
			//push/tie
			playerUpdates = {
				donePlaying: true,
				canHit: false,
				playerUpdates,
				status: "push",
				hasBlackjack: true,
			};
			dealerUpdates = { dealerHasBlackjack: true, gameStatus: "gameOver" };
		}
		//if neither has -> continue game
		try {
			if (dealerUpdates && playerUpdates) {
				await runTransaction(db, async (transaction) => {
					transaction.update(updatedGame.gameRef, dealerUpdates);
					transaction.update(updatedMe.playerRef, playerUpdates);
				});
				console.log("Updated player and dealer");
			} else if (dealerUpdates) {
				const res = await fbGame.updateGame(updatedGame.gameRef, dealerUpdates);
				console.log(res);
			} else if (playerUpdates) {
				const res = await fbGame.updatePlayer(
					updatedMe.playerRef,
					playerUpdates
				);
				console.log(res);
			}

			await checkForNextPlayer();
		} catch (err) {
			console.log(err);
		}
	};

	const checkForNextPlayer = async () => {
		//create a local currentPlayer with the latest players list from ref.
		const updatedCurrentPlayer = getCurrentPlayer(playersRef.current);

		//get the latest game from gameRef.
		const updatedGame = gameRef.current;

		console.log("|||||||||||||||", updatedCurrentPlayer);
		const needDealerTurn = playersRef.current.some(
			(player) => player.donePlaying === true && player.status === "playing"
		);
		try {
			//check if last player
			if (!updatedCurrentPlayer && updatedGame.gameStatus === "playerTurn") {
				let status = needDealerTurn ? "dealerTurn" : "gameOver";

				const res = await fbGame.updateGame(game.gameRef, {
					gameStatus: status,
				});
				console.log(res);
				return;
			}
		} catch (err) {
			throw new Error(err);
		}
	};

	const handleQuitGame = async () => {
		try {
			//resets game if player leaves game before setTimeOut
			//Prevent every player resets the game.
			await handleResetGame();
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

	const resetDataPlayer = {
		bet: 0,
		busted: false,
		canHit: true,
		donePlaying: false,
		doubleBet: false,
		hasBlackjack: false,
		status: "waiting",
		hand: [],
		timestamp: Date.now(),
	};
	const resetDataGame = {
		dealerHasBlackjack: false,
		gameStatus: "waiting",
		dealer: [],
	};
	//determine to clean-up game or me or both.
	const handleResetGame = async () => {
		try {
			//Prevent every player resets the game.
			if (game.gameStatus === "gameOver") {
				//reset game and EVERY player in curent round.
				let promises = players.map((player) => {
					if (player.status !== "waiting")
						fbGame.updatePlayer(player.playerRef, resetDataPlayer);
				});
				promises.push(fbGame.updateGame(game.gameRef, resetDataGame));
				let res = await Promise.all(promises);
				res.forEach((msg) => console.log(msg));
			} else if (me.status === "won" || me.status === "busted") {
				await fbGame.updatePlayer(me.playerRef, resetDataPlayer);
				console.log("Reset myself");
			}
		} catch (err) {
			console.log(err.message);
		}
		toggleFalseGameOver(); //please stop here it is the working version!!!
	};

	const updateIsBusted = async (player) => {
		try {
			const res = await fbGame.updatePlayer(player.playerRef, {
				busted: true,
				canHit: false,
				donePlaying: true,
				status: "busted",
			});
			console.log(res);
			return;
		} catch (err) {
			console.log(err);
		}
	};

	const handleHit = async () => {
		try {
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

			//check if total === 21 -> canHit -> false/must stand
			if (cardsCalculator.has21(updatedCurrentPlayer.hand)) {
				const res = await fbGame.updatePlayer(currentPlayer.playerRef, {
					canHit: false,
				});
				console.log(res);
				return;
			}

			//check if busted  === true -> canHit -> false
			if (cardsCalculator.isBusted(updatedCurrentPlayer.hand)) {
				await updateIsBusted(updatedCurrentPlayer);
				await checkForNextPlayer();
				//toggleTrueGameOver();
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

	//attach listeners
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
		console.log("**Firestore listener on game mounted/attached.**");
		const unsubscribePlayers = addPlayersListeners(gameDocRef.current);
		console.log("**Firestore listener on players mounted/attached.**");

		return () => {
			unsubscribeGame?.();
			console.log("**Firestore listener on game UNmounted/attached.**");
			unsubscribePlayers?.();
			console.log("**Firestore listener on players UNmounted/attached.**");
		};
	}, [user?.uid, gameId]);

	//Notify as other player enter/leaves
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
		}
		//updates prePlayerId ref
		prePlayerIdRef.current.prePlayerId = game.playerId;
	}, [game?.playersCount]);

	//ask to place a bet
	useEffect(() => {
		if (!players || !game) {
			console.log("Players or game state not loaded.");
			return;
		}

		//ask to place a bet
		if (
			me?.status === "waiting" &&
			me?.bet === 0 &&
			game?.gameStatus !== "gameOver" &&
			game?.gameStatus !== "dealerTurn"
		)
			//ask to place a bet
			toggleTrueBet();
		else toggleFalseBet();
	}, [players, game]);

	//if deck is not ready
	useEffect(() => {
		if (!game) return;
		if (game.deckId !== null) return;
		const updateNewDeck = async () => {
			try {
				//get new deck
				const { deck_id } = await cardMachine.newDeck(game.maxPlayers);

				await fbGame.updateGame(game.gameRef, { deckId: deck_id });
				console.log(`Updated game deckId -> ${deck_id}`);
			} catch (err) {
				console.error(err);
			}
		};
		if (game.deckId === null) updateNewDeck();
	}, [game?.deckId]);

	//if gameStatus ==="gameOver" -> cleanup game doc
	//if me.status ==="won" or "busted" -> cleanup myself
	useEffect(() => {
		if (!game || !user || !players) return;
		let timer;
		if (
			(game.gameStatus === "gameOver" && me.status !== "waiting") ||
			me.status === "won" ||
			me.status === "busted"
		) {
			toggleTrueGameOver();
			timer = setTimeout(async () => await handleResetGame(), 10000); //reset
		} else toggleFalseGameOver();
		return () => {
			if (timer) {
				clearTimeout(timer);
				console.log("Timer cleared");
			}
		};
	}, [game?.gameStatus, players, user]);

	const controlBoardCondition = () =>
		game?.gameStatus === "playerTurn" &&
		currentPlayer?.id === user?.uid &&
		currentPlayer?.donePlaying === false;

	const handleDBetCondition = () =>
		currentPlayer?.hand?.length === 2 && currentPlayer?.doubleBet === false;

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
				isOpen={popGameOver}
				handleBtnLeft={handleQuitGame}
				handleBtnRight={handleResetGame}
				btnLeftText="Leave Game"
				btnRightText="Stay for another round"
			>
				<div>
					<h2 className="popup___title">Blackjack result</h2>
					{console.log(me)}
					{me?.status === "won" && me.hasBlackjack === true ? (
						<div className="popup__text">
							You beat dealer with Blackjack and won ${(me.bet * 3) / 2}!
						</div>
					) : me?.status === "push" ? (
						<div className="popup__text">You are tie with dealer!</div>
					) : me?.status === "lost" && game.dealerHasBlackjack === true ? (
						<div className="popup__text">
							The dealer beat you with Blackjack and you lost ${me.bet}
						</div>
					) : me?.status === "busted" ? (
						<div className="popup__text">You are busted.</div>
					) : me?.status === "won" ? (
						<div></div>
					) : me?.status === "lost" ? (
						<div></div>
					) : me?.status === "push" ? (
						<></>
					) : (
						<></>
					)}
				</div>
			</Popup>
			<Popup
				isOpen={popQuitGame}
				handleBtnLeft={toggleFalseQuitGame}
				handleBtnRight={handleQuitGame}
				btnLeftText="Cancel"
				btnRightText="Quit Game"
			>
				<h2 className="pop-title">Going back to lobby</h2>
			</Popup>

			{console.log(
				"^ ~ ^ ~ ^ ~ ^ ~ ^ re-render ^ ~ ^ ~ ^ ~ ^ ~ ^ in ongoing game"
			)}
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
								me?.hasBlackjack === false &&
								game?.dealerHasBlackjack === false
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
					{currentPlayer?.canHit === true && (
						<button onClick={handleHit}>Hit!</button>
					)}
					<button onClick={handleStand}>Stand</button>
					{handleDBetCondition() && (
						<button onClick={handleDBet}>Double Down</button>
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
