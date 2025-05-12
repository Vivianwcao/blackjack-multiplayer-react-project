export const ButtonDetail = ({ classNameBtn, handleClick, children }) => (
	<button className={classNameBtn} onClick={handleClick}>
		{children}
	</button>
);
