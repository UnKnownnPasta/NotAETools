import entityClassifierInstance from "./nlp.js";

export const _bool_true = (f) => (f == true ? true : false);

export async function _run_safe(fn) {
	return async (...args) => {
		try {
			await fn(...args);
		} catch (e) {
			console.error(e);
		}
	};
}

export function extractItems(input) {
	const items = [];
	const inputParts = input.split(/[\n,]\s*/); // Split by both newline and comma, with optional space after

	// Iterate over each part (e.g., "4x aklex link")
	inputParts.forEach((part) => {
			const tokens = part.replace("bp", "Blueprint").replace("rec", "Receiver").replace(/[^0-9 &a-zA-Z]/g, "").trim().split(/\s+/);
			const amountMatch = tokens[0].match(/^(\d+)x$/); // Check if the first token is a quantity (e.g., "4x")
			if (amountMatch) {
					const amount = parseInt(amountMatch[1], 10); // Extract the amount (e.g., 4 from "4x")
					const itemName = tokens.slice(1).join(" "); // Remaining part is the item name (e.g., "aklex link")

					// Classify the item using the classifyEntity function
					const classification = entityClassifierInstance.classifyEntity(itemName);
					console.log(tokens, classification);

					if (classification.category !== "unknown" && classification.entity !== "unknown") {
							items.push({ item: classification.entity + " " + classification.detail, amount });
					}
			}
	});

	return items;
}


export function titleCase(str) {
	const words = str.toLowerCase().split(" ");

	for (let i = 0; i < words.length; i++) {
		if (words[i] == "bp") {
			words[i] = "Blueprint";
			continue;
		}
		if (words[i] == "rec") {
			words[i] = "Receiver";
			continue;
		}
		words[i] =
			words[i].charAt(0).toUpperCase() + words[i].slice(1).toLowerCase();
	}
	return words.join(" ");
}

export const range = (num) => 
	num >= 0 && num <= 11 ? 'ED'
	: num > 11 && num <= 23 ? 'RED'
	: num > 23 && num <= 39 ? 'ORANGE'
	: num > 39 && num <= 59 ? 'YELLOW'
	: num > 59 ? 'GREEN' : '';
