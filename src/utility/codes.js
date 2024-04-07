const range = (num) => {
    return num >= 0 && num <= 7 ? 'ED'
           : num > 7 && num <= 15 ? 'RED'
           : num > 15 && num <=31 ? 'ORANGE'
           : num > 31 && num <=64 ? 'YELLOW'
           : 'GREEN'
}

const codeObj = {
    "ED": 0,
    "RED": 1,
    "ORANGE": 2,
    "YELLOW": 3,
    "GREEN": 4,
}

const uncodeObj = {
    0: "ED",
    1: "RED",
    2: "ORANGE",
    3: "YELLOW",
    4: "GREEN"
}

const hex = {
    "ED": "#351c75",
    "RED": "#990000",
    "ORANGE": "#b45f06",
    "YELLOW": "#bf9000",
    "GREEN": "#38761d",
}

const stockRanges = {
    "ED": "0 - 7",
    "RED": "8 - 15",
    "ORANGE": "16 - 31",
    "YELLOW": "32 - 64",
    "GREEN": "64 - inf",
}

module.exports = {
    codeObj, uncodeObj, hex, range, stockRanges
}