const { Client, EmbedBuilder, ButtonInteraction } = require("discord.js");
const database = require('../../database/init')

module.exports = { 
    name: "thost",
/**
 * Updating embed with button functionality
 * @param {Client} client 
 * @param {ButtonInteraction} i 
 */
    async execute(client, i) {
        const hostEmbed = i.message.embeds[0]
        const embedDesc = hostEmbed.description.split('\n')
        const embedTitle = hostEmbed.title.split(" ")

        let setOfUsers = embedDesc.map(x => x.match(/\d+/)[0])
        const relic = hostEmbed.data.fields[0].name.split(" ").slice(0, 3).join(" ")
        const relicEmbed = new EmbedBuilder(hostEmbed);

        switch (i.customId) {
            case 'thost-join':
                if (setOfUsers.indexOf(i.user.id) !== -1) return i.update({});
                setOfUsers.push(i.user.id)

                embedTitle[embedTitle.length - 1] = `${setOfUsers.length}/4`
                relicEmbed.setTitle(embedTitle.join(" "))

                relicEmbed.setDescription(setOfUsers.map(x => `<@!${x}>`).join('\n'))
                await i.update({ embeds: [relicEmbed] })

                if (setOfUsers.length >= 4) {
                    let userData = await database.models.Users.findAll()

                    let usersInviteDesc = ""
                    setOfUsers.slice(0, 4).forEach(squadMemberID => {
                        var foundUserOrNot = userData.find(n => n.dataValues.uid === squadMemberID)
                        if (!foundUserOrNot) usersInviteDesc +=  `<@${squadMemberID}> - No IGN known\n`
                        else usersInviteDesc += `<@${squadMemberID}> - /inv ${foundUserOrNot.dataValues.name}\n`
                    })
                    
                    const filledEmbed = new EmbedBuilder()
                    .setTitle(`Run for ${relic} FILLED`)
                    .setDescription(`Invite Others:\n` + usersInviteDesc)

                    try {
                        await i.message.delete()
                        await i.channel.send({ embeds: [filledEmbed], content: `${setOfUsers.slice(0, 4).map(x => `<@${x}>`).join(" ")}` })
                    } catch (error) {
                        return i?.followUp({ content: `Could not join run, squad is filled`, ephemeral: true });
                    } 
                }
                break;

            case 'thost-cancel':
                if (setOfUsers.indexOf(i.user.id) === -1) return i.update({ });
                else if (i.user.id == setOfUsers[0]) {
                    await i.update({ content: null });
                    await i.message.delete();
                    await i.channel.send({
                        embeds: [new EmbedBuilder().setTitle(`Run for ${relic} is cancelled`)],
                    });
                    return;
                } else if (setOfUsers.indexOf(i.user.id) != -1) {
                    setOfUsers = setOfUsers.filter((x) => x != i.user.id);
                    relicEmbed.setDescription(
                        relic + '\n' + setOfUsers.map((x) => `<@!${x}>`).join("\n")
                    );
                    i.update({ embeds: [relicEmbed] });
                }
                break;

            case 'thost-relicview':
                await i.reply({ content: `not supported`, ephemeral: true })
                break;
        }
    },
}