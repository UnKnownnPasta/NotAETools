const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
    name: "timers",
    data: new SlashCommandBuilder()
        .setName("timers")
        .setDescription("Get when the next reset happens for AETools"),
    async execute(client, i) {
        const fissureReset = client.fissureLast / 1000 | 0
        const resetsDone = client.intrv_count

        const timerEmbed = new EmbedBuilder()
        .setTitle(`Last timing resets`)
        .addFields(
            { name: `Fissures`, value: `<t:${fissureReset}:R>`, inline: true },
            { name: `Reset Count`, value: `${resetsDone} times`, inline: true },
            { name: `Database`, value: `Around 3-5 mins after tracker updates`, inline: false },
        )
        .setDescription(`Fissures resets every **3 minutes**\nDatabase rechecked every **5 minutes**`)
        .setTimestamp();

        await i.reply({ embeds: [timerEmbed], ephemeral: true });
    },
};
