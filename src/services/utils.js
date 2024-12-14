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

export function titleCase(str) {
	const words = str.toLowerCase().split(" ");

	for (let i = 0; i < words.length; i++) {
		if (words[i] == "bp" || words[i] == "blueprint") {
			words[i] = "Blueprint";
			continue;
		}
		if ("neuroptic".startsWith(words[i])) {
			words[i] = "Neuro";
			continue;
		}
		words[i] =
			words[i].charAt(0).toUpperCase() + words[i].slice(1).toLowerCase();
	}
	return words.join(" ");
}
