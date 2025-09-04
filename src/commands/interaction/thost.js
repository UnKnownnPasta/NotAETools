import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import { isRelicFF } from "../../services/utils.js";
import relicCacheManager from "../../managers/relicCacheManager.js";
import { constructEmbed } from '../../commands/message/relics.js'

async function getFissures(type) {
  if (!type) return "null";
  const url = `https://discord.com/api/v10/channels/${process.env.F_CHANNELID}/messages/${process.env.F_MESSAGEID}`;
  const response = await fetch(url, {
      method: "GET",
      headers: {
          "User-Agent": "DiscordBot (https://github.com/UnKnownnPasta/NotAETools, 1.0.0)",
          Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
      },
  });

  if (!response.ok) {
      return 'Failed to fetch fissures data';
  }

  const message = await response.json();

  if (!message.embeds || message.embeds.length === 0) {
      return 'No fissures data available';
  }

  let fissures = message.embeds
      .slice(0, 2)
      .map(embed => embed.fields)
      .map(embeds => 
        embeds
        .filter(field => field.name === type)
        .map(field => `${field.value}`)
        .join("\n")
      )
      .join("\n")
      .trim();

  return fissures || "No ideal fissures";
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