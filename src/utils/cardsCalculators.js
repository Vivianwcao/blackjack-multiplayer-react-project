//calculates hand's total value
export const calculateHand = (handList) => {
	let total = { min: 0, max: 0 };
	for (let card of handList) {
		//if value is a non-zero number -> number card

		if (+card.value) (total.min += +card.value), (total.max += +card.value);
		else if (card.value === "ACE") (total.min += 1), (total.max += 11);
		else (total.min += 10), (total.max += 10);
	}
	return total;
};

export const hasBlackjack = (handList) => calculateHand(handList).max === 21;
// export const hasBlackjack = (handList) => true;

export const isBusted = (handList) => calculateHand(handList).min > 21;

//calculate scores
