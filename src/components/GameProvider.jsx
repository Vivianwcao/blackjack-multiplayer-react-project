import React, { useRef, useContext, createContext } from "react";
import { collection, getDocs, getDoc } from "firebase/firestore";

const GameContext = createContext(null);

export const GameProvider = ({ children }) => {
	const gamesListRef = useRef([]);

	return (
		<GameContext.Provider value={{ gamesListRef }}>
			{children}
		</GameContext.Provider>
	);
};
export const useGameContext = () => useContext(GameContext);
