const { Events } = require('discord.js');
const { loadCommands } = require('../commands/loader');

module.exports = {
    name: Events.ClientReady,
    once: true,

    /**
     * @param {import('discord.js').Client} client
     */
    async execute(client) {
        console.log(`✅ Connecté en tant que ${client.user.tag}`);
        console.log(`📡 Serveurs connectés : ${client.guilds.cache.size}`);

        await loadCommands(client);
    }
};
