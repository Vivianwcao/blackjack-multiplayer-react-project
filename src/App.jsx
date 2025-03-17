import React, { useRef, useState, useEffect, useContext } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./pages/ProtectedRoute";
import Lobby from "./pages/Lobby/Lobby";
import Game from "./pages/Game/Game";
import {
	handleGoogleSignIn,
	handleSignOut,
} from "./Firebase/FirebaseAuthentification/signInPartners/googleSignIn";
import { handleGithubSignIn } from "./Firebase/FirebaseAuthentification/signInPartners/githubSignIn";
import { useAuth } from "./Firebase/FirebaseAuthentification/AuthProvider";
import { GameProvider } from "./components/GameProvider";

const App = () => {
	const { user } = useAuth();

	return (
		<BrowserRouter>
			<GameProvider>
				<header>
					{user ? (
						<div>
							<p>Welcome {user.displayName}!</p>
							<p>
								Last login at:
								{` ${new Date(+user.metadata.lastLoginAt).toLocaleString()}`}
							</p>

							<button onClick={handleSignOut}>Sign out</button>
						</div>
					) : (
						<div>
							<button onClick={handleGoogleSignIn}>Sign in google</button>
							<button onClick={handleGithubSignIn}>Sign in github</button>
						</div>
					)}
				</header>
				<Routes>
					{/* <Route path="/" element={<ProtectedRoute component={Lobby} />} /> */}
					<Route path="/" element={<Lobby />} />
					<Route path="/:gameId" element={<Game />} />
				</Routes>
			</GameProvider>
		</BrowserRouter>
	);
};

export default App;
