import { ButtonStyle, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { Pagination } from 'pagination.djs';
import { titleCase } from '../../services/utils.js';
import { getAllLeaderboardData } from '../../services/googleSheets.js';

const lbOptions = [
  { name: "all", value: "all" },
  { name: "merch", value: "merch" },
  { name: "rad", value: "rad" },
  { name: "run", value: "run" }
]

/** @type {import('../../other/types').Command} */
export default {
  name: "tleaderboard",
  enabled: false,
  trigger: "interaction",
  execute: async (client, i) => {
    await i.deferReply()
    const fetchData = await getAllLeaderboardData();
    if (!fetchData.length) return i.editReply('Leaderboard is empty!');
    const embArr = []
    const curSub = i.options.getString('sector', true);
    const sortedData = fetchData.sort((a, b) => b[curSub] - a[curSub])

    const nameFull = { run: "Most Relics Run", rad: "Most Relics Radded", merch: "Most Relics Merched", all: "Total Relics Used" }
    const text = titleCase(nameFull[curSub])
    const baseEmbed = new EmbedBuilder().setTitle(`${text} Leaderboard`).setColor('#4169E1')
    const baseDescText = `**Your rank: ${sortedData.findIndex(v => v.uid === i.user.id) + 1}**\n---------------------------`

    for (let x = 0; x < sortedData.length; x += 15) {
        const textOfShi = [baseDescText]

        textOfShi.push(...sortedData.slice(x, x+15).map((y, m) => {
            const idx = x + m + 1
            const medal = idx <= 3 ? ['🥇', '🥈', '🥉'][idx - 1] : ''
            const pointer = y.uid === i.user.id ? '>> ' : ''
            return `${pointer}${medal || `${idx}.`} <@!${y.uid}> - ${y[curSub]}`
        }))

        embArr.push(
            new EmbedBuilder(baseEmbed)
            .setDescription(textOfShi.join('\n'))
        )
    }

    const lbPagination = new Pagination(i, {
        firstEmoji: "⏮",
        prevEmoji: "◀️",
        nextEmoji: "▶️",
        lastEmoji: "⏭",
        idle: 240_000,
        buttonStyle: ButtonStyle.Secondary,
        loop: true,
    });

    lbPagination.setEmbeds(embArr, (embed, index, array) => {
        return embed.setFooter({
            text: `Page ${index + 1}/${array.length}  `,
        });
    });
    lbPagination.editReply();
  },
  data: new SlashCommandBuilder()
  .setName("tleaderboard")
  .setDescription("See treasury runs leaderboard")
  .addStringOption(option =>
    option
      .setName("sector")
      .setDescription("Which sector to see")
      .setRequired(true)
      .addChoices(...lbOptions)
  )
}