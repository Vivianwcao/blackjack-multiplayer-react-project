import React, { useState } from "react";
import { handleGoogleSignIn } from "../../Firebase/FirebaseAuthentification/signInPartners/googleSignIn";
import { handleMicrosoftSignIn } from "../../Firebase/FirebaseAuthentification/signInPartners/MicrosoftSignIn";
import { handleGithubSignIn } from "../../Firebase/FirebaseAuthentification/signInPartners/githubSignIn";
import { TfiMicrosoftAlt } from "react-icons/tfi";
import { BsGoogle } from "react-icons/bs";
import { SiGithub } from "react-icons/si";
import Toggle from "../Toggle/Toggle";
import {
	handleEmailSignIn,
	handleEmailSignUp,
} from "../../Firebase/FirebaseAuthentification/signInPartners/emailSignIn";
import FormSignIn from "../Form/FormSignIn";
import FormSignUp from "../Form/FormSignUp";
import "./Popup.scss";

export const AuthDetail = () => {
	const [signUp, toggleSignUp] = useState(false);
	const handleToggle = () => toggleSignUp(!signUp);

	return (
		<div className="popup__content">
			<h3 className="popup__title popup__title--auth">
				{signUp ? "Register with" : "Sign in with"}
			</h3>
			<div className="popup__partners-container">
				<button
					className="btn btn--sign-in-google"
					onClick={handleGoogleSignIn}
				>
					<BsGoogle />
					{/* <svg
						width="20"
						height="20"
						fill="currentColor"
						className="mr-2"
						viewBox="0 0 1792 1792"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path d="M896 786h725q12 67 12 128 0 217-91 387.5t-259.5 266.5-386.5 96q-157 0-299-60.5t-245-163.5-163.5-245-60.5-299 60.5-299 163.5-245 245-163.5 299-60.5q300 0 515 201l-209 201q-123-119-306-119-129 0-238.5 65t-173.5 176.5-64 243.5 64 243.5 173.5 176.5 238.5 65q87 0 160-24t120-60 82-82 51.5-87 22.5-78h-436v-264z"></path>
					</svg> */}
				</button>
				<button
					className="btn btn--sign-in-microsoft"
					onClick={handleMicrosoftSignIn}
				>
					<TfiMicrosoftAlt />
					{/* <svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="currentColor"
						className="h-6 w-6"
					>
						<path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
						<path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
					</svg> */}
				</button>
				{/* <button
					className="btn btn--sign-in-github"
					onClick={handleGithubSignIn}
				>
					<SiGithub />
				</button> */}
			</div>
			<div className="popup__toggle">
				<Toggle
					isOn={signUp}
					setIsOn={handleToggle}
					onLabel={"REGISTER"}
					offLabel={"SIGN IN"}
				/>
			</div>
			<div className="popup__form-container">
				{signUp ? (
					<FormSignUp handleSubmit={handleEmailSignUp} />
				) : (
					<FormSignIn handleSubmit={handleEmailSignIn} />
				)}
			</div>
		</div>
	);
};
