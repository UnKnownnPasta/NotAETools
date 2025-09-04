import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags } from 'discord.js'

/** @type {import('../../other/types').Command} */
export default {
  name: 'thost',
  trigger: 'button',
  enabled: false,
  execute: async (client, i) => {
    const msgEmbed = i.message.embeds;
    let participants = msgEmbed[0].description.split("\n").map(i => i.match(/\d+/g)?.[0]).filter(Boolean)
    const buttonType = i.customId.split('-')[1]

    if (buttonType == 'join') {
      if (participants.includes(i.member.id)) 
        return i.reply({ content: "Already in the run.", flags: MessageFlags.Ephemeral });
      if (participants.length >= 4)
        return i.reply({ content: "Run is full.", flags: MessageFlags.Ephemeral });

      participants.push(i.member.id);
      await i.message.edit({
        embeds: [
          new EmbedBuilder(msgEmbed[0])
            .setDescription(participants.map(i => `<@${i}>`).join("\n"))
        ]
      })
      await i.reply({ content: `Joined the run.`, flags: MessageFlags.Ephemeral });

      if (participants.length == 4) {
        await i.message.delete();
        
        const completeBtn = new ButtonBuilder()
          .setCustomId('thost-complete')
          .setLabel('Complete Run')
          .setStyle(ButtonStyle.Success);
        const cancelBtn = new ButtonBuilder()
          .setCustomId('thost-cancel')
          .setLabel('Cancel Run')
          .setStyle(ButtonStyle.Danger);
        const btnrow = new ActionRowBuilder().addComponents(completeBtn, cancelBtn);

        await i.channel.send({
          content: participants.map(i => `<@${i}>`).join(" "),
          embeds: [
            new EmbedBuilder(msgEmbed[0])
              .setDescription(participants.map(i => `<@${i}>`).join("\n"))
          ],
          components: [btnrow],
          allowedMentions: { repliedUser: true, parse: ["users"] },
        })
      }
    } else if (buttonType == "leave") {
      if (participants[0] == i.member.id) {
        await i.message.delete();
        await i.channel.send({ content: `${msgEmbed[0].title} was cancelled.` });
        return i.reply({ content: 'Cancelled run.', flags: MessageFlags.Ephemeral });
      }
      if (!participants.includes(i.member.id)) 
        return i.reply({ content: "You are not in the run.", flags: MessageFlags.Ephemeral });

      participants = participants.filter(m => m != i.member.id);
      await i.message.edit({
        embeds: [
          new EmbedBuilder(msgEmbed[0])
            .setDescription(participants.map(i => `<@${i}>`).join("\n"))
        ]
      })
      await i.reply({ content: `Left the run.`, flags: MessageFlags.Ephemeral });
    } else if (buttonType == "complete") {
      if (participants[0] != i.member.id) {
        return i.reply({ content: 'You are not the host of the run.', flags: MessageFlags.Ephemeral });
      }

      const restartBtn = new ButtonBuilder()
        .setCustomId('thost-restart')
        .setLabel('Re-activate')
        .setStyle(ButtonStyle.Success)
      const btRow = new ActionRowBuilder().addComponents(restartBtn)

      await i.message.edit({
        embeds: [
          new EmbedBuilder(msgEmbed[0])
            .setTitle(`Completed ${msgEmbed[0].title}`)
            .setDescription(participants.map(i => `<@${i}>`).join("\n"))
        ],
        components: [btRow]
      })
      return i.reply({ content: 'Run marked as complete.', flags: MessageFlags.Ephemeral });
    } else if (buttonType == "cancel") {
      if (participants[0] != i.member.id) {
        return i.reply({ content: 'You are not the host of the run.', flags: MessageFlags.Ephemeral });
      }

      await i.message.delete();
      await i.channel.send({ content: `${msgEmbed[0].title} was cancelled.` });
      return i.reply({ content: 'Run cancelled.', flags: MessageFlags.Ephemeral });
    } else if (buttonType == "restart") {
      if (participants[0] != i.member.id) {
        return i.reply({ content: 'You are not the host of the run.', flags: MessageFlags.Ephemeral });
      }

      const completeBtn = new ButtonBuilder()
        .setCustomId('thost-complete')
        .setLabel('Complete Run')
        .setStyle(ButtonStyle.Success);
      const cancelBtn = new ButtonBuilder()
        .setCustomId('thost-cancel')
        .setLabel('Cancel Run')
        .setStyle(ButtonStyle.Danger);
      const btnrow = new ActionRowBuilder().addComponents(completeBtn, cancelBtn);

      await i.message.edit({
        embeds: [
          new EmbedBuilder(msgEmbed[0])
            .setTitle(msgEmbed[0].title.replace('Completed ', ''))
            .setDescription(participants.map(i => `<@${i}>`).join("\n"))
        ],
        components: [btnrow]
      })
      return i.reply({ content: 'Run re-activated.', flags: MessageFlags.Ephemeral });
    }
  }
}