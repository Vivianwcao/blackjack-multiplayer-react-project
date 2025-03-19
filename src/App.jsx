import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ToastContainer, toast, Slide } from "react-toastify";
import ProtectedRoute from "./pages/ProtectedRoute";
import Lobby from "./pages/Lobby/Lobby";
import Game from "./pages/Game/Game";
import {
	handleGoogleSignIn,
	handleSignOut,
} from "./Firebase/FirebaseAuthentification/signInPartners/googleSignIn";
import { handleMicrosoftSignIn } from "./Firebase/FirebaseAuthentification/signInPartners/microsoftSignIn";
import {
	handleSignIn,
	handleSignUp,
} from "./Firebase/FirebaseAuthentification/signInPartners/emailSignIn";
import { handleGithubSignIn } from "./Firebase/FirebaseAuthentification/signInPartners/githubSignIn";
import { useAuth } from "./Firebase/FirebaseAuthentification/AuthProvider";
import { GameProvider } from "./components/GameProvider";

const App = () => {
	const { user } = useAuth();

	return (
		<BrowserRouter>
			<GameProvider>
				<ToastContainer closeButton={false} />
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
							<button onClick={handleMicrosoftSignIn}>Sign in Microsoft</button>
							{/* <button onClick={handleSignUp}>Email Sign up</button>
						<button onClick={handleSignIn}>Email Sign in</button> */}
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
