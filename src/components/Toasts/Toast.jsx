import React from "react";
import { toast, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CustomToast = ({ message, closeToast }) => (
	<div>
		<p>{message}</p>
		<button onClick={closeToast}>Close</button>
	</div>
);

export const showToast = (message) => {
	toast(<CustomToast message={message} />, {
		position: "top-right",
		autoClose: 3000, // Adjust timing as needed
		hideProgressBar: true,
		closeOnClick: true,
		pauseOnFocusLoss: true,
		draggable: true,
		pauseOnHover: true,
		theme: "light",
		transition: Slide,
		closeButton: false, //This completely removes the close button
	});
};
