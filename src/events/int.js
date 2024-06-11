import { AutocompleteInteraction, ButtonInteraction, CommandInteraction, Events } from "discord.js";

export default {
    TYPE: Events.InteractionCreate,
    ENABLED: true,
    /**
     * Interaction create event listener
     * @param {CommandInteraction|ButtonInteraction|AutocompleteInteraction} i
     */
    async listener(client, i) {
        if (i.user.bot) return;
        const name = i.commandName;
        let typeInt = null;

        if (i.isButton()) {
            const command = client.interactions.get(`btn-${name}`)
            if (command) command.execute(client, i);
            typeInt = 'button';
        } else if (i.isAutocomplete()) {
            const command = client.commands.get(`${name}`);
            if (command) command.autocomplete(client, i);
            typeInt = 'autocomplete';
        } else if (i.isChatInputCommand()) {
            const command = client.commands.get(`${name}`)
            if (command) command.execute(client, i);
            typeInt = 'slash';
        }

        if (typeInt) console.log(`command | interaction-type::${typeInt} - by ${i.user.username} - /${i.commandName || i.customId} @ ${new Date().toLocaleTimeString()} || ${new Date().toLocaleDateString()}`);
    },
};
