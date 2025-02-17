import React, { useRef, useState, useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Lobby from "./pages/Lobby";
import Game from "./pages/Game";
import {
	SignInWithGoogle,
	Logout,
} from "./Firebase/FirebaseAuthentification/Auth";
import {
	SetAuthPersistence,
	OnAuthStateChangedListener,
} from "./Firebase/FirebaseAuthentification/setAuthPersistence";
const App = () => {
	const [user, setUser] = useState(null);

	// Handles Google Sign-In
	const handleSignIn = async () => {
		const user = await SignInWithGoogle();
		if (user) setUser(user);
	};

	// Handles Logout
	const handleLogout = async () => {
		await Logout();
		setUser(null);
	};

	// Auth State Listener (Detects login/logout)
	useEffect(() => {
		const unsubscribe = OnAuthStateChangedListener(setUser);
		return unsubscribe; // Cleanup listener on unmount
	}, []);

	return (
		<BrowserRouter>
			<SetAuthPersistence />
			<header>
				{user ? (
					<>
						<p>Welcome, {user.displayName}!</p>
						<button onClick={handleLogout}>Logout</button>
					</>
				) : (
					<button onClick={handleSignIn}>Sign in</button>
				)}
			</header>
			<Routes>
				<Route path="/" element={<Lobby />} />
				<Route path="/:gameId" element={<Game />} />
			</Routes>
		</BrowserRouter>
	);
};

export default App;
