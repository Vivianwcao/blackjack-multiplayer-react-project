import { useCallback } from "react";
import { useState } from "react";

const useToggle = (initialState) => {
	const [state, setState] = useState(initialState);

	const toggleTrue = useCallback(() => setState(true), []);
	const toggleFalse = useCallback(() => setState(false), []);

	return [state, toggleTrue, toggleFalse];
};

export default useToggle;
