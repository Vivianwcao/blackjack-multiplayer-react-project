import { useRef, useState } from "react";
import { FaEye } from "react-icons/fa";
import "../../pages/style.scss";
import "./Form.scss";

const FormSignIn = ({ handleSubmit }) => {
	const emailRef = useRef(null);
	const passwordRef = useRef(null);
	const [errorMsg, setErrorMsg] = useState("");
	const [isPassword, setIsPassword] = useState(true);
	const formHandler = async (e) => {
		e.preventDefault();
		let email = emailRef.current.value.trim();
		let password = passwordRef.current.value.trim();
		console.log(emailRef.current.value, passwordRef.current.value);
		if (!email.length || !password.length) {
			setErrorMsg("Invalid input(s)");
		} else {
			try {
				await handleSubmit(email, password);
				setErrorMsg("");
				emailRef.current.value = "";
				passwordRef.current.value = "";
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
			/>
			<div className="form__password-container">
				<input
					type={isPassword ? "password" : "text"}
					placeholder="Password"
					className="form__password"
					ref={passwordRef}
				/>
				<div
					className={isPassword ? "form__view_icon" : "form__view_icon--on"}
					onClick={() => setIsPassword(!isPassword)}
				>
					<FaEye />
				</div>
			</div>
			<div className="form__error_message">{errorMsg}</div>
			<button type="submit" className="btn--form">
				Sign in
			</button>
		</form>
	);
};

export default FormSignIn;
