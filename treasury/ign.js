const {
    EmbedBuilder,
    SlashCommandBuilder,
} = require("discord.js");
const fs = require("node:fs/promises");
const path = require("node:path");

module.exports = {
    name: "ign",
    data: new SlashCommandBuilder()
        .setName("ign")
        .setDescription("Get ign of a user")
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("User to get ign of")
                .setRequired(true)
        ),
    async execute(client, i) {
        const treasury = (await JSON.parse(await fs.readFile(path.join(__dirname, '..', 'data/clandata.json')))).treasuryids
        const foundid = treasury.filter(x => x.id == i.options.getUser('user', true).id)
        if (foundid.length == 0) return i.reply({ embeds: [new EmbedBuilder().setTitle(`No IGN Found`)], ephemeral: true })
        else i.reply({ embeds: [new EmbedBuilder().setTitle(`/inv ${foundid[0].name}`).setFooter({ text: `ID: ${foundid[0].id} - Consider using LunaBot instead` })] })
    },
};
