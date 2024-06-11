import { Client, CommandInteraction, SlashCommandBuilder } from "discord.js";
import db from "../../handlers/db.js";
import { filterRelic, titleCase } from "../../utils/generic.js";

export default {
    NAME: 'relic',
    /**
     * Relic viewing handling
     * @param {Client} client 
     * @param {CommandInteraction} i 
     */
    async execute(client, i) {
        
    },
    async autocomplete(client, i) {
        const focusedValue = i.options.getFocused(true)
        const filtered = filterRelic(focusedValue.value) || titleCase(focusedValue.value)
        await db.mongoClient.db('treasury').collection('relics').find({ name: new RegExp(`${filtered}.*`, 'i') }).toArray().then(async (res) => {
            await i.respond(res.slice(0, 25).map(choice => ({ name: choice.name, value: choice.name })))
        })
    },
    SLASH: new SlashCommandBuilder()
    .setName('relic')
    .setDescription('View a void relic and its contents')
    .addStringOption((option) =>
        option
            .setName('name')
            .setDescription('Name of relic to view')
            .setRequired(true)
            .setAutocomplete(true)
    )
    .addBooleanOption((option) =>
        option
            .setName('boxupdated')
            .setDescription('Whether to update stock counts from collection box or not')
            .setRequired(false)
    ),
}
