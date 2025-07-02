const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { app: appConfig, discord, systemeio } = require('../config/config');
const { getUserIdByEmail } = require('../utils/storage');
const { assignRoleFromStatus } = require('../services/roles');

const emailVerifierPath = path.join(__dirname, '..', 'data', 'emailverifier.json');

/**
 * Ajoute un tag à une adresse email dans le fichier emailverifier.json
 * Si l'email existe déjà, le tag est ajouté s'il n'est pas en double.
 */
function saveToEmailVerifier(email, newTag) {
    let data = [];

    try {
        if (fs.existsSync(emailVerifierPath)) {
            const content = fs.readFileSync(emailVerifierPath, 'utf8') || '[]';
            data = JSON.parse(content);
            if (!Array.isArray(data)) throw new Error("Format invalide");
        }
    } catch (err) {
        console.error("❌ Erreur lecture emailverifier.json :", err.message);
        data = [];
    }

    const entry = data.find(item => item.email === email);
    if (entry) {
        if (!entry.tags.includes(newTag)) {
            entry.tags.push(newTag);
            console.log(`✅ Tag ajouté à ${email} : ${newTag}`);
        }
    } else {
        data.push({ email, tags: [newTag] });
        console.log(`✅ Nouvel email ajouté : ${email} avec tag ${newTag}`);
    }

    try {
        fs.writeFileSync(emailVerifierPath, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("❌ Erreur écriture emailverifier.json :", err.message);
    }
}

async function startWebhookServer(client) {
    const app = express();
    app.use(bodyParser.json());
    app.locals.discordClient = client;

    app.post('/systemeio-webhook', async (req, res) => {
        try {
            const { event_type, event } = req.body;
            const email = (event?.email || '').toLowerCase();
            const tag = (event?.tag || '').toLowerCase();

            if (!email) {
                return res.status(400).send('Email manquant.');
            }

            const userId = getUserIdByEmail(email);
            if (!userId) {
                return res.status(200).send('Utilisateur Discord non trouvé (base persistante).');
            }

            const guild = client.guilds.cache.first();
            const member = await guild.members.fetch(userId).catch(() => null);

            if (!member) {
                return res.status(200).send('Membre Discord non trouvé.');
            }

            switch (event_type) {
                case 'tag_added':
                    saveToEmailVerifier(email, tag);

                    if (tag.includes(systemeio.tagAchat?.toLowerCase())) {
                        await assignRoleFromStatus(member, 'achat');
                    } else if (tag.includes(systemeio.tagAbonnement?.toLowerCase())) {
                        await assignRoleFromStatus(member, 'abonne');
                    } else {
                        await assignRoleFromStatus(member, 'unknown');
                    }
                    break;

                case 'subscription_cancelled':
                case 'payment_failed':
                    await assignRoleFromStatus(member, 'unpaid');
                    break;

                case 'tag_removed':
                    if (
                        tag.includes(systemeio.tagAchat?.toLowerCase()) ||
                        tag.includes(systemeio.tagAbonnement?.toLowerCase())
                    ) {
                        await assignRoleFromStatus(member, 'unpaid');
                    }
                    break;

                default:
                    console.log(`ℹ️ Type d’événement non géré: ${event_type}`);
            }

            res.status(200).send('Webhook traité avec succès.');
        } catch (error) {
            console.error('Erreur webhook Systeme.io:', error);
            res.status(500).send('Erreur serveur webhook.');
        }
    });

    app.listen(appConfig.webhookPort, appConfig.webhookHost, () => {
        console.log(`🌐 Webhook serveur démarré sur http://${appConfig.webhookHost}:${appConfig.webhookPort}/systemeio-webhook`);
    });
}

module.exports = {
    startWebhookServer
};
