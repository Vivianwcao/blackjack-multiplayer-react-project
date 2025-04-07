//calculates hand's total value
export const calculateHand = (handList) => {
	let total = 0;
	let aceCount = 0;
	for (let card of handList) {
		//if value is a non-zero number -> number card
		if (+card.value) total += +card.value;
		else if (card.value !== "ACE") total += 10;
		else if (card.value === "ACE") {
			aceCount += 1;
			total += 11;
		}
	}
	if (aceCount === 0) return total;
	while (total > 21 && aceCount > 0) {
		total = total - 11 + 1;
		aceCount -= 1;
	}
	console.log("Total hand equals to: ", total);
	return total;
};

export const has21 = (handList) => calculateHand(handList) === 21;

export const isBusted = (handList) => calculateHand(handList) > 21;
