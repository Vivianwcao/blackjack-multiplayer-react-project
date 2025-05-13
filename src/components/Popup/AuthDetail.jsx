import React, { useState } from "react";
import Toggle from "../Toggle/Toggle";

export const AuthDetail = () => {
	const [signUp, toggleSignUp] = useState(false);
	const handleToggle = () => toggleSignUp(!signUp);
	return (
		<div>
			<Toggle
				isOn={signUp}
				setIsOn={handleToggle}
				onLabel={"Sign in"}
				offLabel={"Sign up"}
			/>
		</div>
	);
};
