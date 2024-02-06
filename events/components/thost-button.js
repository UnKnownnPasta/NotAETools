const {
    Client,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ButtonInteraction,
} = require("discord.js");

module.exports = { 
    name: "rules_delete",
/**
 * Updating embed with removed rules set
 * @param {Client} client 
 * @param {ButtonInteraction} i 
 */
    async execute(client, i) {
        var setOfUsers = i.message.embeds[0].description.split('\n')
        switch (i.customId) {

            case 'thost-join':
                if (setOfUsers.indexOf(i.user.id) !== -1) return;

                setOfUsers.push(i.user.id)
                const relicEmbed = new EmbedBuilder()
                    .setTitle(`${i.message.embeds[0].title}`);

                relicEmbed.setDescription(setOfUsers.map(x => `<@!${x}>`).join('\n'))
                i.update({ embeds: [relicEmbed] })

                if (setOfUsers.length === 4) {
                    const filledEmbed = new EmbedBuilder()
                    .setTitle(`Run for [${relicStuff}] filled`)
                    .setDescription(setOfUsers.map(x => `<@!${x}> - /invite ${userData.find(v => v[0] == x)[1]}`).join('\n'))

                    i.message.delete()
                    i.channel.send({ embeds: [filledEmbed] })
                    collector.stop()
                    return;
                }
                break;

            case 'thost-cancel':
                if (setOfUsers.indexOf(i.user.id) === -1)
                    return i.update({ embeds: [relicEmbed] });
                else if (
                    i.user.id === interaction.user.id &&
                    setOfUsers.length === 1
                ) {
                    i.update({ embeds: [] });
                    i.deleteReply();
                    i.channel.send({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle(`Run for ${relicStuff} is cancelled`)
                                .setDescription(
                                    `Run was cancelled by the host.`
                                ),
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

    rulesDeleteButton(memId, gldId) {
        return new ButtonBuilder()
            .setCustomId(`rules_delete-${memId}-${gldId}`)
            .setLabel("Delete a rule")
            .setStyle(ButtonStyle.Danger);
    }
}