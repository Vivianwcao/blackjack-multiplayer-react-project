import { React, useRef, useState } from "react";
import { FaEye } from "react-icons/fa";
import "./Form.scss";

const FormSignUp = ({ handleSubmit }) => {
	const emailRef = useRef(null);
	const passwordRef = useRef(null);
	const passwordRef2 = useRef(null);
	const [isPassword, setIsPassword] = useState(true);
	const [isPassword2, setIsPassword2] = useState(true);
	const [errorMsg, setErrorMsg] = useState("");
	const formHandler = async (e) => {
		e.preventDefault();
		let email = emailRef.current.value.trim();
		let password = passwordRef.current.value.trim();
		let password2 = passwordRef2.current.value.trim();
		if (!email.length || !password.length || !password2.length) {
			setErrorMsg("Invalid input(s)");
		} else if (password !== password2) {
			setErrorMsg("Passwords don't match");
		} else {
			try {
				await handleSubmit(email, password);
				setErrorMsg("");
				emailRef.current.value = "";
				passwordRef.current.value = "";
				passwordRef2.current.value = "";
			} catch (err) {
				//console.log(err.message);
				setErrorMsg(err.message);
			}
		}
	};
	return (
		<form onSubmit={formHandler} className="form">
			<input
				type="email"
				placeholder="Email"
				className="form__email"
				ref={emailRef}
			></input>
			<div className="form__password-container">
				<input
					type={isPassword ? "password" : "text"}
					placeholder="Password (min 6 characters)"
					className="form__password"
					ref={passwordRef}
				></input>

				<div
					className={isPassword ? "form__view_icon" : "form__view_icon--on"}
					onClick={() => setIsPassword(!isPassword)}
				>
					<FaEye />
				</div>
			</div>
			<div className="form__password-container">
				<input
					type={isPassword2 ? "password" : "text"}
					placeholder="Repeat Password (min 6 characters)"
					className="form__password"
					ref={passwordRef2}
				/>
				<div
					className={isPassword2 ? "form__view_icon" : "form__view_icon--on"}
					onClick={() => setIsPassword2(!isPassword2)}
				>
					<FaEye />
				</div>
			</div>
			<div className="form__error_message">{errorMsg}</div>
			<button type="submit" className="btn--form">
				Create Account
			</button>
		</form>
	);
};

export default FormSignUp;
