import { RiCloseLargeLine } from "react-icons/ri";
import "./Popup.scss"; // Import the SCSS file

const Popup = ({ isOpen, onClose, children }) => {
	if (!isOpen) return null;
	return (
		<div className="popup__overlay">
			<div className="popup__content">
				{onClose && (
					<button className="popup__close" onClick={onClose}>
						<RiCloseLargeLine />
					</button>
				)}
				{children}
			</div>
		</div>
	);
};

export default Popup;
