import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import { isRelicFF } from "../../services/utils.js";
import relicCacheManager from "../../managers/relicCacheManager.js";
import { constructEmbed } from '../../commands/message/relics.js'

async function getFissures(type) {
  if (!type) return "No type provided";

  const { F_CHANNELID, F_MESSAGEID, DISCORD_TOKEN } = process.env;
  if (!F_CHANNELID || !F_MESSAGEID || !DISCORD_TOKEN) return "Fissures not configured";

  const url = `https://discord.com/api/v10/channels/${F_CHANNELID}/messages/${F_MESSAGEID}`;
  const controller = new AbortController();
  const timeoutMs = 5000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "DiscordBot (https://github.com/UnKnownnPasta/NotAETools, 1.0.0)",
        Authorization: `Bot ${DISCORD_TOKEN}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return `Failed to fetch fissures data (${response.status})`;
    }

    const message = await response.json();
    const embeds = Array.isArray(message?.embeds) ? message.embeds : [];
    if (embeds.length === 0) return "No fissures data available";

    // Search all embeds and all fields for matching type, preserve order
    const matches = embeds.flatMap((embed) =>
      (Array.isArray(embed?.fields) ? embed.fields : [])
        .filter((field) => String(field?.name ?? "").trim().toLowerCase() === String(type).trim().toLowerCase())
        .map((field) => String(field?.value ?? "").trim())
    );

    const fissures = matches.join("\n").trim();
    return fissures || "No ideal fissures";
  } catch (error) {
    clearTimeout(timeout);
    if (error?.name === "AbortError") return "Fissures fetch timed out";
    return "Failed to fetch fissures data";
  }
}

/** @type {import('../../other/types').InteractionCommand} */
export default {
    name: "thost",
    enabled: false,
    trigger: "interaction",
    execute: async (client, i) => {
        try {
            await i.deferReply();
            const type = i.options.getString("type")
            if (type != 'Treasury') return i.editReply({ content: ('Not a valid host type') });
            const relic = i.options.getString('relic');
            if (!isRelicFF(relic ?? "")) return i.editReply({ content: ('Not a valid relic.') });
            const amount = i.options.getInteger('amount');
            if (isNaN(amount)) return i.editReply({ content: ('Invalid amount.') });
            
            const currentFissures = await getFissures(relic.split(" ")[0]);
            const relicEmbed = constructEmbed(relic);
            const runEmbed = new EmbedBuilder()
              .setTitle(`Treasury Run for ${amount}x ${relic}`)
              .setDescription(`<@${i.member.id}>`)
              .addFields(
                { name: "Fissures", value: currentFissures },
                { name: relicEmbed.data.title, value: relicEmbed.data.description }
              )
              .setColor("#b6a57f")
              .setTimestamp();

            const joinButton = new ButtonBuilder()
              .setCustomId(`thost-join`)
              .setLabel('✔')
              .setStyle(ButtonStyle.Success);
            const leaveButton = new ButtonBuilder()
              .setCustomId(`thost-leave`)
              .setLabel('❌')
              .setStyle(ButtonStyle.Danger)
            const bntRow = new ActionRowBuilder().addComponents(joinButton, leaveButton);

            i.editReply({ embeds: [runEmbed], components: [bntRow] });
        } catch (error) {
            console.log('Error in thost command:', error);
            await i.editReply({ content: ('An error occurred while creating the run') });
        }
    },
    autocomplete: async (i) => {
        const lowerStartsWith = (a, b) => a.toLowerCase().includes(b.toLowerCase())
        const focused = i.options.getFocused() ?? "";
        const filtered = relicCacheManager.relicCache.relics
          .filter(item => lowerStartsWith(item.name, focused))
          .map(item => item.name)
          .slice(0, 25);
        await i.respond(
          filtered.map(choice => ({ name: choice, value: choice })),
        );
    },
    data: new SlashCommandBuilder()
        .setName("thost")
        .setDescription("Host a treasury run.")
        .addStringOption(option =>
          option
          .setName('type')
          .setDescription('Which type of run it is')
          .setChoices([
            {
              name: 'Treasury', value: 'Treasury'
            }
          ])
          .setRequired(true)
        )
        .addStringOption(option => 
          option
          .setName('relic')
          .setDescription('Which relic to host')
          .setAutocomplete(true)
          .setRequired(true)
        )
        .addIntegerOption(option => 
          option
          .setName('amount')
          .setDescription('Amount of relics being hosted, min 6 in multiples of 3')
          .addChoices(
            Array
            .from({ length: 7 }, (_, i) => (i + 2) * 3)
            .map(e => ({ name: `${e}`, value: e}))
          )
          .setRequired(true)
        )
}; 