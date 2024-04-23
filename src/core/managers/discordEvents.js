const { Events, Client, CommandInteraction, Message, ButtonInteraction } = require('discord.js')
const { EventEmitter } = require('events')

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
        console.log(`${message.content}`)
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
