import React from "react";
import { ButtonDetail } from "./ButtonDetail";
import "./Popup.scss";

export const DefaultDetail = ({
	children,
	handleBtnLeft,
	handleBtnRight,
	btnLeftText,
	btnRightText,
}) => {
	return (
		<div className="popup__content">
			{children}
			<div className="popup__btn-wrapper">
				{handleBtnLeft && (
					<ButtonDetail
						classNameBtn="popup__left-btn"
						handleClick={handleBtnLeft}
					>
						{btnLeftText}
					</ButtonDetail>
				)}
				{handleBtnRight && (
					<ButtonDetail
						classNameBtn="popup__right-btn"
						handleClick={handleBtnRight}
					>
						{btnRightText}
					</ButtonDetail>
				)}
			</div>
		</div>
	);
};
