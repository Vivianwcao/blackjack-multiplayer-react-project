import React from "react";
import { useAuth } from "../../Firebase/FirebaseAuthentification/AuthProvider";
import {
	handleGoogleSignIn,
	handleSignOut,
} from "../../Firebase/FirebaseAuthentification/signInPartners/googleSignIn";
import { handleMicrosoftSignIn } from "../../Firebase/FirebaseAuthentification/signInPartners/MicrosoftSignIn";
import {
	handleSignIn,
	handleSignUp,
} from "../../Firebase/FirebaseAuthentification/signInPartners/emailSignIn";
import { handleGithubSignIn } from "../../Firebase/FirebaseAuthentification/signInPartners/githubSignIn";
import ProfilePhoto from "../ProfilePhoto/ProfilePhoto";
import "../../pages/style.scss";
import "./Banner.scss";

const Banner = () => {
	const { user, users } = useAuth();
	const me = users?.find((u) => u.id === user?.uid);

	return (
		<div className="banner">
			{user ? (
				<div className="banner__content-wrapper">
					<div className="banner__profile-wrapper">
						<h1>♠️Welcome {user?.displayName}!</h1>
						<ProfilePhoto src={me?.photo} />
					</div>
					<p>
						Last login at:
						{` ${new Date(+user.metadata.lastLoginAt).toLocaleString()}`}
					</p>

					<div className="btn-wrapper">
						<button className="btn btn--sign-out" onClick={handleSignOut}>
							<svg
								width="20"
								height="20"
								viewBox="0 0 21 15"
								fill="currentColor"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path d="M0.292892 6.7929C-0.0976315 7.18342 -0.0976314 7.81658 0.292893 8.20711L6.65686 14.5711C7.04738 14.9616 7.68054 14.9616 8.07107 14.5711C8.46159 14.1805 8.46159 13.5474 8.07107 13.1569L2.41421 7.5L8.07107 1.84315C8.46159 1.45262 8.46159 0.819458 8.07107 0.428933C7.68054 0.038409 7.04738 0.038409 6.65685 0.428933L0.292892 6.7929ZM21 6.5L1 6.5L1 8.5L21 8.5L21 6.5Z" />
							</svg>
							Sign out
						</button>
					</div>
				</div>
			) : (
				<div className="btn-wrapper">
					<button
						className="btn btn--sign-in-google"
						onClick={handleGoogleSignIn}
					>
						<svg
							width="20"
							height="20"
							fill="currentColor"
							className="mr-2"
							viewBox="0 0 1792 1792"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path d="M896 786h725q12 67 12 128 0 217-91 387.5t-259.5 266.5-386.5 96q-157 0-299-60.5t-245-163.5-163.5-245-60.5-299 60.5-299 163.5-245 245-163.5 299-60.5q300 0 515 201l-209 201q-123-119-306-119-129 0-238.5 65t-173.5 176.5-64 243.5 64 243.5 173.5 176.5 238.5 65q87 0 160-24t120-60 82-82 51.5-87 22.5-78h-436v-264z"></path>
						</svg>
						Sign in with google
					</button>
					<button
						className="btn btn--sign-in-microsoft"
						onClick={handleMicrosoftSignIn}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="currentColor"
							className="h-6 w-6"
						>
							<path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
							<path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
						</svg>
						Sign in with Outlook
					</button>
					{/* <button className="btn btn--sign-in-github" onClick={handleGithubSignIn}>
							Sign in with github
						</button> */}
					{/* <button className="btn btn--sign-in"  onClick={handleSignUp}>Email Sign up</button>
						<button className="btn btn--sign-in"  onClick={handleSignIn}>Email Sign in</button> */}
				</div>
			)}
		</div>
	);
};

export default Banner;
