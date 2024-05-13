const { Events, Client, CommandInteraction, Message, ButtonInteraction } = require('discord.js')
const { EventEmitter } = require('events')
const CommandHandler = require('./fileHandler')
const config = require('../../configs/config.json')
const { relicExists, filterRelic } = require('../../utils/generic')
const logger = require('../../utils/logger')

class DiscordEventEmitter extends EventEmitter {
    /** * @param {Client} client */
    constructor(client) {
        super();
        this.client = client;
        this.registerListener();
    }

    registerListener() {
        throw new Error('registerListener method must be implemented by subclasses');
    }
}

class MessageCreateListener extends DiscordEventEmitter {
    constructor(client) {
        super(client);
        this.event = Events.MessageCreate
    }

    registerListener() {
        this.client.on(Events.MessageCreate, this.handleMessageCreate.bind(this))
    }

    /** * @param {Message} message */
    async handleMessageCreate(message) {
        if (message.content === "++filter" && (message.author.id == '740536348166848582' || message.author.id == '498993740715917312')) {
            client.dofilter = !client.dofilter;
            await message.reply({ content: `> ${process.env.NODE_ENV} - ${client.dofilter}` });
        }

        if (message.content == '++dump' && (message.author.id == '740536348166848582' || message.author.id == '498993740715917312')) {
            const logfile = await fs.readFile(path.join(__dirname, '..', '..', 'data', 'app.log'))
            return await message.author.send({ files: [new AttachmentBuilder(Buffer.from(logfile, 'utf-8'), { name: 'dump.txt' })] })
        }

        if (!message.content.startsWith(config.prefix) || message.author.bot)
            return;

        if (process.env.NODE_ENV !== "development" && client.dofilter && !authCategories.includes(message.channel.parentId)) 
            return logger.warn(`[UNAUTH] ${message.author.displayName} @ ${message.guild.name}//${message.channel.name} - ${message.content}`);

        let word = message.content.slice(2).toLocaleLowerCase();
        let cmdType = "";

        let isPrime = word.split(/\s+/g).includes("prime");
        let isRelic = await relicExists(filterRelic(word.toLowerCase().replace(/\b\s*[-]?(r|b|box)\s*.*?$/, "").trim()) ?? "");
        let isStatus = /\b(ed|red|orange|green|yellow)\b(\b\s+[-]?(?:r|b|box)\b)?(.*)?/g.test(word);

        // 1st check: not relic not prime and is ed
        // 2nd check: not relic not ed not prime
        // 3rd check: not relic not ed and is prime
        // 4th check: not prime not ed and is relic
        if (!isRelic && isStatus && !isPrime) {
            cmdType = "status";
        } else if (!isRelic && !isStatus && !isPrime) {
            cmdType = "part";
        } else if (!isRelic && !isStatus && isPrime) {
            cmdType = "prime";
        } else if (isRelic && !isStatus && !isPrime) {
            cmdType = "relic";
        }

        CommandHandler.treasury.get('anycmd')?.execute(this.client, message, word.toLowerCase(), cmdType)
        logger.info(`[CMD] Ran ++${cmdType} command by ${message.member.nickname ?? message.author.username} with arguments: "${word}" @ ${new Date().toLocaleString()}`);
    }
}

class InteractionCreateListener extends DiscordEventEmitter {
    constructor(client) {
        super(client);
        this.event = Events.InteractionCreate
    }

    registerListener() {
        this.client.on(Events.InteractionCreate, this.handleMessageCreate.bind(this))
    }

    /** * @param {CommandInteraction|ButtonInteraction} interaction */
    async handleMessageCreate(interaction) {
        if (interaction.isAutocomplete()) {
            CommandHandler.getDepartment(interaction.commandName).get(interaction.commandName).autocomplete(interaction);
        } else if (interaction.isButton() && !interaction.customId.startsWith('paginate')) {
            CommandHandler.buttons.get(interaction.customId.split('-')[0]).execute(this.client, interaction)
        } else if (interaction.isChatInputCommand()) {
            CommandHandler.getDepartment(interaction.commandName).get(interaction.commandName).execute(this.client, interaction)
        }
    }
}

module.exports = { MessageCreateListener, InteractionCreateListener }
