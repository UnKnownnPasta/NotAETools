const {
    EmbedBuilder,
    SlashCommandBuilder,
    Client,
    CommandInteraction,
    codeBlock
} = require("discord.js");
const fs = require("node:fs/promises");
const path = require("node:path");
const { getAllClanData } = require("../scripts/dbcreate");

const clanOptions = [
    { name: "Imouto Kingdom", value: "IK" },
    { name: "Waifu Kingdom", value: "WK" },
    { name: "Manga Kingdom", value: "MK" },
    { name: "Yuri Kingdom", value: "YK" },
    { name: "Cowaii Kingdom", value: "CK" },
    { name: "Tsuki Kingdom", value: "TK" },
    { name: "Heavens Kingdom", value: "HK" },
    { name: "Andromeda Kingdom", value: "AK" }
]

const reverseClan = {
    IK: "Imouto Kingdom",
    WK: "Waifu Kingdom",
    MK: "Manga Kingdom",
    YK: "Yuri Kingdom",
    CK: "Cowaii Kingdom",
    TK: "Tsuki Kingdom",
    HK: "Heavens Kingdom",
    AK: "Andromeda Kingdom"
};

module.exports = {
    name: "clan",
    data: new SlashCommandBuilder()
    .setName('clan')
    .setDescription('View resources for a specific clan')
    .addStringOption((option) =>
    option
        .setName('clan')
        .setDescription('Clan to view resources of')
        .setRequired(true)
        .addChoices(...clanOptions)
    ),
    /**
     * Command to retrieve resources of a specific clan
     * @param {Client} client 
     * @param {CommandInteraction} i 
     */
    async execute(client, i) {
        await i.deferReply()
        const clan = i.options.getString('clan', true)
        
        let embedDesc = []
        const clanResources = await getAllClanData(clan);
        
        await Object.entries(clanResources.resource).map(([ key, { amt, short } ]) => {
            embedDesc.push(`${key.padEnd(17)} | Amt: ${amt} (+${short})`)
        });

        const clanEmbed = new EmbedBuilder()
        .setTitle(`Resource overview of ${reverseClan[clan]}`)
        .setDescription(codeBlock('ml', embedDesc.join("\n")));
        await i.editReply({ embeds: [clanEmbed] })
    },
};
