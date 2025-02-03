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

function getFissureTimings(fisTimes) {
    const currentTime = Math.floor(new Date().getTime() / 1000);

    const tierMap = new Map();

    fisTimes.forEach(([tier, expiryTime]) => {
        const farthestTime = tierMap.get(tier);
        
        if ((!farthestTime) || Math.abs(expiryTime - currentTime) > Math.abs(farthestTime - currentTime)) {
            tierMap.set(tier, expiryTime);
        }
    });

    const updatedTierMap = new Map();

    tierMap.forEach((farthestTime, tier) => {
        const farthestExpiryTime = farthestTime - 3 * 60;
        const farthestElement = fisTimes.find(([currentTier, expiryTime]) => {
            return currentTier === tier && Math.abs(expiryTime - farthestExpiryTime) <= 180 && expiryTime - currentTime > 0;
        });

        if (farthestElement) {
            updatedTierMap.set(tier, farthestExpiryTime);
        }
    });

    return updatedTierMap;
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

    /** (1.3) Create a embed to show when the next reset happens  */
    const emojiObj = { 
        "Lith": "<:LithRelicIntact:1287249967475458078>", 
        "Meso": "<:MesoRelicIntact:1287250081380044801>", 
        "Neo": "<:NeoRelicIntact:1287250258765545502>", 
        "Axi": "<:AxiRelicIntact:1287250368299925524>" 
    }
    let timeArrOfObj = [];
    const fisTimes = getFissureTimings(
        fissureArray
            .filter(({ tier, isStorm, expired, active }) => tiers.includes(tier) && !isStorm && !expired && active)
            .map(({ isHard, tier, expiry }) => [
                isHard + " " + tier, (new Date(expiry).getTime() / 1000) | 0
            ])
    );

    Array.from(fisTimes.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .forEach(([key, val]) => {
        timeArrOfObj.push({ era: key, time: `<t:${val}:R>` })
    });
    
    const allTimeObjs = Object.entries(timeArrOfObj.reduce((acc, { era, time }) => {
        const [ status, erra ] = era.split(' ')
        let currentEmbed = acc[`${erra}time`];

        if (!currentEmbed.norm && status == 'false') currentEmbed.norm = time;
        else if (!currentEmbed.sp && status == 'true') currentEmbed.sp = time;

        return acc;
    }, {
        Lithtime: { norm: undefined, sp: undefined },
        Mesotime: { norm: undefined, sp: undefined },
        Neotime: { norm: undefined, sp: undefined },
        Axitime: { norm: undefined, sp: undefined },
    }));

    const timeObjSort = (embed, type) => embed
        .sort((a, b) => tiers.indexOf(a[0].replace('time', '')) - tiers.indexOf(b[0].replace('time', '')))
        .map(c => `${emojiObj[c[0].replace('time', '')]} ${c[1][type] ?? 'Awaiting reset'}`)

    const NextFissuresEmbed = new EmbedBuilder()
    .setColor("#b6a57f")
    .addFields(
        { name: "Regular", value: timeObjSort(allTimeObjs, 'norm').join("\n"), inline: true },
        { name: "Steel Path", value: timeObjSort(allTimeObjs, 'sp').join("\n"), inline: true }
    )
    .setFooter({ text: "Next Fissure Reset Timers / by era" })

    /** UPDATE FISSURE MESSAGE WITH CREATED EMBEDS */
    await fissureMessage.edit({ content: null, embeds: [NormEmbed, SPEmbed, NextFissuresEmbed] });
}