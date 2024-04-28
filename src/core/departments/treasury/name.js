const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const database = require('../../../database/init')

module.exports = {
    name: 'name',
    type: 'slash',
    data: new SlashCommandBuilder()
        .setName('name')
        .setDescription('Get the In-Game-Name of a user')
        .addUserOption((option) =>
            option
                .setName('user')
                .setDescription('User to get ign of')
                .setRequired(true)
        ),
    async execute (client, i) {
        const searchID = i.options.getUser('user', true).id
        const recordInDB = await database.models.Users.findOne({ where: { uid: searchID } })

        if (!recordInDB) {
            return i.reply({ embeds: [new EmbedBuilder().setTitle(`No IGN Found.`).setColor('#A95C68')], ephemeral: true })
        } else {
            const IGNEmbed = new EmbedBuilder()
            .setTitle(`/inv ${recordInDB.dataValues.name}`)
            .setFooter({ text: `ID: ${recordInDB.dataValues.uid}` })
            .setColor('#E35335')

            await i.reply({ embeds: [IGNEmbed] })
        }
    }
}
