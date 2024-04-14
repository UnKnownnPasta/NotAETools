const { default: axios } = require("axios");
const {
    EmbedBuilder,
    SlashCommandBuilder,
    Client,
    CommandInteraction,
} = require("discord.js");
const fs = require("node:fs/promises");
const path = require("node:path");
const { loadFiles } = require("../scripts/utility");

module.exports = {
    name: "redep",
    data: new SlashCommandBuilder()
        .setName("redep")
        .setDescription("a")//Redeploys command files which actively are used for AETools functioning
        .addStringOption((option) => option.setName("path").setDescription("File path (rel)").setRequired(true))
        .addAttachmentOption((option) => option
            .setName("file")
            .setDescription("File to upload")
            .setRequired(true)
        ),
    /**
     * 
     * @param {Client} client 
     * @param {CommandInteraction} i 
     */
    async execute(client, i) {
        if (i.user.id !== "740536348166848582") return;

        const filename = i.options.getString("path", true);
        const file = i.options.getAttachment("file", true).toJSON();

        if (!file.contentType.includes("text/plain")) return;

        await axios.get(file.url).then(async (res) => {
            const filecontents = res.data
            const fpath = path.resolve(__dirname, "..", filename.endsWith(".js") ? filename : filename + ".js")
            

                await fs.access(fpath, fs.constants.F_OK);
                delete require.cache[require.resolve(fpath)];
                await fs.writeFile(fpath, filecontents);
                require('../scripts/deploy.js');

                const eventsPath = path.join(__dirname, '..', 'events/listeners');
                const eventFiles = (await fs.readdir(eventsPath)).filter(file => file.endsWith('.js'));
                
                eventFiles.forEach(file => {
                    const event = require(path.join(eventsPath, file));
                    client.removeAllListeners(event.name);
                    delete require.cache[require.resolve(path.join(eventsPath, file))];
                });
                
                eventFiles.forEach(file => {
                    const event = require(path.join(eventsPath, file));
                    const callback = (...args) => event.listen(client, ...args);
                    client[event.once ? 'once' : 'on'](event.name, callback);
                });

                [client.treasury, client.farmers, client.buttons] = await Promise.all([
                    loadFiles('treasury'),
                    loadFiles('farmers'),
                    loadFiles('events/buttons')
                ]);
                await i.reply({ content: 'Completed refresh!' });
        })
    },
};
