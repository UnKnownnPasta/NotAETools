export const _bool_true = (f) => f == true ? true : false;

export async function _run_safe(fn) {
    return async (...args) => {
        try {
            await fn(...args);
        } catch (e) {
            console.error(e);
        }
    }
}

export function titleCase(str) {
    const words = str.split(" ");

    for (let i = 0; i < words.length; i++) {
        if (
            words[i].toLowerCase() == "bp" ||
            words[i].toLowerCase() == "blueprint"
        ) {
            words[i] = "Blueprint";
            continue;
        }
        if (words[i].toLowerCase().startsWith("neuroptic")) {
            words[i] = "Neuro";
            continue;
        }
        words[i] =
            words[i].charAt(0).toUpperCase() + words[i].slice(1).toLowerCase();
    }
    return words.join(" ");
}