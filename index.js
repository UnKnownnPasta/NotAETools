const fs = require('node:fs');
const path = require('node:path');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { err, alert, updateFissures } = require('./data/utils');
require('dotenv').config()

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMessages
    ] 
});

// All Command for treasury
client.treasury = new Collection()
const foldersPath = path.join(__dirname, './treasury/');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('execute' in command) {
            command.name.forEach(name => name != '*' ? client.treasury.set(name, command) : '')
		} else {
			alert(`WARNING`, `The command at ${filePath} is missing a required "execute" property.`);
		}
	}
}
client.treasury.set('*', require('./treasury/messagetype/anyrelic.js'))
alert('INFO', 'All treasury commands loaded')

// Initializing event listeners
const eventsPath = path.join(__dirname, './events/');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(client, ...args));
	} else {
		client.on(event.name, (...args) => event.execute(client, ...args));
	}
}
alert('INFO', 'Event listeners loaded & active')

// Fissures channel ID: 1192962141205045328
setInterval(async () => {
	await updateFissures(client)
}, 10000);

// Retrieve all button components
client.buttons = new Collection(); 
const foldersPathButton = path.join(__dirname, './events/components/')
const buttonFiles = fs.readdirSync(foldersPathButton)

for (const file of buttonFiles) { 
    const filePath = path.join(foldersPathButton, file);
    const button = require(filePath);
    if ('execute' in button) {
        client.buttons.set(button.name, button)
    }
    else { 
        alert(`WARNING`, `The command at ${filePath} is missing a required "execute" property.`);
    }
}
alert('INFO', 'Cached all button handlers')

// we're done here
client.login(process.env.TOKEN)