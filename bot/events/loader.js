const fs = require('fs');
const path = require('path');

/**
 * Charge dynamiquement tous les événements dans le client Discord
 * @param {import('discord.js').Client} client
 */
async function loadEvents(client) {
    const eventsPath = path.join(__dirname);
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js') && file !== 'loader.js');

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);

        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
    }

    console.log('✅ Événements chargés.');
}

module.exports = {
    loadEvents
};
