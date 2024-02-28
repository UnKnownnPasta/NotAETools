const {
    EmbedBuilder,
    SlashCommandBuilder,
} = require("discord.js");
const fs = require("node:fs/promises");

module.exports = {
    name: "wallet",
    data: new SlashCommandBuilder()
    .setName('wallet')
    .setDescription('View farmer wallet')
    .addUserOption(option => 
    option
        .setName('user')
        .setDescription('Farmer to view wallet of')
        .setRequired(true)),
    async execute(client, i) {
        const farmer = (await JSON.parse(await fs.readFile('./data/clandata.json'))).farmerids
        const foundid = farmer.filter(x => x.id == i.options.getUser('user', true).id)
        if (foundid.length == 0) return i.reply({ embeds: [new EmbedBuilder().setTitle(`No IGN Found`)], ephemeral: true });
        else {
            const uf = foundid[0]
            const fEmbed = new EmbedBuilder().setTitle(`Wallet of: ${uf.name}`)
            .addFields([
                { name: 'Tokens', value: `${uf.ttltokens}, bonus: ${uf.bonus}, left: ${uf.left}` },
                { name: 'Playtime', value: `${uf.playtime} minutes` },
            ]).setTimestamp();
            i.reply({ embeds: [fEmbed] })
        }
    },
};
