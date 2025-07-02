const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const { discord } = require('../../config/config');

/**
 * Charge toutes les commandes slash et les enregistre auprès de Discord
 * @param {import('discord.js').Client} client
 */
async function loadCommands(client) {
    const commands = [];
    const commandsPath = path.join(__dirname);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js') && file !== 'loader.js');

    for (const file of commandFiles) {
        const command = require(path.join(commandsPath, file));
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            commands.push(command.data.toJSON());
        }
    }

    const rest = new REST({ version: '10' }).setToken(discord.token);

    try {
        if (discord.guildId) {
            console.log('🔄 Sync commandes dans le serveur (local)...');
            await rest.put(
                Routes.applicationGuildCommands(client.user.id, discord.guildId),
                { body: commands }
            );
            console.log('✅ Commandes synchronisées dans le serveur.');
        } else {
            console.log('🌍 Sync commandes globales...');
            await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: commands }
            );
            console.log('✅ Commandes synchronisées globalement (peut prendre 1h).');
        }
    } catch (error) {
        console.error('❌ Erreur de synchronisation des commandes :', error);
    }
}

module.exports = {
    loadCommands
};
