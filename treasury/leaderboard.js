const {
    EmbedBuilder,
    SlashCommandBuilder,
    ButtonStyle,
    CommandInteraction,
} = require("discord.js");
const fs = require("node:fs/promises");
const path = require("node:path");
const { getAllUserData } = require("../scripts/dbcreate");
const { Pagination } = require("pagination.djs");
const { titleCase } = require("../scripts/utility");

module.exports = {
    name: "tleaderboard",
    data: new SlashCommandBuilder()
        .setName("tleaderboard")
        .setDescription("See treasury runs leaderboard")
        .addSubcommand(sc =>
            sc
                .setName('all')
                .setDescription('Over-all runcount, i.e. merch + rad + run')
        )
        .addSubcommand(sc =>
            sc
                .setName('merch')
                .setDescription('Merched relics leaderboard')
        )
        .addSubcommand(sc =>
            sc
                .setName('rad')
                .setDescription('Radded relics leaderboard')
        )
        .addSubcommand(sc =>
            sc
                .setName('run')
                .setDescription('Relics run leaderboard')
        ),
    /**
     * @param {CommandInteraction} i 
     */
    async execute(client, i) {
        // const fetchData = await getAllUserData('leaderboard');
        const lmao = (await fs.readFile(path.join(__dirname, '..', 'data/a.txt'))).toLocaleString()
        const fetchData = lmao.split('\n').map((d) => {
            const data = d.split(/\s+/g)
            const run = isNaN(parseInt(data[4])) ? 0 : parseInt(data[4])
            const rad = isNaN(parseInt(data[3])) ? 0 : parseInt(data[3])
            const merch = isNaN(parseInt(data[2])) ? 0 : parseInt(data[2])
            return { uid: data[1], name: data[0], all: run + rad + merch, run: run, rad: rad, merch: merch }
        })
        const embArr = []
        let sortedData;
        // await i.reply({ content: 'Loading..' });
        
        switch (i.options._subcommand) {
            case 'all':
                sortedData = fetchData.filter(x => !Array.isArray(x)).sort((a, b) => b.all - a.all)
                break;

            case 'run':
                sortedData = fetchData.filter(x => !Array.isArray(x)).sort((a, b) => b.run - a.run)
                break;

            case 'rad':
                sortedData = fetchData.filter(x => !Array.isArray(x)).sort((a, b) => b.rad - a.rad)
                break;
        
            case 'merch':
                sortedData = fetchData.filter(x => !Array.isArray(x)).sort((a, b) => b.merch - a.merch)
                break;

            default:
                break;
        }

        const text = titleCase(i.options._subcommand) === "All" ? "Count" : titleCase(i.options._subcommand)
        const baseEmbed = new EmbedBuilder().setTitle(`Highest ${text} Leaderboard`).setColor('#4169E1')
        const baseDescText = `**Your rank: ${sortedData.findIndex(v => v.uid === i.user.id) + 1}**\n---------------------------`

        for (let x = 0; x < sortedData.length; x += 15) {
            const textOfShi = [baseDescText]

            sortedData.slice(x, x+15).map((y, m) => {
                textOfShi.push(`${x + m == 0 ? '🥇 | ' : x + m == 1 ? '🥈 | ' : x + m == 2 ? '🥉 | ' : ''}<@!${y.uid}>: ${y[i.options._subcommand]}`)
            })

            embArr.push(
                new EmbedBuilder(baseEmbed)
                .setDescription(textOfShi.join('\n'))
            )
        }
        

        const statusPagination = new Pagination(i, {
            firstEmoji: "⏮",
            prevEmoji: "◀️",
            nextEmoji: "▶️",
            lastEmoji: "⏭",
            idle: 240_000,
            buttonStyle: ButtonStyle.Secondary,
            loop: true,
        });

        statusPagination.setEmbeds(embArr, (embed, index, array) => {
            return embed.setFooter({
                text: `Page ${index + 1}/${array.length}  `,
            });
        });
        statusPagination.render();
    },
};
