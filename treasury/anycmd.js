const { EmbedBuilder, codeBlock, ButtonStyle } = require("discord.js");
const fs = require("node:fs");
const { Pagination } = require("pagination.djs");
const { filterRelic } = require("../scripts/utility.js");

module.exports = {
    name: "anycmd",
    async execute(client, message, wd, type) {
        const allrelics = await JSON.parse(
            fs.readFileSync("./data/relicdata.json")
        );
        const word = wd.replace(/--[r]/, "").trim();

        switch (type) {
            case "status":
                let edlist = [];
                allrelics.relicData.forEach((part) => {
                    part.slice(1, 7).forEach((p) => {
                        if (p.type === word.toUpperCase())
                            edlist.push(`${`[${p.count}]`.padEnd(3)} | ${p.name}`);
                    });
                });

                edlist = [...new Set(edlist)].sort(
                    (a, b) =>
                        a.split("|")[0].match(/\[(.+?)\]/)[1] -
                        b.split("|")[0].match(/\[(.+?)\]/)[1]
                );
                const embedOfParts = [];
                for (let i = 0; i < edlist.length; i += 15) {
                    embedOfParts.push(
                        new EmbedBuilder()
                            .setTitle(`[ ${word.toUpperCase()} ]`)
                            .setDescription(codeBlock("ml", edlist.slice(i, i + 15).join("\n")))
                    );
                }

                const pagination = new Pagination(message, {
                    firstEmoji: "⏮",
                    prevEmoji: "◀️",
                    nextEmoji: "▶️",
                    lastEmoji: "⏭",
                    idle: 60000,
                    buttonStyle: ButtonStyle.Secondary,
                    loop: true,
                });

                pagination.setEmbeds(embedOfParts, (embed, index, array) => {
                    return embed.setFooter({
                        text: `Page ${index + 1}/${array.length}`,
                    });
                });
                pagination.render();
                break;

            case "part":
                if (!allrelics.partNames.some(x => x.indexOf(word) !== -1) || (word.split(' ').length === 1)) return;
                if (word.split(' ')[1].length === 1) return;
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
                    .filter((x) => x !== undefined);

                await message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`[ ${trueName} ] {x${countOfPart}}`)
                            .setDescription(codeBlock("ml", relicList.sort((a, b) => b.slice(b.indexOf('{')).localeCompare(a.slice(a.indexOf('{')))).join("\n")))
                            .setFooter({ text: `${relicList.length} results` }),
                    ],
                });
                break;

            case "prime":
                if (word.replace(/.*Prime/, '').length >= 2) return;
                const corrWord = word.replace("Prime", "").trim();
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

                parts = parts.map((x) => `${x.count.padEnd(2)} | ${x.name}`);
                parts = [...new Set(parts)];

                const embds = [
                    new EmbedBuilder()
                        .setTitle(`[ ${word} ]`)
                        .setDescription(codeBlock("ml", parts.join("\n"))),
                ];

                if (wd.match(/--[r]/, "") !== null) {
                    embds.push(
                        new EmbedBuilder().setDescription(
                            codeBlock("ml", getAllRelics
                                .map((x) => `${`{${x.tokens}}`.padEnd(4)} | ${x.name}`)
                                .sort((a, b) => b.slice(b.indexOf('{')).localeCompare(a.slice(a.indexOf('{'))))
                                .join("\n")
                                )).setFooter({ text: `${getAllRelics.length} results` })
                    );
                }

                message.reply({ embeds: [...embds] });
                break;

            case "relic":
                let frelic = allrelics.relicData.filter(
                    (x) => x[0].name === filterRelic(word.toLowerCase())
                )[0];

                const rarties = ["C", "C", "C", "UC", "UC", "RA"];
                let emstr = frelic
                    .slice(1, 7)
                    .map((x, i) => `${rarties[i].padEnd(2)} | ${x.count.padEnd(2)} | ${x.name} ${x.type === "" ? "" : `{${x.type}}`}`);
                message.reply({
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
