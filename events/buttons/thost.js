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
                    const userData = (await JSON.parse(fs.readFileSync('./data/clandata.json'))).treasuryids
                    let usersInviteDesc = ""
                    setOfUsers.forEach(userj => {
                        var index = userData.findIndex(n => n.id == userj)
                        if (index === -1) usersInviteDesc +=  `<@${userj}> - No IGN known\n`
                        else usersInviteDesc +=  `<@${userj}> - /inv ${userData[index].name}\n`
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
                const relicName = relic.split('x ')[1].slice(0, -1)
                let jsfile = (await JSON.parse(await fs.readFileSync('./data/relicdata.json', 'utf-8'))).relicData
                const relicInfo = jsfile.filter(x => x[0].name == relicName)[0]
                const rarities = ['C', 'C', 'C', 'UC', 'UC', 'RA']
                                
                let embedDesc = ""
                for (let r=1; r < 7; r++) {
                    if (relicInfo[r].count == '')
                        embedDesc += `${rarities[r-1].padEnd(2)} |    | Forma\n`
                    else {
                        embedDesc += `${rarities[r-1].padEnd(2)} | ${relicInfo[r].count.padEnd(3)}| ${relicInfo[r].name} {${relicInfo[r].type}}\n`
                    }
                }

                await i.update({ })
                await i.user.send({ embeds: [new EmbedBuilder().setTitle(`[ ${relicName} ]`).setDescription(codeBlock('ml', embedDesc)).setTimestamp()] })
                    .catch((error) => { return; })
        }
    },
}