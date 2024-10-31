const {
    EmbedBuilder,
    SlashCommandBuilder,
    Client,
    CommandInteraction,
    ButtonStyle,
} = require("discord.js");
const { default: mongoose } = require("mongoose");
const { Pagination } = require("pagination.djs");
const vcmodel = require("../data/vcmodel");

const roundOff = num => Math.round(num * 100) / 100;
function formatDuration(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return [
        days ? `${roundOff(days)}d` : '',
        hours ? `${roundOff(hours)}h` : '',
        minutes ? `${roundOff(minutes)}m` : '',
        secs ? `${roundOff(secs)}s` : ''
    ].filter(Boolean).join(' ');
}

module.exports = {
    name: "vcleaderboard",
    disabled: true,
    data: new SlashCommandBuilder()
    .setName('vcleaderboard')
    .setDescription('See who has slept the longest in vc'),
    /**
     * Command to retrieve clan wise resources
     * @param {Client} client 
     * @param {CommandInteraction} i 
     */
    async execute(client, i) {
        await i.deferReply()

        const vcEmbed = new EmbedBuilder().setTitle(`VC Leaderboard`);
        const VCData = await mongoose.model("VoiceStateData", vcmodel).find();
        const allVCData = VCData.filter(vc => vc.superid.split('-')[0] === i.guildId);

        if (allVCData.length == 0) {
            vcEmbed.setDescription(`No data found`);
            await i.editReply({ embeds: [vcEmbed] });
            return;
        } else {
            const vcEmbedsArray = [];
            const sortedVCData = allVCData.sort((a, b) => b.totalVCTime - a.totalVCTime);
            
            for (let i = 0; i < sortedVCData.length; i+=15) {
                const textArray = []

                for (let j = i; j < i + 15 && j < sortedVCData.length; j++) {
                    const vc = sortedVCData[j];
                    const time = formatDuration(vc.totalVCTime);
                    const position = `${i + j === 0 ? "🥇" : i + j === 1 ? "🥈" : i + j === 2 ? "🥉" : `${i + j + 1}.`}`

                    textArray.push(`${position}  <@!${vc.superid.split('-')[1]}> - ${time}`);
                }
                const embedI = new EmbedBuilder(vcEmbed).setDescription(textArray.join('\n'));
                vcEmbedsArray.push(embedI);
            }

            const VCPagination = new Pagination(i, {
                firstEmoji: "⏮",
                prevEmoji: "◀️",
                nextEmoji: "▶️",
                lastEmoji: "⏭",
                idle: 60_000,
                buttonStyle: ButtonStyle.Secondary,
                loop: false,
            })

            VCPagination.setEmbeds(vcEmbedsArray, (embed, index, array) => {
                return embed.setFooter({ text: `Page ${index + 1} of ${array.length}` });
            });
            VCPagination.render();
        }
    },
};