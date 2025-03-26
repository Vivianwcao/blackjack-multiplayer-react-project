import React from "react";
import { useAuth } from "../../Firebase/FirebaseAuthentification/AuthProvider";
import "../../pages/style.scss";
import "./GameRoom.scss";

const GameRoom = ({
	game,
	joinGameConditions,
	joined,
	handleJoinGame,
	handleLeaveGame,
}) => {
	const { user, users } = useAuth();

	return (
		<div className="game-room">
			<h3>
				{game?.isOngoing
					? "Open Table Blackjack Game"
					: "One Time Blackjack game"}
			</h3>
			<h4>{`Players in: ${
				game?.playerId?.length ? game?.playerId?.length : ""
			}/${game.maxPlayers}`}</h4>
			{game.gameStatus !== "waiting" && <h4>Game is in progress ...</h4>}
			<div className="game-room__player-name-container">
				{game?.playerId?.map((id, i) => {
					const name = users?.find((user) => user.id === id)?.name;
					if (name) return <p key={i}>{name}</p>;
				})}
			</div>
			{joinGameConditions(game) && (
				<button
					className="btn btn--lobby"
					onClick={() => handleJoinGame(game.gameId)}
				>
					Join game
				</button>
			)}
			{user && joined?.gameId === game.gameId && (
				<button
					className="btn btn--lobby"
					onClick={() => handleLeaveGame(game)}
				>
					Leave game
				</button>
			)}
		</div>
	);
};

export default GameRoom;
