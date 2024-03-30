const { EmbedBuilder, codeBlock, ButtonStyle, Message } = require("discord.js");
const fs = require("node:fs/promises");
const { Pagination } = require("pagination.djs");
const { filterRelic, titleCase } = require("../scripts/utility.js");
const path = require("node:path");

const range = (num) => {
    return num >= 0 && num <= 7 ? 'ED'
           : num > 7 && num <= 15 ? 'RED'
           : num > 15 && num <=31 ? 'ORANGE'
           : num > 31 && num <=64 ? 'YELLOW'
           : 'GREEN'
}

const hex = {
    "ED": "#351c75",
    "RED": "#990000",
    "ORANGE": "#b45f06",
    "YELLOW": "#bf9000",
    "GREEN": "#38761d",
}

const codeObj = {
    "ED": 0,
    "RED": 1,
    "ORANGE": 2,
    "YELLOW": 3,
    "GREEN": 4,
}

const colorObj = {
    0: "ED",
    1: "RED",
    2: "ORANGE",
    3: "YELLOW",
    4: "GREEN"
}

module.exports = {
    name: "anycmd",
    /**
     * File to manage any ++ command
     * @param {Message} message 
     */
    async execute(client, message, wd, type) {
        const allrelics = await JSON.parse(await fs.readFile(path.join(__dirname, '..', 'data/relicdata.json')));
        let collectionBox = await JSON.parse(await fs.readFile(path.join(__dirname, '..', 'data/boxdata.json')));

        const word = titleCase(wd.replace(/\s*-(r|b|box)\s*.*?$/, ""));
        let hasdashb = wd.match(/-(?:b|box)/, "") !== null
        let hasdashr = wd.match(/-(?:r)/, "") !== null

        switch (type) {
            case "status":
                let edlist = [];
                let statusRelics = [];

                let lastword = titleCase(wd.split(/\s+/g).at(-1).trim())
                const lastisdash = lastword == '-r' || lastword == '-b' || lastword == '-box'

                allrelics.relicData.forEach((part) => {
                    let pFoundStats = 0;
                    part.slice(1, 7).forEach((p) => {
                        if (hasdashr && !part[0].name.startsWith(lastword) && !lastisdash) return;
                        if (hasdashb) {
                            let newCount = parseInt(p.count) + (collectionBox[p.name] ?? 0);
                            if (range(newCount) === word.toUpperCase()) {
                                edlist.push(`${`[${newCount}]`.padEnd(5)}| ${p.name}`);
                                pFoundStats++
                            }
                        } else {
                            if (p.type === word.toUpperCase()) {
                                edlist.push(`${`[${p.count}]`.padEnd(5)}| ${p.name}`);
                                pFoundStats++
                            }
                        }
                    });
                    if (pFoundStats) {
                        statusRelics.push([`${`${pFoundStats}`.padEnd(2)}| ${`{${part[0].tokens}}`.padEnd(6)}| ${part[0].name}`, pFoundStats])
                    }
                });
                const statushex = hex[word.toUpperCase()]
                
                if (!edlist.length) {
                    return message.reply({ embeds: [
                        new EmbedBuilder().setTitle(`[ ${word.toUpperCase()} ]`).setTimestamp().setColor(statushex)
                    ] })
                }
                
                const arrayOfEmbeds = [];
                if (hasdashr) {
                    statusRelics = statusRelics.sort(
                        (a, b) => 
                            parseInt(`${b[1]}${b[0].match(/\{(.+?)\}/)[1]}`) -
                            parseInt(`${a[1]}${a[0].match(/\{(.+?)\}/)[1]}`)
                    );

                    for (let i = 0; i < statusRelics.length; i += 15) {
                        arrayOfEmbeds.push(
                            new EmbedBuilder()
                                .setTitle(`[ ${word.toUpperCase()} DIFF ]`)
                                .setDescription(codeBlock("ml", statusRelics.slice(i, i + 15).map(x => x[0]).join("\n")))
                                .setColor(statushex)
                        )
                    }
                } else {
                    edlist = [...new Set(edlist)].sort(
                        (a, b) =>
                            a.split("|")[0].match(/\[(.+?)\]/)[1] -
                            b.split("|")[0].match(/\[(.+?)\]/)[1]
                    );
                    for (let i = 0; i < edlist.length; i += 15) {
                        arrayOfEmbeds.push(
                            new EmbedBuilder()
                                .setTitle(`[ ${word.toUpperCase()} ]`)
                                .setDescription(codeBlock("ml", edlist.slice(i, i + 15).join("\n")))
                                .setColor(statushex)
                        );
                    }
                }
                
                const pagination = new Pagination(message, {
                    firstEmoji: "⏮",
                    prevEmoji: "◀️",
                    nextEmoji: "▶️",
                    lastEmoji: "⏭",
                    idle: 240_000,
                    buttonStyle: ButtonStyle.Secondary,
                    loop: true,
                });

                pagination.setEmbeds(arrayOfEmbeds, (embed, index, array) => {
                    if (hasdashr) {
                        embed.setDescription(`Format:\n${codeBlock(`ml`, `COUNT | {TOKEN} | RELIC`)}` + embed.data.description);
                    }
                    return embed.setFooter({
                        text: `Page ${index + 1}/${array.length}`,
                    });
                });
                pagination.render();
                break;

            case "part":
                if (!allrelics.partNames.some(x => x.indexOf(word) !== -1) || (word.split(' ').length === 1)) return;
                if (word.split(' ')[1].length === 1 && word.split(' ')[1] != '&') return;
                const scarcity = ["C", "C", "C", "UC", "UC", "RA"];
                let dataOfPart, trueName;

                const relicList = allrelics.relicData
                    .map((relic) => {
                        const item = relic[0].has.findIndex((x) => x.indexOf(word) !== -1);
                        if (item === -1) return;
                        if (!dataOfPart) dataOfPart = [relic[item + 1].count, relic[item + 1].type];
                        if (!trueName) trueName = relic[item + 1].name;
                        return `${scarcity[item].padEnd(2)} | ${relic[0].name} {${relic[0].tokens}}`;
                    })
                    .filter((x) => x !== undefined)
                    .sort((a, b) => b.match(/\{(.+?)\}/)[1] - a.match(/\{(.+?)\}/)[1]);

                let extraCount = '';
                if (hasdashb) extraCount = `(+${collectionBox[trueName] ?? 0})`;
                await message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`[ ${trueName} ] {${dataOfPart[0]}${extraCount}x}`)
                            .setDescription(codeBlock("ml", relicList.join("\n")))
                            .setFooter({ text: `${relicList.length} results` })
                            .setColor(hex[dataOfPart[1]]),
                    ],
                });
                break;

            case "prime":
                const corrWord = word.replace("Prime", "").trim() + " ";
                let parts = [];
                let codes = [];

                let getAllRelics = allrelics.relicData
                    .map((relic) => {
                        let foundAny = false;
                        relic[0].has.forEach((part, i) => {
                            if (part.indexOf(corrWord) !== -1) {
                                parts.push(relic[i + 1]);
                                foundAny = true;
                            }
                        });
                        if (foundAny) return relic[0];
                    })
                    .filter((x) => x !== undefined);
                if (!getAllRelics.length) return;

                let dataOfPartsArr = []
                parts = parts.map((x) => {
                    let extraCount = '';
                    let color = x.type === "" ? "" : `{${x.type}}`
                    if (hasdashb) {
                        extraCount = `(${collectionBox[x.name] ?? 0})`;
                        color = x.type === "" ? "" : `{${range(parseInt(x.count) + (collectionBox[x.name] ?? 0))}}`;
                    }
                    dataOfPartsArr.push(x.count ?? 0)
                    codes.push(codeObj[color.match(/\{(.*)\}/)[1]])
                    return `${hasdashb ? `${x.count}${extraCount}`.padEnd(6) : `${x.count}`.padEnd(3)}| ${x.name} ${color}`;
                });
                parts = [...new Set(parts)];
                codes = hex[colorObj[Math.min(...codes)]]

                const countmin = Math.min(...dataOfPartsArr)
                const embedArray = [
                    new EmbedBuilder()
                        .setTitle(`[ ${word} ] {${countmin}x}`)
                        .setDescription(codeBlock("ml", parts.join("\n")))
                        .setColor(codes),
                ];

                if (hasdashr) {
                    embedArray.push(
                        new EmbedBuilder().setDescription(
                            codeBlock("ml", getAllRelics
                                .map((x) => `${`{${x.tokens}}`.padEnd(5)}| ${x.name}`)
                                .sort((a, b) => b.match(/\{(.+?)\}/)[1] - a.match(/\{(.+?)\}/)[1])
                                .join("\n")
                                )).setFooter({ text: `${getAllRelics.length} results` }).setColor(codes)
                    );
                }

                message.reply({ embeds: [...embedArray] });
                break;

            case "relic":
                let frelic = allrelics.relicData.filter(
                    (x) => x[0].name === filterRelic(word.toLowerCase())
                )[0];

                const rarties = ["C", "C", "C", "UC", "UC", "RA"];
                let codes2 = [];

                let emstr = await frelic
                    .slice(1, 7)
                    .map((x, i) => {
                        let extraCount = '';
                        let color = x.type === "" ? "" : `{${x.type}}`
                        if (color != "") codes2.push(codeObj[color.match(/\{(.*)\}/)[1]])
                        if (color == "") { 
                            extraCount == ""; codes2.push(100)
                        }
                        else if (hasdashb) {
                            extraCount = `(${collectionBox[x.name] ?? 0})`;
                            color = x.type === "" ? "" : `{${range(parseInt(x.count) + (collectionBox[x.name] ?? 0))}}`;
                        }
                        return `${rarties[i].padEnd(2)} | ${hasdashb ? `${x.count}${extraCount}`.padEnd(6) : `${x.count}`.padEnd(2)} | ${x.name} ${color}`
                    });

                await message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`[ ${frelic[0].name} ] {${frelic[0].tokens}}`)
                            .setDescription(codeBlock("ml", emstr.join("\n")))
                            .setColor(hex[colorObj[Math.min(...codes2)]]),
                    ],
                });
                break;
        }
    },
};