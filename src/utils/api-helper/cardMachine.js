import axios from "axios";

const mockDeck = "b7u5yr1uqy1z";

//get a deck
export const newDeck = async (numOfDecks) => {
	try {
		console.log(numOfDecks);
		// const deck = await axios.get(
		// 	`https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=${numOfDecks}`
		// );
		// return deck.data;

		// ONLY FOR TESTING -- use MockDeck
		const deck = await axios.get(
			`https://deckofcardsapi.com/api/deck/${mockDeck}/shuffle/?remaining=true`
		);
		return deck.data;
	} catch (err) {
		throw new Error(err.message);
	}
};

//draw #num of card
export const drawCards = async (deckId, num) => {
	try {
		const deck = await axios.get(
			`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=${num}`
		);
		return deck.data;
	} catch (err) {
		throw new Error(err.message);
	}
};

//draw a single card
export const drawSingleCard = async (deckId) => await drawCards(deckId, 1);

//draw a two cards
export const drawTwoCards = async (deckId) => await drawCards(deckId, 2);

//shuffle the deck
export const shuffleDeck = async (deckId) => {
	try {
		const deck = await axios.get(
			`https://deckofcardsapi.com/api/deck/${deckId}/shuffle/?remaining=true`
		);
		return deck.data;
	} catch (err) {
		throw new Error(err.message);
	}
};
