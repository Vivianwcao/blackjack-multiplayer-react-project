import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ToastContainer, toast, Slide } from "react-toastify";
import ProtectedRoute from "./pages/ProtectedRoute";
import Lobby from "./pages/Lobby/Lobby";
import Game from "./pages/Game/Game";
import GameOngoing from "./pages/GameOngoing/GameOngoing";
import { GameProvider } from "./components/GameProvider";
import Banner from "./components/Banner/Banner";
import "./pages/style.scss";

const App = () => {
	return (
		<BrowserRouter>
			{/* <GameProvider> */}
			<ToastContainer closeButton={false} />
			<header>
				<Banner />
			</header>
			<Routes>
				<Route path="/" element={<Lobby />} />
				<Route
					path="/:gameId"
					element={<ProtectedRoute game={Game} gameOngoing={GameOngoing} />}
				/>
			</Routes>
			{/* </GameProvider> */}
		</BrowserRouter>
	);
};

export default App;
