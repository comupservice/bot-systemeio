// index.js

require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const { startWebhookServer } = require('./webhook/server');
const { loadEvents } = require('./bot/events/loader');
const { loadCommands } = require('./bot/commands/loader');
const startVerificationCron = require('./cron/verifier');

// Cr�ation du client Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
});

client.commands = new Collection();

(async () => {
    try {
        // D�marrage du serveur webhook 
        await startWebhookServer(client);

        // Chargement des �v�nements (onReady, interaction, etc.)
        await loadEvents(client);

        // D�marrage du cron de v�rification p�riodique
        startVerificationCron(client);
        // Connexion � Discord
        await client.login(process.env.DISCORD_TOKEN);
        await loadCommands(client);

    } catch (error) {
        console.error('Erreur au d�marrage du bot :', error);
    }
})();
