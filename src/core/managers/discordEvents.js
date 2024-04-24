const { Events, Client, CommandInteraction, Message, ButtonInteraction, Collection } = require('discord.js')
const { EventEmitter } = require('events')
const CommandHandler = require('./fileHandler')

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
        if (message.content.startsWith("++")) {
            const command = message.content.split(/\s+/g)[0].slice(2)
            const testcmdDept = CommandHandler.getDepartment(command)
            if (!testcmdDept || testcmdDept?.get(command).type !== 'message') return null;

            testcmdDept.get(command).execute(this.client, )
        }
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
        console.log(`${interaction}`)
    }
}

module.exports = { MessageCreateListener, InteractionCreateListener }
