const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
    name: "timers",
    data: new SlashCommandBuilder()
        .setName("timers")
        .setDescription("Get when the next reset happens for AETools"),
    async execute(client, i) {
        const fissureReset = client.fissureLast / 1000 | 0
        const updateReset = client.updateLast / 1000 | 0
        const resetsDone = client.intrv_count

        const timerEmbed = new EmbedBuilder()
        .setTitle(`Last timing resets`)
        .addFields(
            { name: `Fissures/Box`, value: `<t:${fissureReset}:R>`, inline: true },
            { name: `Database`, value: `<t:${updateReset}:R>`, inline: true },
            { name: `Resets Count`, value: `${resetsDone} times`, inline: true },
        )
        .setDescription(`Fissures/Box info resets every **3 minutes**\nDatabase resets every **5 minutes**`)
        .setTimestamp();

        await i.reply({ embeds: [timerEmbed] });
    },
};
