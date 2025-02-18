import React, { useRef, useState, useEffect, useContext } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./pages/ProtectedRoute";
import Lobby from "./pages/Lobby";
import Game from "./pages/Game";
import {
	SignInWithGoogle,
	SignOut,
} from "./Firebase/FirebaseAuthentification/Auth";
import { SetAuthPersistence } from "./Firebase/FirebaseAuthentification/setAuthPersistence";
import { useAuth } from "./Firebase/FirebaseAuthentification/AuthProvider";

const App = () => {
	let user = useAuth();
	console.log("user from authProvider", user);

	// Handles Google sign-in & sign-out
	const handleSignIn = async () => await SignInWithGoogle();

	const handleSignOut = async () => await SignOut();

	return (
		<BrowserRouter>
			<SetAuthPersistence />
			<header>
				{user ? (
					<div>
						<p>Welcome, {user.displayName}!</p>
						<button onClick={handleSignOut}>Sign out</button>
					</div>
				) : (
					<button onClick={handleSignIn}>Sign in</button>
				)}
			</header>
			<Routes>
				{/* <Route path="/" element={<ProtectedRoute component={Lobby} />} /> */}
				<Route path="/" element={<Lobby />} />
				<Route path="/:gameId" element={<Game />} />
			</Routes>
		</BrowserRouter>
	);
};

export default App;
