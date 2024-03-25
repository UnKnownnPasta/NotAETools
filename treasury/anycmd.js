const { EmbedBuilder, codeBlock, ButtonStyle } = require("discord.js");
const fs = require("node:fs/promises");
const { Pagination } = require("pagination.djs");
const { filterRelic } = require("../scripts/utility.js");
const path = require("node:path");

const range = (num) => {
    return num >= 0 && num <= 7 ? 'ED'
           : num > 7 && num <= 15 ? 'RED'
           : num > 15 && num <=31 ? 'ORANGE'
           : num > 31 && num <=64 ? 'YELLOW'
           : 'GREEN'
}

module.exports = {
    name: "anycmd",
    async execute(client, message, wd, type) {
        const allrelics = await JSON.parse(await fs.readFile(path.join(__dirname, '..', 'data/relicdata.json')));
        const word = wd.replace(/--[rb]/g, "").trim();
        const collectionBox = await JSON.parse(await fs.readFile(path.join(__dirname, '..', 'data/boxdata.json')));
        let hasdashb = wd.match(/--[b]/, "") !== null

        switch (type) {
            case "status":
                let edlist = [];
                let statusRelics = [];
                allrelics.relicData.forEach((part) => {
                    let pFoundStats = 0;
                    part.slice(1, 7).forEach((p) => {
                        if (p.type === word.toUpperCase()) {
                            edlist.push(`${`[${p.count}]`.padEnd(5)}| ${p.name}`);
                            pFoundStats++
                        }
                    });
                    if (pFoundStats) {
                        statusRelics.push([`${`${pFoundStats}`.padEnd(2)}| ${`{${part[0].tokens}}`.padEnd(6)}| ${part[0].name}`, pFoundStats])
                    }
                });

                edlist = [...new Set(edlist)].sort(
                    (a, b) =>
                        a.split("|")[0].match(/\[(.+?)\]/)[1] -
                        b.split("|")[0].match(/\[(.+?)\]/)[1]
                );
                
                const arrayOfEmbeds = [];
                if (wd.match(/--[r]/, "") !== null) {
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
                        )
                    }
                } else {
                    for (let i = 0; i < edlist.length; i += 15) {
                        arrayOfEmbeds.push(
                            new EmbedBuilder()
                                .setTitle(`[ ${word.toUpperCase()} ]`)
                                .setDescription(codeBlock("ml", edlist.slice(i, i + 15).join("\n")))
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
                    if (wd.match(/--[r]/, "") !== null) {
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
                let countOfPart, trueName;

                const relicList = allrelics.relicData
                    .map((relic) => {
                        const item = relic[0].has.findIndex((x) => x.indexOf(word) !== -1);
                        if (item === -1) return;
                        if (!countOfPart) countOfPart = relic[item + 1].count;
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
                            .setTitle(`[ ${trueName} ] {x${countOfPart}${extraCount}}`)
                            .setDescription(codeBlock("ml", relicList.join("\n")))
                            .setFooter({ text: `${relicList.length} results` }),
                    ],
                });
                break;

            case "prime":
                if (word.replace(/.*Prime/, '').length >= 2) return;
                const corrWord = word.replace("Prime", "").trim() + " ";
                let parts = [];

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

                
                parts = parts.map((x) => {
                    let extraCount = '';
                    let color = x.type === "" ? "" : `{${x.type}}`
                    if (hasdashb) {
                        extraCount = `(${collectionBox[x.name] ?? 0})`;
                        color = x.type === "" ? "" : `{${ range(parseInt(x.count) + (collectionBox[x.name] ?? 0)) }}`;
                    }
                    return `${hasdashb ? `${x.count}${extraCount}`.padEnd(6) : `${x.count}`.padEnd(3)}| ${x.name} ${color}`;
                });
                parts = [...new Set(parts)];

                const embedArray = [
                    new EmbedBuilder()
                        .setTitle(`[ ${word} ]`)
                        .setDescription(codeBlock("ml", parts.join("\n"))),
                ];

                if (wd.match(/--[r]/, "") !== null) {
                    embedArray.push(
                        new EmbedBuilder().setDescription(
                            codeBlock("ml", getAllRelics
                                .map((x) => `${`{${x.tokens}}`.padEnd(5)}| ${x.name}`)
                                .sort((a, b) => b.match(/\{(.+?)\}/)[1] - a.match(/\{(.+?)\}/)[1])
                                .join("\n")
                                )).setFooter({ text: `${getAllRelics.length} results` })
                    );
                }

                message.reply({ embeds: [...embedArray] });
                break;

            case "relic":
                let frelic = allrelics.relicData.filter(
                    (x) => x[0].name === filterRelic(word.toLowerCase())
                )[0];

                const rarties = ["C", "C", "C", "UC", "UC", "RA"];
                let emstr = await frelic
                    .slice(1, 7)
                    .map((x, i) => {
                        let extraCount = '';
                        let color = x.type === "" ? "" : `{${x.type}}`
                        if (hasdashb) {
                            extraCount = `(${collectionBox[x.name] ?? 0})`;
                            color = x.type === "" ? "" : `{${ range(parseInt(x.count) + (collectionBox[x.name] ?? 0)) }}`;
                        }
                        return `${rarties[i].padEnd(2)} | ${hasdashb ? `${x.count}${extraCount}`.padEnd(6) : `${x.count}`.padEnd(2)} | ${x.name} ${color}`
                    });
                await message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`[ ${frelic[0].name} ] {${frelic[0].tokens}}`)
                            .setDescription(codeBlock("ml", emstr.join("\n"))),
                    ],
                });
                break;
        }
    },
};