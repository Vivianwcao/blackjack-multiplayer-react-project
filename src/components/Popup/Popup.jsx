import { useState } from "react";

import "./Popup.scss"; // Import the SCSS file

const Popup = ({
	isOpen,
	children,
	handleBtnLeft,
	handleBtnRight,
	btnLeftText,
	btnRightText,
}) => {
	if (!isOpen) return null;

	return (
		<div className="popup__overlay">
			<div className="popup__content">
				{children}
				<div className="popup__btn-wrapper">
					{handleBtnLeft && (
						<button className="popup__left-btn" onClick={handleBtnLeft}>
							{btnLeftText}
						</button>
					)}
					{handleBtnRight && (
						<button className="popup__right-btn" onClick={handleBtnRight}>
							{btnRightText}
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

export default Popup;
