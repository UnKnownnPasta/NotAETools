const {
    Client,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ButtonInteraction,
} = require("discord.js");
const fs = require('node:fs')

module.exports = { 
    name: "thost",
/**
 * Updating embed with removed rules set
 * @param {Client} client 
 * @param {ButtonInteraction} i 
 */
    async execute(client, i) {
        const embedDesc = i.message.embeds[0].description.split('\n')
        const setOfUsers = embedDesc.slice(1).map(x => x.slice(3, -1))
        const relic = embedDesc[0]
        switch (i.customId) {

            case 'thost-join':
                // if (setOfUsers.indexOf(i.user.id) !== -1) return i.update();

                setOfUsers.push(i.user.id)
                const relicEmbed = new EmbedBuilder()
                    .setTitle(`${i.message.embeds[0].title}`);

                relicEmbed.setDescription(relic + '\n' + setOfUsers.map(x => `<@!${x}>`).join('\n'))
                i.update({ embeds: [relicEmbed] })

                if (setOfUsers.length === 4) {
                    const userData = await JSON.parse(fs.readFileSync('./data/userids.json'))
                    const filledEmbed = new EmbedBuilder()
                    .setTitle(`Run for [${relic}] filled`)
                    .setDescription(`Invite Others:\n` + setOfUsers.map(x => `<@!${x}> - /inv ${userData.find(v => v[0] == x)[1] ?? '*No IGN found*'}`).join('\n'))

                    i.message.delete()
                    i.channel.send({ embeds: [filledEmbed] })
                    return;
                }
                break;

            case 'thost-cancel':
                if (setOfUsers.indexOf(i.user.id) === -1) return i.update({ embeds: [relicEmbed] });
                else if (i.user.id === i.message.content.slice(3, -1) && setOfUsers.length === 1) {
                    i.update({ embeds: [] });
                    i.deleteReply();
                    i.channel.send({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle(`Run for ${relicStuff} is cancelled`)
                                .setDescription(`Run was cancelled by the host.`),
                        ],
                    });
                    collector.stop();
                    return;

                } else if (setOfUsers.indexOf(i.user.id) != -1) {
                    setOfUsers = setOfUsers.filter((x) => x !== i.user.id);
                    relicEmbed.setDescription(
                        setOfUsers.map((x) => `<@!${x}>`).join("\n")
                    );
                    i.update({ embeds: [relicEmbed] });
                }
                break;
        }
    },
}