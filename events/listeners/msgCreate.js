const { Message, Client, AttachmentBuilder } = require("discord.js");
const config = require("../../data/config.json");
const { filterRelic, relicExists, titleCase } = require("../../scripts/utility");
const fs = require('node:fs/promises');
const path = require("node:path");
const logger = require("../../scripts/logger");

const authCategories = ["890240564916797457", "1193155346156503091"]

module.exports = {
    name: "messageCreate",
    once: false,
    /**
     * messageCreate event listener
     * @param {Client} client
     * @param {Message} message
     */
    async listen(client, message) {
        if (message.content === "++filter" && (message.author.id == '740536348166848582' || message.author.id == '498993740715917312')) {
            client.dofilter = !client.dofilter;
            await message.reply({ content: `> ${process.env.NODE_ENV} - ${client.dofilter}` });
        }

        if (message.content == '++dump' && (message.author.id == '740536348166848582' || message.author.id == '498993740715917312')) {
            const logfile = await fs.readFile(path.join(__dirname, '..', '..', 'data', 'app.log'))
            return await message.author.send({ files: [new AttachmentBuilder(Buffer.from(logfile, 'utf-8'), { name: 'dump.txt' })] })
        }

        if (!message.content.startsWith(config.prefix) || message.author.bot)
            return;

        if (!message.channel.isDMBased() && client.dofilter && !authCategories.includes(message.channel.parentId)) 
            return logger.warn(`[UNAUTH/MSG] ${message.author.displayName} @ ${message.channel.name}: ${message.content}`);

        let word = message.content.slice(2).toLocaleLowerCase();
        const wordTitled = titleCase(word)
        let cmdType = "";

        let isStatus = /\b(ed|red|orange|green|yellow)\b(\b\s+[-]?(?:r|b|box)\b)?(.*)?/g.test(word);
        let isRelic = await relicExists(filterRelic(word.toLowerCase().replace(/\b\s*[-](r|b|box)$/, "").trim()));
        let isPrime = (word.split(/\s+/g).includes("prime") || 
            ['BP', 'Blueprint', 'Chassis', 'Neuroptics', 'Systems', 'Barrel', 'Receiver', 'Stock', 'Grip', 'Lower Limb', 'String', 'Upper Limb', 'Blade', 'Handle', 'Link', 'Pouch', 'Stars', 'Gauntlet', 'Ornament', 'Head', 'Disc', 'Boot', 'Hilt', 'Chain', 'Guard', 'Carapace', 'Cerebrum', 'Band', 'Buckle', 'Harness', 'Wings']
            .every(x => {
                return !wordTitled.split(" ").slice(1).some(y => x.includes(y))
            })) && !isRelic && !isStatus;

        // 1st check: not relic not prime and is ed
        // 2nd check: not relic not ed not prime
        // 3rd check: not relic not ed and is prime
        // 4th check: not prime not ed and is relic
        if (!isRelic && isStatus && !isPrime) {
            cmdType = "status";
        } else if (!isRelic && !isStatus && !isPrime) {
            cmdType = "part";
        } else if (!isRelic && !isStatus && isPrime) {
            cmdType = "prime";
        } else if (isRelic && !isStatus && !isPrime) {
            cmdType = "relic";
        }

        client.treasury
            .get("anycmd")
            ?.execute(client, message, word.toLowerCase(), cmdType);
        logger.info(`[CMD] Ran ++${cmdType} command by ${message.member?.nickname ?? message.author.username} with arguments: "${word}" @ ${new Date().toLocaleString()}`);
    },
};
