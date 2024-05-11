const {
    EmbedBuilder,
    Client,
    ButtonInteraction,
    ActionRowBuilder,
} = require("discord.js");
const fs = require('node:fs/promises');
const path = require("node:path");
const { getAllUserData } = require("../../scripts/dbcreate");

module.exports = {
    name: "fhost",
    /**
     * Button handling for fhost
     * @param {Client} client 
     * @param {ButtonInteraction} i 
     */
    async execute(client, i) {
        const hostEmbed = i.message.embeds[0];
        let globalHostEmbed = new EmbedBuilder();
        const hostTitle = hostEmbed.title;
        globalHostEmbed.setTitle(hostTitle)

        let hostFields = hostEmbed.fields.map((fld) => {
            return [fld.name, fld.value.split(', ').map(x => x.slice(2, -1)).join('|')]
        })
        let hostComps = i.message.components.map(x => x.components).flat();
        const allIDs = hostFields.map(x => x[1].split('|')).flat()
        if (allIDs.includes(i.user.id) && i.customId != 'fhost-❌') return i.update({ });

        const newRow = (arr) => new ActionRowBuilder().addComponents(arr)
        
        if (i.customId == 'fhost-❌' && allIDs.includes(i.user.id) && i.message.content.slice(2, -1) != i.user.id) {
            const joinedField = hostFields.findIndex(x => x[1].split('|').includes(i.user.id))
            const joinedButton = hostComps.findIndex(x => x.customId == `fhost-${hostFields[joinedField][0]}`)
            if (hostComps[joinedButton].customId != 'fhost-Any') {
                hostComps[joinedButton].data.disabled = !hostComps[joinedButton].disabled;
            }
            hostFields[joinedField][1] = hostFields[joinedField][1].split('|').filter(x => x != i.user.id).join('|')

            hostFields = hostFields.map(x => [x[0], x[1].split('|').map(y => y == 'n' || !y ? 'None' : `<@${y}>`).join(', ')])
            globalHostEmbed.addFields(...hostFields.map(x => { return { name: x[0], value: x[1], inline: true } })).setTimestamp()
            allIDs[joinedButton] = 'n'
            await i.update({ content: i.message.content, embeds: [globalHostEmbed], components: [newRow(hostComps.slice(0, 5)), newRow(hostComps.slice(5))] })
        } else if (i.customId == 'fhost-❌' && allIDs.includes(i.user.id) && i.message.content.slice(2, -1) == i.user.id) {
            await i.message.delete();
            await i.channel.send({ embeds: [
                new EmbedBuilder().setTitle(`Run "${hostTitle}" was cancelled`)
            ] })
        } else {
            const getField = hostFields.findIndex(x => x[0] == i.customId.split('-')[1]);
            if (getField === -1) return i.update({ });
            if (hostFields[getField][1] != 'n' && i.customId != 'fhost-Any') return await i.update({ });
            let currentField = [...hostFields[getField][1].split('|')].filter(x => x != 'n')
            currentField.push(i.user.id)
            hostFields[getField][1] = currentField.join('|')
            
            const clickedButton = hostComps.findIndex(x => x.customId == `fhost-${hostFields[getField][0]}`)
            if (hostComps[clickedButton].customId !== `fhost-Any`) {
                hostComps[clickedButton].data.disabled = !hostComps[clickedButton].disabled;
            }
            hostFields = hostFields.map(x => [x[0], x[1].split('|').map(y => y == 'n' || !y ? 'None' : `<@${y}>`).join(', ')])
            globalHostEmbed.addFields(...hostFields.map(x => { return { name: x[0], value: x[1], inline: true } })).setTimestamp()
            allIDs.push(i.user.id)
            await i.update({ content: i.message.content, embeds: [globalHostEmbed], components: [newRow(hostComps.slice(0, 5)), newRow(hostComps.slice(5))] })
        }

        if (allIDs.filter(x => x != 'n').length >= 4) {
            await i.message.edit({ content: 'Preparing squad...', components: [] });
            let names = await getAllUserData('farmer')
            await i.message.delete();

            const IDList = allIDs.filter(x => x != 'n').slice(0, 4).map(ids => {
                const jsofuser = names.find(user => user.uid == ids)
                return jsofuser ?  `<@${ids}> /inv ${jsofuser?.name}` : `<@${ids}> No IGN found`
            })
            await i.channel.send({ content: `${IDList.join("\n")}`, embeds: [globalHostEmbed] });
        }
    },
};
