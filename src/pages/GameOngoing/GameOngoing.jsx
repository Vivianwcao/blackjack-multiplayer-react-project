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
import { showToast, showToastCenter } from "../../components/Toasts/Toast";
import "../style.scss";
import "./GameOngoing.scss";

const backOfCardImg = "https://deckofcardsapi.com/static/img/back.png";

const GameOngoing = () => {
	const { user, users } = useAuth();
	const { gameId } = useParams();
	const [game, setGame] = useState(null);
	const [players, setPlayers] = useState(null);
	const gameDocRef = useRef(null); //from gameId in params
	const betRef = useRef(null);

	//check if toast has been displayed for "waiting" players while game is pending to be rest.
	const resetGameToastRef = useRef(true);

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
	const timerResetGame = 10000; //time before resetGame() is triggered.
	const timerToggleOpenPop = 3500; //time before pop-up is triggered.
	const timerPlayerMove = 60000; //60 secs for the current player to make a move

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

	const getCurrentPlayer = (playersList) =>
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
			//update timestamp -> playing order based on who places bet first
			await fbGame.updatePlayer(me.playerRef, {
				bet: +betStr, //get number
				deckId: game.deckId,
				timestamp: Date.now(),
			});
			toggleFalseBet();
			await drawInitalCards(game.deckId);
		} catch (err) {
			console.error(err);
		}
	};

	//Initial draw 2cards
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
		const IHaveBlackjack = cardsCalculator.has21(updatedMe.hand);
		const dealerHasBlackjack = cardsCalculator.has21(updatedGame.dealer);

		let playerUpdates;
		let dealerUpdates;

		if (IHaveBlackjack && !dealerHasBlackjack) {
			//I won against the dealer
			//game continues for the rest
			playerUpdates = {
				donePlaying: true,
				canHit: false,
				status: "won",
				hasBlackjack: true,
			};
			//toggleTrueGameOver(); //only scenario where i won before game is over.
		} else if (!IHaveBlackjack && dealerHasBlackjack) {
			//I lost against the dealer
			playerUpdates = {
				donePlaying: true,
				canHit: false,
				status: "lost",
				hasBlackjack: false,
			};
			dealerUpdates = { dealerHasBlackjack: true, gameStatus: "gameOver" };
		} else if (IHaveBlackjack && dealerHasBlackjack) {
			//push/tie
			playerUpdates = {
				donePlaying: true,
				canHit: false,
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
				//trigger dealer moves.
				if (status === "dealerTurn") await dealerMoves();
				return;
			} else {
				//if next player exists
				//add a initial timestamp to currentPlayer at the beginning of his turn

				if (!updatedCurrentPlayer.playerTurnTimestamp) {
					const res = await fbGame.updatePlayer(
						updatedCurrentPlayer.playerRef,
						{
							playerTurnTimestamp: Date.now(),
						}
					);
					console.log(res);
				}
			}
		} catch (err) {
			console.log(err);
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

	const resetDataPlayer = {
		bet: 0,
		busted: false,
		canHit: true,
		donePlaying: false,
		doubleBet: false,
		hasBlackjack: false,
		status: "waiting",
		hand: [],
		timestamp: Date.now(), //optional or redundent -> order is based on when bet is placed
		playerTurnTimestamp: null,
	};
	const resetDataGame = {
		dealerHasBlackjack: false,
		dealerisBusted: false,
		gameStatus: "waiting",
		dealer: [],
	};
	//determine to clean-up game or me or both.
	const handleResetGame = async () => {
		try {
			//Prevent every player resets the game.
			if (game.gameStatus === "gameOver") {
				//reset game and EVERY player in CURRENT round.
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
		popGameOver && toggleFalseGameOver(); //close pop-up if open
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

	const removeInactiveCurrentPlayer = () => {
		if (!currentPlayer?.playerTurnTimestamp) return;
		const waitTime = Date.now() - currentPlayer.playerTurnTimestamp;
		//console.log("WAIT TIME: ", waitTime);
		if (waitTime > timerPlayerMove) {
			//remove inactive player
			fbGame
				.removePlayerFromGame(currentPlayer.playerRef, game.gameRef)
				.catch((err) => console.log(err));
		} else {
			showToastCenter(
				`The current player is still active. Please try again in ${Math.ceil(
					(timerPlayerMove - waitTime) / 1000
				)} seconds.`
			);
		}
	};

	const dealerMoves = async () => {
		//get the latest game from gameRef.
		const updatedGame = gameRef.current;
		if (updatedGame.gameStatus !== "dealerTurn") return;

		//create local copies
		let localDealerHand = updatedGame.dealer; //initial hand (list of two cards)
		let localScore = cardsCalculator.calculateHand(localDealerHand); //initial score

		console.log("@@@@@@@@, ", gameRef.current.dealer);

		//draw all cards locally, and update at once.
		try {
			while (localScore <= 16) {
				//must hit
				const { cards } = await cardMachine.drawSingleCard(updatedGame.deckId); //draw one card
				localDealerHand.push(...cards);
				localScore = cardsCalculator.calculateHand(localDealerHand); //update localScore. score is primitive so over-write old value.
			}
			console.log("OOOOOOOOOOOO", localDealerHand);
			//check dealer busted
			if (localScore > 21) {
				const res = await fbGame.updateGame(gameDocRef.current, {
					dealer: localDealerHand,
					gameStatus: "gameOver",
					dealerisBusted: true,
				});
				console.log(res);
			} else if (localScore >= 17) {
				//including exactly 21 -> must stand
				const res = fbGame.updateGame(gameDocRef.current, {
					dealer: localDealerHand,
					gameStatus: "gameOver",
				});
				console.log(res);
			}
		} catch (err) {
			console.log(err);
		}
	};

	const displayResult = (me, game) => {
		if (
			me?.status === "won" &&
			me.hasBlackjack === true &&
			game.dealerHasBlackjack === false
		) {
			return (
				<div className="popup__text">
					You beat the dealer with Blackjack and won ${(me.bet * 3) / 2}!
				</div>
			);
		} else if (
			me?.status === "push" &&
			me.hasBlackjack === true &&
			game.dealerHasBlackjack === true
		) {
			return (
				<div className="popup__text">
					Both you and the dealer have Blackjack—it's a tie!
				</div>
			);
		} else if (
			me?.status === "lost" &&
			me.hasBlackjack === false &&
			game.dealerHasBlackjack === true
		) {
			return (
				<div className="popup__text">
					The dealer won with Blackjack. You lost ${me.bet}.
				</div>
			);
		} else if (me?.status === "busted") {
			return (
				<div className="popup__text">You're busted! You lost ${me.bet}.</div>
			);
		}

		if (game.gameStatus === "gameOver") {
			const myScore = cardsCalculator.calculateHand(me.hand);
			const dealerScore = cardsCalculator.calculateHand(game.dealer);
			console.log("Result:", myScore, dealerScore);

			if (myScore === dealerScore) {
				return <div className="popup__text">It's a tie with the dealer!</div>;
			}
			if (game.dealerisBusted) {
				return (
					<div className="popup__text">
						The dealer busted! You won ${me.bet}!
					</div>
				);
			} else if (myScore > dealerScore) {
				return (
					<div className="popup__text">
						You beat the dealer and won ${me.bet}!
					</div>
				);
			} else if (myScore < dealerScore) {
				return (
					<div className="popup__text">The dealer won. You lost ${me.bet}.</div>
				);
			}
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
		if (game.playerId.length > prePIds.length) {
			// let pId = game.playerId[game.playerId.length - 1];
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

		if (game.playerId.length < prePIds.length) {
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
	}, [game?.playerId]);

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
			//pop -> ask to place a bet
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
		let timer2;
		if (
			game.gameStatus === "gameOver" ||
			me?.status === "won" ||
			me?.status === "busted"
		) {
			//only players in current round will be notified the result.
			if (me?.status !== "waiting") {
				//toggleTrueGameOver();
				timer2 = setTimeout(() => toggleTrueGameOver(), timerToggleOpenPop);
			}

			if (resetGameToastRef.current && me?.status === "waiting") {
				showToastCenter(`Hang on, dealer is preparing for the next round ...`);
				resetGameToastRef.current = false; //Only show toast once
			}

			//triggers resetGame() after setTimeOut
			//any player can trigger resetGame() ->from current round or new
			timer = setTimeout(async () => await handleResetGame(), timerResetGame); //reset
		} else toggleFalseGameOver();

		return () => {
			if (timer) {
				clearTimeout(timer);
				console.log("Timer cleared");
			}
			if (timer2) {
				clearTimeout(timer2);
				console.log("Timer2 cleared");
			}
		};
	}, [game?.gameStatus, players, user]);

	//reset resetGameToastRef.current to true for next toast
	useEffect(() => {
		if (!game || !user || !players) return;
		if (game.gameStatus !== "gameOver" && resetGameToastRef.current === false)
			resetGameToastRef.current = true; //reset for next round.
	}, [game?.gameStatus, players, user]);

	const controlBoardCondition =
		game?.gameStatus === "playerTurn" &&
		currentPlayer?.id === user?.uid &&
		currentPlayer?.donePlaying === false;

	const handleDBetCondition =
		currentPlayer?.hand?.length === 2 && currentPlayer?.doubleBet === false;

	const handleNavigate = () => setTimeout(() => nav("/"), timerToggleOpenPop);

	return !user?.uid ? (
		<div>Please log in first</div>
	) : !game?.playerId.includes(user.uid) ? (
		nav("/")
	) : (
		<div className="game">
			<Popup
				isOpen={popBet}
				handleBtnRight={handleAddBet}
				btnRightText="Confirm"
			>
				<h2 className="popup__title">Place a bet</h2>
				<input
					className="popup__input"
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
					<h2 className="popup__title">Blackjack result</h2>
					<div className="popup__text">
						My score: {me?.hand && cardsCalculator.calculateHand(me?.hand)}
					</div>
					<div className="popup__text">
						Dealer score:{" "}
						{game?.dealer && cardsCalculator.calculateHand(game?.dealer)}
					</div>
					{me?.hand && game?.dealer && displayResult(me, game)}
				</div>
			</Popup>
			<Popup
				isOpen={popQuitGame}
				handleBtnLeft={toggleFalseQuitGame}
				handleBtnRight={handleQuitGame}
				btnLeftText="Cancel"
				btnRightText="Quit Game"
			>
				<h2 className="popup__title">Going back to lobby</h2>
			</Popup>

			{console.log(
				"^ ~ ^ ~ ^ ~ ^ ~ ^ re-render ^ ~ ^ ~ ^ ~ ^ ~ ^ in ongoing game"
			)}
			{console.log(players)}
			{/* { console.log( user ) } */}

			<button className="btn btn--quit" onClick={toggleTrueQuitGame}>
				Quit game
			</button>
			{game?.playerId?.length > 1 && (
				<div className="game__opponents-container-wrapper">
					<h3>Players</h3>
					<div className="game__opponents-container">
						{opponents?.map((player, i) => (
							<div className="game__opponent-wrapper-wrapper" key={i}>
								<h5>{users?.find((user) => user.id === player.id)?.name}</h5>
								<div className="game__opponent-wrapper">
									{player?.hand?.map(({ image, code }, i) => (
										<div key={i}>
											<img
												className="game__card game__card--opponent"
												src={image}
												alt={code}
											/>
										</div>
									))}
								</div>
							</div>
						))}
					</div>
				</div>
			)}
			<div className="game__dealer-container-wrapper">
				<h3>Dealer</h3>
				<div className="game__dealer-container">
					{game?.dealer?.map(({ image, code }, i) => (
						<div key={i}>
							<img
								className="game__card game__card--dealer"
								src={
									i === 1 &&
									game?.gameStatus !== "dealerTurn" &&
									game?.gameStatus !== "gameOver"
										? backOfCardImg
										: image
								}
								alt={code}
							/>
						</div>
					))}
				</div>
			</div>
			<div className="game__me-container">
				{me?.hand?.map(({ image, code }, i) => (
					<div key={i}>
						<img className="game__card game__card--me" src={image} alt={code} />
					</div>
				))}
			</div>
			{controlBoardCondition && (
				<div className="game__control-board">
					{currentPlayer?.canHit === true && (
						<button className="btn btn--gameOnGoing" onClick={handleHit}>
							Hit!
						</button>
					)}
					<button className="btn btn--gameOnGoing" onClick={handleStand}>
						Stand
					</button>
					{handleDBetCondition && (
						<button className="btn btn--gameOnGoing" onClick={handleDBet}>
							Double Down
						</button>
					)}
				</div>
			)}
			{currentPlayer !== me && game?.gameStatus === "playerTurn" && (
				<div className="game__btn-wrapper">
					<button
						className="btn btn--game-remove-player-btn"
						onClick={removeInactiveCurrentPlayer}
					>
						Remove inactive player
					</button>
				</div>
			)}
			<div className="game__info">
				<h4>My bet: ${me?.bet}</h4>
				<h4>
					My total score: {me?.hand && cardsCalculator.calculateHand(me.hand)}
					{/* Dealer score:
					{game?.dealer && cardsCalculator.calculateHand(game.dealer)} */}
				</h4>
			</div>
		</div>
	);
};

export default GameOngoing;
