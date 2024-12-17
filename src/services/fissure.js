import axios from 'axios'
import jsonExports from '../other/botConfig.json' with { type: 'json' };
import { EmbedBuilder } from 'discord.js';
import { titleCase } from './utils.js';

const { emojis, hex_codes } = jsonExports;

async function getWarframeData() {
    const response = await axios.get('https://api.warframestat.us/pc/fissures')
    return response.data
}

async function fetchChannel(client) {
    const channel = client.channels.cache.get(process.env.FISSURE_CHANNEL_ID);
    if (!channel) return console.warn('No fissure channel found, Is the channel ID wrong?')
    
    let messageToEdit = await channel.messages.fetch({ limit: 1 });
    if (
        messageToEdit.size == 0 ||
        messageToEdit?.first()?.author.id != client.user.id
    ) {
        messageToEdit = await channel.send({ content: "Updating fissures..." });
    } else {
        messageToEdit = messageToEdit.first();
    }

    return messageToEdit;
}

export async function getFissures(client) {
    const fissureData = await getWarframeData();
    const fissureMessage = await fetchChannel(client);
    
    const missions = ["Extermination", "Capture", "Sabotage", "Rescue"];
    const tiers = ["Lith", "Meso", "Neo", "Axi"]

    /** CREATE EMBED FOR NORMAL AND SP FISSURES */
    const fissureArray = fissureData.filter(({ tier, missionType, active, expired, isStorm }) =>
        !isStorm && missions.includes(missionType) && active && tiers.includes(tier) && !expired
    );

    const fissures = await fissureArray.map(({ tier, missionType, node, expiry, isHard }) => [
        titleCase(tier),
        `${missionType} - ${node} - Ends <t:${(new Date(expiry).getTime() / 1000) | 0}:R>\n`,
        isHard,
    ]);

    /** (1.1) Reduce fissures into embeds */
    const [N_Embed, S_Embed] = Object.entries(fissures.reduce((acc, fissure) => {
        let currentEmbed = fissure[2] ? acc.S_Embed : acc.N_Embed;

        currentEmbed[fissure[0]]
        ? (currentEmbed[fissure[0]].value += fissure[1])
        : (currentEmbed[fissure[0]] = { name: fissure[0], value: fissure[1] });

        return acc;
        }, { N_Embed: {}, S_Embed: {} }
    ));

    /** (1.2) Create sorted embeds for normal and SP fissures */
    const embedSort = (embed) => Object.values(embed[1]).sort((a, b) => tiers.indexOf(a.name) - tiers.indexOf(b.name))

    const NormEmbed = new EmbedBuilder()
        .setAuthor({ name: "Regular Fissures", iconURL: `https://cdn.discordapp.com/emojis/${emojis.type__normal}.png` })
        .setColor(hex_codes.embed__invis)
        .setFields(embedSort(N_Embed));

    const SPEmbed = new EmbedBuilder()
        .setAuthor({ name: "Steel Path Fissures", iconURL: `https://cdn.discordapp.com/emojis/${emojis.type__steelpath}.png` })
        .setFields(embedSort(S_Embed))
        .setColor(hex_codes.embed__invis)
        .setTimestamp();

    if (NormEmbed.data.fields.length == 0) NormEmbed.setDescription(`No ideal fissures`);
    if (SPEmbed.data.fields.length == 0) SPEmbed.setDescription(`No ideal fissures`);

    /** UPDATE FISSURE MESSAGE WITH CREATED EMBEDS */
    await fissureMessage.edit({ content: null, embeds: [NormEmbed, SPEmbed] });
}