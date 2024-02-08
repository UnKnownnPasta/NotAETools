const {
    Client,
    EmbedBuilder,
    ButtonInteraction,
} = require("discord.js");
const fs = require('node:fs')

module.exports = { 
    name: "thost",
/**
 * Updating embed with button functionality
 * @param {Client} client 
 * @param {ButtonInteraction} i 
 */
    async execute(client, i) {
        const embedDesc = i.message.embeds[0].description.split('\n')
        let setOfUsers = embedDesc.slice(1).map(x => x.slice(3, -1))
        const relic = embedDesc[0]
        const relicEmbed = new EmbedBuilder()
            .setTitle(`${i.message.embeds[0].title}`);

        switch (i.customId) {

            case 'thost-join':
                // if (setOfUsers.indexOf(i.user.id) !== -1) return i.update({ embeds: [i.message.embeds[0]] });

                setOfUsers.push(i.user.id)

                relicEmbed.setDescription(relic + '\n' + setOfUsers.map(x => `<@!${x}>`).join('\n'))
                i.update({ embeds: [relicEmbed] })

                if (setOfUsers.length === 4) {
                    const userData = await JSON.parse(fs.readFileSync('./data/userids.json'))
                    let usersInviteDesc = ""
                    setOfUsers.forEach(x => {
                        var index = userData.findIndex(v => v[0] == x)
                        if (index == -1) usersInviteDesc +=  `<@${x}> - No IGN known\n`
                        else { usersInviteDesc +=  `<@${x}> - /inv ${userData[index][1]}\n` }
                    })
                    
                    const filledEmbed = new EmbedBuilder()
                    .setTitle(`Run for [${relic}] filled`)
                    .setDescription(`Invite Others:\n` + usersInviteDesc)

                    i.message.delete()
                    i.channel.send({ embeds: [filledEmbed] })
                    return;
                }
                break;

            case 'thost-cancel':
                if (setOfUsers.indexOf(i.user.id) === -1) return i.update({ });

                else if (i.user.id == i.message.content.slice(3, -1)) {
                    i.update({ content: null });
                    i.deleteReply();
                    i.channel.send({
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
        }
    },
}