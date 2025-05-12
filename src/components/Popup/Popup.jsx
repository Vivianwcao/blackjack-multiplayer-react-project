import "./Popup.scss"; // Import the SCSS file

const Popup = ({ isOpen, children }) => {
	if (!isOpen) return null;
	return <div className="popup__overlay">{children}</div>;
};

export default Popup;
