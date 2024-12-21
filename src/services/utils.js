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
	const parts = input
		.toLowerCase()
		.replace(/\s+/g, ' ')
		.replace(/\s*prime\s*/g, ' ')
		.replace(/\(.*?\)/g, "")
		.replace(/<@!?[^>]+>/g, "")
		.replace(/x(\d+)/g, '$1x')
		.replace(/ and /g, " & ")
		.trim()
		.replace(/\b(\d+)\s*x?\s*\b/g, '$1x ')
		.replace(/\b(\d+)\s*x?\b\s*(.*?)\s*/g, '$1x $2, ')
		.split(/(?:(?:, )|(?:\n)|(?:\s(?=\b\d+x?\b)))/);

	const newParts = [];
	for (let i = 0; i < parts.length; i++) {
			if (/\d+x/.test(parts[i]) && i < parts.length - 1) {
					newParts.push(parts[i] + parts[i + 1]);
					i++;
			} else if (i < parts.length - 1 && parts[i + 1].endsWith('x ')) {
					newParts.push(parts[i + 1] + parts[i]);
					i++;
			} else {
					newParts.push(parts[i]);
			}
	}

	const inputParts = newParts.filter(x => /\dx/.test(x));

	// Iterate over each part
	inputParts.forEach((part) => {
			const tokens = part.replace("bp", "Blueprint").replace("rec", "Receiver").replace(/[^0-9 &a-zA-Z]/g, "").trim().split(/\s+/);
			const amountMatch = tokens[0].match(/^(\d+)x$/);
			if (amountMatch) {
					const amount = parseInt(amountMatch[1], 10);
					const itemName = tokens.slice(1).join(" ");
					const classification = entityClassifierInstance.classifyEntity(titleCase(itemName));

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
		if (words[i] == "sys") {
			words[i] = "Systems";
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
