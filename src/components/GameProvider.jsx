import React, { useContext, createContext } from "react";

const GameContext = createContext(null);

export const GameProvider = ({ children }) => {
	return <GameContext.Provider value={{}}>{children}</GameContext.Provider>;
};
export const useGameContext = () => useContext(GameContext);
