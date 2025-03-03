import { useState } from "react";

import "./Popup.scss"; // Import the SCSS file

const Popup = ({
	isOpen,
	handleBtnLeft,
	handleBtnRight,
	btnLeftText,
	btnRightText,
}) => {
	if (!isOpen) return null;

	return (
		<div className="popup__overlay">
			<div className="popup__content">
				<h2 className="popup__title">Floating Window</h2>
				<p className="popup__text">
					This is a pop-up modal in React with SCSS!
				</p>
				<div className="popup__btn-wrapper">
					<button className="popup__close-btn" onClick={handleBtnLeft}>
						{btnLeftText}
					</button>
					<button className="popup__close-btn" onClick={handleBtnRight}>
						{btnRightText}
					</button>
				</div>
			</div>
		</div>
	);
};

// const [isPopupOpen, setIsPopupOpen] = useState(false);

// return (
// 	<div className="app">
// 		<button className="open-btn" onClick={() => setIsPopupOpen(true)}>
// 			Open Pop-up
// 		</button>
// 		<Popup isOpen={isPopupOpen} onClose={() => setIsPopupOpen(false)} />
// 	</div>
// );

export default Popup;
