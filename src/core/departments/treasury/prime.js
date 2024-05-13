const { SlashCommandBuilder, AutocompleteInteraction, Client, CommandInteraction, EmbedBuilder, codeBlock, ButtonStyle } = require('discord.js')
const { Pagination } = require('pagination.djs')
const database = require('../../../database/init.js')
const { dualitemslist } = require('../../../configs/commondata.json')
const { codeObj, uncodeObj, hex, range, rarities } = require('../../../utils/generic.js')
const { QueryTypes } = require('sequelize')

module.exports = {
    name: 'prime',
    type: 'slash',
    data: new SlashCommandBuilder()
        .setName('prime')
        .setDescription('Get the stock/relics of a prime part/set')
        .addStringOption((option) => 
            option
                .setName('name')
                .setDescription('Name of the prime weapon/frame/companion to see')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addStringOption((option) =>
            option
                .setName('part')
                .setDescription('What part of the set')
                .setRequired(false)
                .setAutocomplete(true)
        )
        .addBooleanOption((option) =>
            option
                .setName('boxupdated')
                .setDescription('Whether to update stock counts from collection box or not')
                .setRequired(false)
        ),
    /**
     * Command to check stock of prime things
     * @param {Client} client 
     * @param {CommandInteraction} i 
     */
    async execute (client, i) {
        const setName = i.options.getString('name', true)
        const setPart = i.options.getString('part', false) ?? false
        const boxupdated = i.options.getBoolean('boxupdated', false) ?? false

        await i.deferReply();

        const relicData = await database.models.Relics.findAll();
        const collection_box = await require('../../managers/boxFetch.js')(client);

        if (!setPart) {
            const allParts = await database.sequelize.query(`SELECT * FROM primeParts WHERE name LIKE :check_name`, {
                replacements: { check_name: `${setName} %` },
                type: QueryTypes.SELECT
            })
            if (!allParts.length) return i.editReply({ content: `failed: ${allParts.toString()}` });
            const allPartStrings = allParts.map(part => {
                return `${`${boxupdated ? `${part.stock}(+${collection_box[part.name.replace(" x2", "")] ?? 0})`.padEnd(7) : part.stock.padEnd(3)}`}│ ${part.name.replace("Blueprint", "BP")} {${part.color}}`
            })

            const setStock = Math.min(...allParts.map(y => parseInt(y.stock) + (boxupdated ? collection_box[y.name.replace(" x2", "")] ?? 0 : 0)))

            const primeEmbed = new EmbedBuilder()
                .setTitle(`[ ${setName} Prime ]`)
                .setDescription(codeBlock('ml', allPartStrings.join("\n")))
                .setColor(hex[range(setStock)])
                .setFooter({ text: `${boxupdated ? "Updated from box" : "Stock from tracker"}  •  ${setStock}x of set in stock  •  ${range(setStock)} Set` })
                .setTimestamp();

            await i.editReply({ embeds: [primeEmbed] })
        } else {
            const findPart = await database.sequelize.query(`SELECT * FROM primeParts WHERE name LIKE :search_part`, {
                replacements: { search_part: `${setName} ${setPart}%` },
                type: QueryTypes.SELECT
            })
            if (!findPart.length) return i.editReply({ content: `failed: ${findPart.toString()}` });
            const part = findPart[0]
            const relics = relicData.filter(relic => {
                return relic.dataValues.rewards.some(rw => {
                    return rw.part === part.name.replace(" x2", "")
                })
            })
            let relicToString = await Promise.all(relics.map(async (relic) => {
                const tokens = await database.sequelize.query(`SELECT tokens FROM relicTokens WHERE relic = :relic_name`, {
                    replacements: { relic_name: relic.dataValues.relic },
                    type: QueryTypes.SELECT
                })
                const position = rarities[relic.dataValues.rewards.findIndex(r => r.part === part.name.replace(" x2", ""))]
                return `${position} │ ${`{${tokens[0].tokens}}`.padEnd(5)}│ ${relic.dataValues.relic} {${relic.dataValues.vaulted ? "V" : "UV"}}`
            }));
            relicToString = relicToString.sort((a, b) => parseInt(b.match(/\d+/)[0]) - parseInt(a.match(/\d+/)))
            
            const extraPartStock = collection_box[part.name.replace(" x2", "")] ?? 0
            const basePartEmbed = new EmbedBuilder()
                .setTitle(`[ ${part.name} ]`)
                .setColor(hex[range(parseInt(part.stock) + (boxupdated ? extraPartStock : 0))])
                .setFooter({ text: `${boxupdated ? "Updated from box" : "Stock from tracker"}  •  ${part.stock}${boxupdated ? (`(+${extraPartStock})`) : ""}x of part in stock  •  ${relicToString.length} results` });

            if (relicToString.length <= 15) {
                i.editReply({ embeds: [
                    new EmbedBuilder(basePartEmbed)
                        .setDescription(codeBlock('ml', relicToString.join("\n")))
                ] })
            } else {
                const partEmbedArray = []
                for (let i = 0; i < relicToString.length; i += 15) {
                    partEmbedArray.push(
                        new EmbedBuilder(basePartEmbed)
                            .setDescription(codeBlock('ml', relicToString.slice(i, i+15).join("\n")))
                    )
                }

                const partPagination = new Pagination(i, {
                    firstEmoji: '⏮',
                    prevEmoji: '◀️',
                    nextEmoji: '▶️',
                    lastEmoji: '⏭',
                    idle: 240_000,
                    buttonStyle: ButtonStyle.Secondary,
                    loop: true
                })
    
                partPagination.setEmbeds(partEmbedArray, (embed, index, array) => {
                    return embed.setFooter({
                        text: embed.data.footer.text + `  •  Page ${index + 1}/${array.length}`
                    })
                })
                partPagination.render()
            }
        }

    },
    /** * @param {AutocompleteInteraction} i */
    async autocomplete(i) {
        const focusedOption = i.options.getFocused(true)
        switch (focusedOption.name) {
            case 'name':
                const nameChoices = await database.sequelize.query(`SELECT * FROM onlyNames WHERE name LIKE :set_name`, {
                    replacements: { set_name: `${focusedOption.value}%` },
                    type: QueryTypes.SELECT
                })
                await i.respond(nameChoices.slice(0, 25).map(choice => ({ name: choice.name, value: choice.name })))
                break;

            case 'part':
                const setFocusedName = i.options.getString('name', true)
                const partChoices = await database.sequelize.query(`SELECT * FROM primeParts WHERE name LIKE :part_name`, {
                    replacements: { part_name: `${setFocusedName} ${focusedOption.value}%` },
                    type: QueryTypes.SELECT
                })
                await i.respond(partChoices.slice(0, 25).map(choice => ({ name: choice.name.replace(`${setFocusedName} `, ""), value: choice.name.replace(`${setFocusedName} `, "") })))
                break;
        }
    }
}
