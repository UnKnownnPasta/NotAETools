import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { getAllClanData } from '../../services/googleSheets.js';
import { titleCase } from '../../services/utils.js';
import { resourceNames } from '../../data/constants.js';

const reverseClan = {
  IK: "Imouto",
  WK: "Waifu",
  MK: "Manga",
  YK: "Yuri",
  CK: "Cassiopeia",
  TK: "Tsuki",
  HK: "Heavens",
  AK: "Andromeda"
};

const clanOptions = [
  { name: "Imouto Kingdom", value: "IK" },
  { name: "Waifu Kingdom", value: "WK" },
  { name: "Manga Kingdom", value: "MK" },
  { name: "Yuri Kingdom", value: "YK" },
  { name: "Cassiopeia Kingdom", value: "CK" },
  { name: "Tsuki Kingdom", value: "TK" },
  { name: "Heavens Kingdom", value: "HK" },
  { name: "Andromeda Kingdom", value: "AK" }
]

/** @type {import('../../other/types').Command} */
export default {
  name: "resource",
  enabled: true,
  trigger: "interaction",
  execute: async (client, i) => {
    const resrc = titleCase(i.options.getString('resource', true) ?? "")
    const clanname = titleCase(i.options.getString('clan', false) ?? "")

    if (!resourceNames.includes(resrc)) 
        return i.reply({ content: `Invalid resource, choose from autofill instead`, flags: MessageFlags.Ephemeral });
    
    await i.deferReply()
    const resources = await getAllClanData(reverseClan[clanname]);
    const clanEmbed = new EmbedBuilder()
    .setTitle(`Resource overview of ${resrc}`);

    for (const r of resources) {
        if (clanname && clanname.toUpperCase() !== r.clan) continue;
        const res = Object.entries(r.resource).filter(([ key, value ]) => key == resrc)[0]
        clanEmbed.addFields({ name: reverseClan[r.clan], value: `**Amt:** \`${res[1].amt}\` | **Short:** \`${res[1].short}\`` })
    }

    await i.editReply({ embeds: [clanEmbed] })
  },
  autocomplete: async (i) => {
		const focusedValue = i.options.getFocused().toLowerCase();
		const choices = [...resourceNames.map(x => x.toLowerCase())];
		const filtered = choices.filter(choice => choice.startsWith(focusedValue)).slice(0, 25);
		await i.respond(
			filtered.map(choice => ({ name: titleCase(choice), value: titleCase(choice) })),
		);
  },
  data: new SlashCommandBuilder()
  .setName('resource')
  .setDescription('View resources for a specific clan')
  .addStringOption((option) =>
  option
      .setName('resource')
      .setDescription('Resource to view details of')
      .setRequired(true)
      .setAutocomplete(true)
  )
  .addStringOption((option) =>
      option
          .setName('clan')
          .setDescription('Which clan to see')
          .setRequired(false)
          .addChoices(...clanOptions)
  )
}