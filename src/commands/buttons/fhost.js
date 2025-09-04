import { ActionRowBuilder, EmbedBuilder, MessageFlags } from "discord.js";

/** @type {import('../../other/types').InteractionCommand} */
export default {
	name: "fhost",
	enabled: false,
	trigger: "button",
	execute: async (client, i) => {
		const hostEmbed = i.message.embeds[0];
		let globalHostEmbed = new EmbedBuilder();
		const hostTitle = hostEmbed.title;
		globalHostEmbed.setTitle(hostTitle);

		let hostFields = hostEmbed.fields.map((fld) => {
			return [
				fld.name,
				fld.value
					.split(", ")
					.map((x) => x.slice(2, -1))
					.join("|"),
			];
		});
		let hostComps = i.message.components.map((x) => x.components).flat();
		const allIDs = hostFields.map((x) => x[1].split("|")).flat();
		let minimumFill = 4;
		let doFilterCheck = true;

		if (
			i.customId === "fhost-✅" &&
			i.message.content.slice(2, -1) == i.user.id
		) {
			const filterCheck = allIDs.filter((x) => x != "n");
			if (filterCheck.length <= 1) {
				return i.reply({
					content: `Squad needs atleast 2 members.`,
					flags: MessageFlags.Ephemeral
				});
			} else {
				minimumFill = filterCheck.length;
				doFilterCheck = false;
			}
		}

		if (doFilterCheck && allIDs.includes(i.user.id) && i.customId != "fhost-❌")
			return i.update({});

		const newRow = (arr) => new ActionRowBuilder().addComponents(arr);

		if (
			doFilterCheck &&
			i.customId == "fhost-❌" &&
			allIDs.includes(i.user.id) &&
			i.message.content.slice(2, -1) != i.user.id
		) {
			const joinedField = hostFields.findIndex((x) =>
				x[1].split("|").includes(i.user.id)
			);
			const joinedButton = hostComps.findIndex(
				(x) => x.customId == `fhost-${hostFields[joinedField][0]}`
			);
			if (hostComps[joinedButton].customId != "fhost-Any") {
				hostComps[joinedButton].data.disabled =
					!hostComps[joinedButton].disabled;
			}
			hostFields[joinedField][1] = hostFields[joinedField][1]
				.split("|")
				.filter((x) => x != i.user.id)
				.join("|");

			hostFields = hostFields.map((x) => [
				x[0],
				x[1]
					.split("|")
					.map((y) => (y == "n" || !y ? "None" : `<@${y}>`))
					.join(", "),
			]);
			globalHostEmbed
				.addFields(
					...hostFields.map((x) => {
						return { name: x[0], value: x[1], inline: true };
					})
				)
				.setTimestamp();
			allIDs[joinedButton] = "n";
			await i.update({
				content: i.message.content,
				embeds: [globalHostEmbed],
				components: [newRow(hostComps.slice(0, 4)), newRow(hostComps.slice(4))],
			});
		} else if (
			doFilterCheck &&
			i.customId == "fhost-❌" &&
			allIDs.includes(i.user.id) &&
			i.message.content.slice(2, -1) == i.user.id
		) {
			await i.message.delete().catch(console.log);
			await i.channel.send({
				embeds: [
					new EmbedBuilder().setTitle(`Run "${hostTitle}" was cancelled`),
				],
			});
		} else {
			if (doFilterCheck) {
				const getField = hostFields.findIndex(
					(x) => x[0] == i.customId.split("-")[1]
				);
				if (getField === -1) return i.update({});
				if (hostFields[getField][1] != "n" && i.customId != "fhost-Any")
					return await i.update({});
				let currentField = [...hostFields[getField][1].split("|")].filter(
					(x) => x != "n"
				);
				currentField.push(i.user.id);
				hostFields[getField][1] = currentField.join("|");

				const clickedButton = hostComps.findIndex(
					(x) => x.customId == `fhost-${hostFields[getField][0]}`
				);
				if (hostComps[clickedButton].customId !== `fhost-Any`) {
					hostComps[clickedButton].data.disabled =
						!hostComps[clickedButton].disabled;
				}

				hostFields = hostFields.map((x) => [
					x[0],
					x[1]
						.split("|")
						.map((y) => (y == "n" || !y ? "None" : `<@${y}>`))
						.join(", "),
				]);
				globalHostEmbed
					.addFields(
						...hostFields.map((x) => {
							return { name: x[0], value: x[1], inline: true };
						})
					)
					.setTimestamp();
				allIDs.push(i.user.id);
			} else {
				globalHostEmbed = i.message.embeds[0];
			}
			await i.update({
				content: i.message.content,
				embeds: [globalHostEmbed],
				components: [newRow(hostComps.slice(0, 4)), newRow(hostComps.slice(4))],
			});
		}

		if (allIDs.filter((x) => x != "n").length >= minimumFill) {
			const IDList = allIDs
				.filter((x) => x != "n")
				.slice(0, 4)
        .map((x) => `<@${x}>`);

      await i.message.delete();
			await i.channel.send({
				content: `${IDList.join(", ")}`,
				embeds: [globalHostEmbed],
				allowedMentions: { repliedUser: true, parse: ["users"] },
			});
		}
	},
};
