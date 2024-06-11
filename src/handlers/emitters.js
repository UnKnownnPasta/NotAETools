import { Client, Collection, REST, Routes } from 'discord.js';
import { readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Initialize all listeners.
 * @param {Client} client 
 */
export async function emitAll(client) {
    let loaded = 0;
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const files = await readdir(resolve(__dirname, '../events/'))
    for (const file of files) {
        const filepath = resolve(__dirname, '../events/', file)
        const event = await import(`file://${filepath}`)
        if (!event.default.ENABLED) {
            console.warn(`loader | [warn] Event listener ${event.default.TYPE} was not enabled.`);
            continue;
        }
        client.on(event.default.TYPE, event.default.listener.bind(null, client));
        loaded++
    }
    console.log(`loader | ${loaded} Events registered`);
}

/**
 * Loads all commands.
 * @param {Collection} loadCol 
 * @param {String} type 
 */
export async function loadAs(loadCol, type) {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const files = await readdir(resolve(import.meta.dirname, `../commands/${type}`))
    
    let loaded = 0;
    const cmdsToDeploy = []

    for (const file of files) {
        const filepath = resolve(__dirname, `../commands/${type}`, file);
        const command = await import(`file://${filepath}`);
        loadCol.set(command.default.NAME, command.default);
        if (command.default.SLASH !== null) cmdsToDeploy.push(command.default.SLASH?.toJSON());
        loaded++
    }
    console.log(`loader | Loaded ${loaded} commands for collection "${type}"`);
    return cmdsToDeploy;
}

export async function deploySlashCommands(cmds) {
    const rest = new REST().setToken(process.env.TOKEN);

	try {
		console.info(`loader:deploy | Started refreshing ${cmds.length} application (/) commands.`);

		const data = await rest.put(
			Routes.applicationGuildCommands(process.env.CLIENTID, process.env.MAINGUILDID),
			{ body: cmds },
		);

		console.info(`loader:deploy | Successfully reloaded ${data.length} application (/) commands.`);
	} catch (err) {
		console.error(err);
	}
}
