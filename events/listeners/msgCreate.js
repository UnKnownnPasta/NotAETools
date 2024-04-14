const { Message, Client, AttachmentBuilder } = require("discord.js");
const config = require("../../data/config.json");
const { filterRelic, relicExists } = require("../../scripts/utility");
const fs = require('node:fs/promises');
const path = require("node:path");
const logger = require("../../scripts/logger");

module.exports = {
    name: "messageCreate",
    once: false,
    /**
     * messageCreate event listener
     * @param {Client} client
     * @param {Message} message
     */
    async listen(client, message) {
        if (message.content == '++dump' && (message.author.id == '740536348166848582' || message.author.id == '498993740715917312')) {
            const logfile = await fs.readFile(path.join(__dirname, '..', '..', 'data', 'app.log'))
            return await message.author.send({ files: [new AttachmentBuilder(Buffer.from(logfile, 'utf-8'), { name: 'dump.txt' })] })
        }
        if (!message.content.startsWith(config.prefix) || message.author.bot)
            return;

        let word = message.content.slice(2).toLocaleLowerCase();
        let cmdType = "";

        let isPrime = word.split(/\s+/g).includes("prime");
        let isRelic = await relicExists(filterRelic(word.toLowerCase().replace(/\b\s*[-]?(r|b|box)\s*.*?$/, "").trim()));
        let isStatus = /\b(ed|red|orange|green|yellow)\b(\b\s+[-]?(?:r|b|box)\b)?(.*)?/g.test(word);

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
        logger.info(`[CMD] Ran ++${cmdType} command by ${message.member.nickname ?? message.author.username} with arguments: "${word}" @ ${new Date().toLocaleString()}`);
        },
};
