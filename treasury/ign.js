const {
    EmbedBuilder,
    SlashCommandBuilder,
} = require("discord.js");
const fs = require("node:fs/promises");
const path = require("node:path");
const { getAllUserData } = require("../scripts/dbcreate");

module.exports = {
    name: "ign",
    disabled: true,
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
        const treasury = await getAllUserData('treasury')
        const foundid = treasury.filter(x => x.uid == i.options.getUser('user', true).id)
        if (foundid.length == 0) return i.reply({ embeds: [new EmbedBuilder().setTitle(`No IGN Found`)], ephemeral: true })
        else i.reply({ embeds: [new EmbedBuilder().setTitle(`/inv ${foundid[0].name}`).setFooter({ text: `ID: ${foundid[0].uid} - Consider using LunaBot instead` })] })
    },
};
