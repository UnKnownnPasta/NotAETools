import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import { titleCase } from "../../services/utils.js";
import { resourceNames } from "../../data/constants.js";

/** @type {import('../../other/types').InteractionCommand} */
export default {
	name: "fhost",
	enabled: true,
	trigger: "interaction",
	execute: async (client, i) => {
		const mission = i.options.getString("mission", true).toLowerCase(),
			resource = titleCase(i.options.getString("resource", true)),
			frame = titleCase(i.options.getString("frame", true)),
			mstype = titleCase(i.options.getString("missiontype", true)),
			dura = i.options.getInteger("duration", false) ?? 0;
		if (!resourceNames.includes(resource))
			return i.reply({
				content: `Resource selected is not a valid one, select one from the autocomplete list.`,
				flags: MessageFlags.Ephemeral,
			});

		const farmEmbed = new EmbedBuilder()
			.setTitle(
				`${titleCase(mission)} - ${titleCase(mstype)}, Farming ${titleCase(
					resource.replace("_", " ")
				)}, for ${!dura ? "20 Waves" : `${dura} mins`}\n`
			)
			.setTimestamp();

		const buildBtn = (frame, type) => {
			return new ButtonBuilder()
				.setCustomId(`fhost-${frame}`)
				.setLabel(frame)
				.setStyle(type);
		};
		const anyBtn = buildBtn("Any", ButtonStyle.Primary);
		const nekrosBtn = buildBtn("Nekros", ButtonStyle.Success);
		const nekros2Btn = buildBtn("Nekros 2", ButtonStyle.Success);
		const khoraBtn = buildBtn("Khora", ButtonStyle.Success);
		const novaBtn = buildBtn("Nova", ButtonStyle.Success);
		const wispBtn = buildBtn("Wisp", ButtonStyle.Success);
		const cancelBtn = buildBtn("❌", ButtonStyle.Danger);
		const confirmBtn = buildBtn("✅", ButtonStyle.Success);

		const possFrames = [
			nekrosBtn,
			khoraBtn,
			wispBtn,
			novaBtn,
			nekros2Btn,
			anyBtn,
		];
		possFrames.forEach((fm) => {
			if (
				fm.data.custom_id == `fhost-${frame}` &&
				fm.data.custom_id != "fhost-Any"
			)
				fm.setDisabled(true);
			if (fm.data.custom_id !== "fhost-❌" && fm.data.custom_id !== "fhost-✅")
				farmEmbed.addFields({
					name: `${fm.data.label}`,
					value: `${
						fm.data.custom_id == `fhost-${frame}` ? `<@${i.user.id}>` : "None"
					}`,
					inline: true,
				});
		});

		const framesButtons = new ActionRowBuilder().addComponents(
			nekrosBtn,
			khoraBtn,
			nekros2Btn,
			novaBtn,
			wispBtn
		);
		const optionBtn = new ActionRowBuilder().addComponents(
			anyBtn,
			cancelBtn,
			confirmBtn
		);

		i.reply({
			content: `<@${i.user.id}>`,
			embeds: [farmEmbed],
			components: [framesButtons, optionBtn],
		});
	},
	async autocomplete(i) {
		const focusedValue = i.options.getFocused().toLowerCase();
		const choices = [...resourceNames.map((x) => x.toLowerCase())];
		const filtered = choices
			.filter((choice) => choice.startsWith(focusedValue))
			.slice(0, 25);
		await i.respond(
			filtered.map((choice) => ({
				name: titleCase(choice),
				value: titleCase(choice),
			}))
		);
	},
	data: new SlashCommandBuilder()
		.setName("fhost")
		.setDescription("Hosts a farmers run")
		.addStringOption((option) =>
			option
				.setName("mission")
				.setDescription("Name of mission being run")
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName("resource")
				.setDescription("Resource being farmed (has autocomplete)")
				.setAutocomplete(true)
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName("frame")
				.setDescription("Frame being used by host")
				.setRequired(true)
				.addChoices(
					{ name: "Khora", value: "Khora" },
					{ name: "Nekros", value: "Nekros" },
					{ name: "Nova", value: "Nova" },
					{ name: "Wisp", value: "Wisp" },
					{ name: "Any", value: "Any" }
				)
		)
		.addStringOption((option) =>
			option
				.setName("missiontype")
				.setDescription("The type of mission being farmed")
				.setRequired(true)
				.addChoices(
					{ name: "Survival", value: "Survival" },
					{ name: "Defense", value: "Defense" },
					{ name: "Excavation", value: "Excavation" }
				)
		)
		.addIntegerOption((option) =>
			option
				.setName("duration")
				.setDescription(
					"Duration of farm in minutes, eg. 180, leave blank to count as 20 waves"
				)
				.setRequired(false)
		),
};
