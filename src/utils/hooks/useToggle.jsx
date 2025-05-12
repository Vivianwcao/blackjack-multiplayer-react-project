import { useCallback } from "react";
import { useState } from "react";

const useToggle = (initialState) => {
	const [state, setState] = useState(initialState);

	const toggleOn = useCallback(() => setState(true), []);
	const toggleOff = useCallback(() => setState(false), []);

	return [state, toggleOn, toggleOff];
};

export default useToggle;
