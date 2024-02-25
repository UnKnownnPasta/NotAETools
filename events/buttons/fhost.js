const {
    EmbedBuilder,
    SlashCommandBuilder,
    Client,
    ButtonInteraction,
    ActionRowBuilder,
} = require("discord.js");
const { titleCase } = require("../../scripts/utility");

module.exports = {
    name: "fhost",
    /**
     * Button handling for fhost
     * @param {Client} client 
     * @param {ButtonInteraction} i 
     */
    async execute(client, i) {
        const emb = i.message.embeds[0],
        title = emb.title,
        frameChoices = emb.fields
        .map(x => {
            x.name == 'Any' ? [ x.name, x.value.split(', ').map(x => x.slice(2, -1)) ] : [ x.name.replace(' ', '_'), x.value.slice(2, -1) ]
        }),
        squadButtons = i.message.components
            .map(x => x.components)
            .flat();

        const allids = frameChoices.map(fieldvals => fieldvals[1]).flat();
        if (allids.includes(i.user.id) && i.customId != 'fhost-❌') return i.update({ });
        
        const whatFrame = frameChoices.filter(x => x[0] == titleCase(i.customId.split('-')[1]))
        if (whatFrame.length == 0) {
            if (i.customId == 'fhost-❌' && allids.includes(i.user.id) && i.message.content.slice(2, -1) != i.user.id) {
                const newFields = emb.fields.map(x => {
                    let returnedField = {}
                    if (x.name == 'Any') {
                        let users = x.value == 'None' ? [] : x.value.split(', ')
                        users = users.filter(x => x.slice(2, -1) != i.user.id)
                        returnedField = { name: x.name, value: users.length == 0 ? 'None' : users.join(', '), inline: true }
                    } else {
                        let newValue = x.value
                        if (x.value.slice(2, -1) == i.user.id) {
                            squadButtons.find(y => y.label == x.name).data.disabled = !squadButtons.find(y => y.label == x.name).data.disabled;
                            newValue = 'None'
                        }
                        returnedField = { name: x.name, value: newValue, inline: true };
                    }
                    return returnedField;
                })
                await i.update({
                    embeds: [
                        new EmbedBuilder().setTitle(title).addFields(newFields),
                    ],
                    components: [
                        new ActionRowBuilder().addComponents(
                            squadButtons.slice(0, 5)
                        ),
                        new ActionRowBuilder().addComponents(
                            squadButtons.slice(5)
                        ),
                    ],
                });
            } else if (i.customId == 'fhost-❌' && i.message.content.slice(2, -1) == i.user.id) {
                await i.message.delete();
                await i.channel.send({ embeds: [new  EmbedBuilder()
                .setTitle(`Squad for ${title.split(', ').slice(0, 2).join(', ')} is cancelled`)] }).then((x) => setTimeout(async () => {
                    await x.delete();
                }, 10000))
            }
        }
        if (i.customId == 'fhost-❌') return;
        const frameName = whatFrame[0][0], chosen = whatFrame[0][1] != 'n';

        if (!chosen && frameName != 'Any') {
            const newFields = emb.fields.map(x => { 
                if (x.name == frameName.replace('_', ' '))  {
                    (squadButtons.find(x => x.customId == `fhost-${frameName.toLowerCase()}`)).data.disabled = true
                    return { name: frameName.replace('_', ' '), value: `<@${i.user.id}>`, inline: true };
                } else return x
            })

            allids.push(i.user.id)
            await i.update({ embeds: [new EmbedBuilder().setTitle(title).addFields(newFields)], components: [new ActionRowBuilder().addComponents(squadButtons.slice(0, 5)), new ActionRowBuilder().addComponents(squadButtons.slice(5))] })
        } else if (frameName == 'Any') {
            const newFields = emb.fields.map(x => { 
                if (x.name == 'Any')  {
                    let val = x.value == 'None' ? [] : x.value.split(', ')
                    let check = val.map(x => x.slice(2, -1)).filter(x => x == i.user.id).length
                    if (check !== 0) return i.update({ })
                    val.push(`<@${i.user.id}>`)
                    return { name: 'Any', value: val.join(', '), inline: true }
                } else return x;
            })
            
            allids.push(i.user.id)
            await i.update({ embeds: [new EmbedBuilder().setTitle(title).addFields(newFields)] })
        } else {
            await i.update({ });
        }

        if (allids.length == 4) {
            console.log("squad filled");
        }
    },
};
