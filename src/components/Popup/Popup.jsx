import { RiCloseLargeLine } from "react-icons/ri";
import "./Popup.scss"; // Import the SCSS file

const Popup = ({ name = "", isOpen, onClose, children }) => {
	if (!isOpen) return null;
	return (
		<div className="popup__overlay">
			<div
				className={name ? `popup__frame popup__frame--${name}` : "popup__frame"}
			>
				{onClose && (
					<RiCloseLargeLine className="popup__close-icon" onClick={onClose} />
				)}
				{children}
			</div>
		</div>
	);
};

export default Popup;
