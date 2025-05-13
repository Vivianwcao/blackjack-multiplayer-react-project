import "./Toggle.scss";

export default function Toggle({ isOn, setIsOn, onLabel, offLabel }) {
	return (
		<div className={`toggle toggle--${isOn ? "on" : "off"}`} onClick={setIsOn}>
			<span className="toggle__label">{isOn ? onLabel : offLabel}</span>
			<div className={`toggle__handle toggle__handle--${isOn ? "on" : ""}`} />
		</div>
	);
}
