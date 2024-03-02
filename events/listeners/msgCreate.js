const { Message, Client } = require("discord.js");
const config = require("../../data/config.json");
const {
    filterRelic,
    relicExists,
    titleCase,
    info,
} = require("../../scripts/utility");

module.exports = {
    name: "messageCreate",
    once: false,
    /**
     * messageCreate event listener
     * @param {Client} client
     * @param {Message} message
     */
    async listen(client, message) {
        if (!message.content.startsWith(config.prefix) || message.author.bot)
            return;

        let word = message.content.slice(2).toLocaleLowerCase();
        let cmdType = "";

        let isPrime = word.split(" ").includes("prime");
        let isRelic = await relicExists(filterRelic(word));
        let isStatus = ["ed", "red", "orange", "green"].some(
            (x) => word.indexOf(x) != -1
        );

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
            ?.execute(client, message, titleCase(word), cmdType);
        info("CMD", `Ran ++${cmdType} command by ${message.member.nickname ?? message.author.username} with arguments: "${word}" @ ${new Date().toLocaleString()}`);
        },
};
