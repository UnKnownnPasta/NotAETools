const {
    SlashCommandBuilder,
    Client,
    CommandInteraction,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ComponentType
} = require("discord.js");
const fs = require('node:fs')

module.exports = {
	name: ['ign'],
	data: new SlashCommandBuilder()
		.setName('ign')
		.setDescription('Gives ign of specified person')
        .addUserOption(option => option.setName('user').setDescription('Gives ign of user').setRequired(true)),
	/**
	 * Descripition
	 * @param {Client} client 
	 * @param {CommandInteraction} interaction 
	 */
	async execute(client, interaction) {
		const userid = interaction.options.getUser('user', true).id
        const file = JSON.parse(fs.readFileSync('./data/userids.json'))
        for (const id of file) {
            if (id[0] == userid.toString()) {
                interaction.reply({ embeds: [ new EmbedBuilder().setTitle(`/inv ${id[1]}`) ] })
                return
            }
        }
        interaction.reply({ content: 'User not found', ephemeral: true })
	},
};