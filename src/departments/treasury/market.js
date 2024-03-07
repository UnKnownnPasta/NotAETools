const {
    EmbedBuilder,
    SlashCommandBuilder,
    Client,
    CommandInteraction,
    codeBlock,
    ButtonStyle
} = require("discord.js");
const fs = require("node:fs");
const { createWorker } = require('tesseract.js')
const axios = require('axios')
const { Pagination } = require("pagination.djs");
const config = require('../../data/config.json')
const { titleCase } = require("../../handler/bHelper.js");

module.exports = {
    name: "market",
    data: new SlashCommandBuilder()
        .setName("market")
        .setDescription("View market prices of parts")
        .addAttachmentOption((option) => 
        option
            .setName("image")
            .setDescription("Image to parse")
            .setRequired(true)
    ),
    /**
     * View prices of parts in a image, from market
     * @param {Client} client 
     * @param {CommandInteraction} i 
     */
    async execute(client, i) {
        await i.deferReply();
        const image = i.options.getAttachment("image", true)

        const worker = await createWorker('eng', 1, { cachePath: config.tsPath });
        const { data: { text } } = await worker.recognize(image.url);
        await worker.terminate();

        let items = await JSON.parse(fs.readFileSync("../../data/market.json"))
        const itemNames = text.trim().split('\n')

        items = items.filter(item => {
            return itemNames.includes(item.item_name)
        }).map(itemf => itemf.url_name);
        items = [...new Set(items)]

        const res = []
        await items.map(async (url) => {
            res.push(axios.get(`https://api.warframe.market/v1/items/${url}/orders`))
        });

        const customCase = (txt) => {
            return titleCase(txt.replace(/_/g, ' '))
        }

        await Promise.all(res).then(async (results) => {
            const ress = results.map(x => x.data.payload.orders)

            let embedOfResults = []
            ress.map((partOrders) => {
                const buyords = partOrders.filter(x => x.order_type == "buy" && x.user.status == "ingame").sort((a, b) => b.platinum - a.platinum)
                const sellords = partOrders.filter(x => x.order_type == "sell" && x.user.status == "ingame").sort((a, b) => a.platinum - b.platinum)

                const createEmbed = (orders1, order2, title) => {
                    let orderOneText = orders1.slice(0, 9).map(order => `${`${order.user.ingame_name}:`.padEnd(25)} ${order.platinum}p (${order.quantity}x)`).join('\n')
                    let orderTwoText = order2.slice(0, 9).map(order => `${`${order.user.ingame_name}:`.padEnd(25)} ${order.platinum}p (${order.quantity}x)`).join('\n')
                    const embed = new EmbedBuilder()
                        .setTitle(title)
                        .setDescription("**>> Sell**\n" + codeBlock('ml', orderOneText) + "\n\n" + "**>> Buy**\n" + codeBlock('ml', orderTwoText));
                    return embed;
                };
                embedOfResults.push(createEmbed(sellords, buyords, `Orders | ${customCase(items[0])}`).setColor('#AFE1AF'))
                items = items.slice(1)
            })

            const pagination = new Pagination(i, {
                firstEmoji: "⏮",
                prevEmoji: "◀️",
                nextEmoji: "▶️",
                lastEmoji: "⏭",
                idle: 60000,
                buttonStyle: ButtonStyle.Secondary,
                loop: true,
            });

            pagination.setEmbeds(embedOfResults, (embed, index, array) => {
                return embed.setFooter({
                    text: `Page ${index + 1}/${array.length}`,
                });
            });
            pagination.render();

            // await i.editReply({ embeds: [...embedOfResults.flat().slice(0, 9)] })
        })
    },
};
