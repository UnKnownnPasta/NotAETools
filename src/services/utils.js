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

/** @returns {import("../other/types.js").dataItem[]} @param {string} input */
export function extractSoup(input) {
	input = input.replace(/(```)/g, '').replace(/\x1B\[[0-9;]*[A-Za-z]/g, '').split('\n');
	if (!input.length) return [];
	const resArray = [];
	for (const thing of input) {
		let fData = { found: false, posOfRelic: null };
		let x = 0;
		for (const i of thing.split('|')) {
			if (isRelicFF( i.trim() )) {
				fData.found = true;
				fData.posOfRelic = x;
				break;
			}
			x++;
		}
		if (fData.found) {
			resArray.push({ item: thing.split('|')[fData.posOfRelic].trim(), amount: thing.split('|')[fData.posOfRelic-1].match(/(\d+)/)?.[0] });
		}
	}
	return resArray;
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

export function isRelicFF(str) {
	str = str.replace(/[^ a-zA-Z0-9]/g, '').trim();
	if (!str) return null;
	str = str.toLowerCase();
	const relic = str.trim().split(" ");
	const map = { 'a': 'axi', 'l': 'lith', 'm': 'meso', 'n': 'neo' };
	if (relic.length == 1) {
		return isRelicFF(`${titleCase(map[str[0]] ?? "")} ${str.slice(1).toUpperCase()}`);
	} else if (relic.length != 2) {
		return null;
	} else if (/^(lith|meso|neo|axi)$/.test(relic[0]) && /^[A-Za-z][0-9]{1,2}$/.test(relic[1])) {
		return `${titleCase(relic[0])} ${relic[1].toUpperCase()}`;
	}
	return null;
}

export const range = (num) => 
	num >= 0 && num <= 11 ? 'ED'
	: num > 11 && num <= 23 ? 'RED'
	: num > 23 && num <= 39 ? 'ORANGE'
	: num > 39 && num <= 59 ? 'YELLOW'
	: num > 59 ? 'GREEN' : '';
