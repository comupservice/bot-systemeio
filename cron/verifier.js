const cron = require('node-cron');
const { getAllEmails } = require('../utils/storage');
const { fetchAllContacts, updateEmailVerifier } = require('../utils/checkSystemeStatus');
const { assignRoleFromStatus } = require('../services/roles');
const { app } = require('../config/config');
const { syncAllContactsToVerifier } = require('../utils/syncAllContactsToVerifier');

/**
 * Démarre une tâche cron périodique si activée dans la config
 * @param {import('discord.js').Client} client
 */
function startVerificationCron(client) {
    if (!app.enableCron) {
        console.log('⏹️ Vérification périodique désactivée par config.');
        return;
    }

    const interval = app.verificationInterval;
    const minutes = Math.max(1, interval);
    const cronExpression = `*/${minutes} * * * *`;

    cron.schedule(cronExpression, async () => {
        console.log('🔁 Vérification périodique en cours...');

        const emails = getAllEmails();

        for (const [userId, email] of Object.entries(emails)) {
            for (const guild of client.guilds.cache.values()) {
                const member = guild.members.cache.get(userId);
                if (!member) continue;

                try {
                    const contact = await fetchAllContacts(email);
                    if (contact && contact.tags) {
                        await updateEmailVerifier(email, contact.tags);
                        const status = { email, tags: contact.tags };
                        await assignRoleFromStatus(member, status);
                        console.log(`🔄 ${member.user.tag} → rôles mis à jour depuis API [${contact.tags.join(', ')}]`);
                    } else {
                        console.warn(`❌ Aucun contact trouvé pour ${email}`);
                    }
                } catch (err) {
                    console.error(`❌ Erreur avec ${email} (${member.user.tag}) :`, err);
                }
            }
        }

        await syncAllContactsToVerifier();
        console.log('✅ Vérification périodique terminée.');
    });

    console.log(`🕒 Cron lancé : toutes les ${minutes} minute(s)`);
}

module.exports = startVerificationCron;
