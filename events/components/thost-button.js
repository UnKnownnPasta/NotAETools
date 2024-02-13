const {
    Client,
    EmbedBuilder,
    ButtonInteraction,
    codeBlock
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
                if (setOfUsers.indexOf(i.user.id) !== -1) return i.update({ });
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
                    i.channel.send({ embeds: [filledEmbed], content: `${setOfUsers.map(x => `<@${x}>`).join(" ")}` })
                    return;
                }
                break;

            case 'thost-cancel':
                if (setOfUsers.indexOf(i.user.id) === -1) return i.update({ });

                else if (i.user.id == i.message.content.slice(3, -1)) {
                    await i.update({ content: null });
                    await i.deleteReply();
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
                const types = { 
                    "#150b2e": "ED",
                    "#3c0000": "RED",
                    "#472502": "ORANGE",
                    "#4b3800": "YELLOW",
                    "#162e0b": "GREEN",
                    "#282828": undefined
                };
                const relicName = relic.split('x ')[1].slice(0, -1)
                let jsfile = await JSON.parse(await fs.readFileSync('./data/relicdata.json', 'utf-8'))
                const relicInfo = jsfile.filter(x => x[0][0] == relicName)[0].map(x => [x[0], types[x[1]]])
                const rarities = ['C', 'C', 'C', 'UC', 'UC', 'RA']
                
                const itemCounts = relicInfo.slice(1, -1).map(x => x[0].slice(x[0].indexOf('[')+1, -1))
                const itemNames = relicInfo.slice(1, -1).map(x => (x[0].slice(0, x[0].indexOf('[') != -1 ? x[0].indexOf('[')-1 : 100) + `${x[1] ? ` {${x[1]}}` : ''}`))
                let embedDesc = ""
                for (r=0;r<6;r++) {
                    if (isNaN(parseInt(itemCounts[r])))
                        embedDesc += `${rarities[r].padEnd(2)} |    | ${itemNames[r]}\n`
                    else {
                        embedDesc += `${rarities[r].padEnd(2)} | ${itemCounts[r].padEnd(3)}| ${itemNames[r]}\n`
                    }
                }

                await i.update({ })
                await i.user.send({ embeds: [new EmbedBuilder().setTitle(`[ ${relicName} ]`).setDescription(codeBlock('ml', embedDesc)).setTimestamp()] })
                    .catch((error) => { return; })
        }
    },
}