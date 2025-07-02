const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder
} = require('discord.js');
const path = require('path');
const fs = require('fs');

const { validateVerificationCode, getAllEmails } = require('../../utils/storage');
const { checkSystemeStatus } = require('../../utils/checkSystemeStatus');
const { systemeio } = require('../../config/config');
const { getLocalTagsForEmail } = require('../../utils/emailVerifierStorage');
const { syncAllContactsToVerifier } = require('../../utils/syncAllContactsToVerifier');

function CodeModal(email) {
    const modal = new ModalBuilder()
        .setCustomId(`code_modal_${email}`)
        .setTitle('Entrez le code reçu par e-mail');

    const codeInput = new TextInputBuilder()
        .setCustomId('code_input')
        .setLabel('Code de vérification')
        .setPlaceholder('123456')
        .setMinLength(6)
        .setMaxLength(6)
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(codeInput));
    return modal;
}

async function handleCodeModalSubmit(interaction) {
    console.log("🔧 Modale de code déclenchée :", interaction.customId);

    if (interaction.replied || interaction.deferred) {
        console.warn("⚠️ Interaction déjà utilisée.");
        return;
    }

    try {
        await interaction.deferReply({ flags: 64 });
    } catch (err) {
        if (err.code === 10062) {
            console.warn("⚠️ Interaction expirée avant deferReply()");
            return;
        }
        throw err;
    }

    const modalId = interaction.customId;
    const email = decodeURIComponent(modalId.replace('code_modal_', '')).toLowerCase();
    const submittedCode = interaction.fields.getTextInputValue('code_input');

    const { success, reason } = validateVerificationCode(interaction.user.id, email, submittedCode);

    if (!success) {
        let message = '❌ Code incorrect.';
        if (reason === 'expired') message = '⏰ Code expiré. Veuillez recommencer.';
        if (reason === 'no_code') message = '🚫 Aucune vérification en cours.';
        return await interaction.editReply({ content: message });
    }

    // Enregistrer le lien email ↔ utilisateur
    const emailsPath = path.join(__dirname, '../../data/emails.json');
    let emailsMap = {};
    try {
        if (fs.existsSync(emailsPath)) {
            emailsMap = JSON.parse(fs.readFileSync(emailsPath, 'utf8'));
        }
    } catch (err) {
        console.error('❌ Erreur lecture emails.json:', err);
    }

    emailsMap[interaction.user.id] = email;
    try {
        fs.writeFileSync(emailsPath, JSON.stringify(emailsMap, null, 2), 'utf8');
        console.log(`💾 Email enregistré : ${email} ← ID ${interaction.user.id}`);
    } catch (err) {
        console.error('❌ Erreur écriture emails.json:', err);
    }

    try {
        const tags = getLocalTagsForEmail(email);
        const normalizedTags = Array.isArray(tags) ? tags.map(t => t.toLowerCase()) : [];

        const hasLocalAchat = systemeio.tagAchat && normalizedTags.includes(systemeio.tagAchat.toLowerCase());
        const hasLocalAbonnement = systemeio.tagAbonnement && normalizedTags.includes(systemeio.tagAbonnement.toLowerCase());

        if (hasLocalAchat || hasLocalAbonnement) {
            console.log("✅ Email trouvé localement. Attribution des rôles via cache.");
            const matched = await checkSystemeStatus(email, interaction.member);

            if (matched) {
                return await interaction.editReply({
                    content: `✅ Adresse reconnue localement. Rôles attribués.`
                });
            }
        }

        // Si aucun rôle trouvé via cache → Sync + vérification globale
        await syncAllContactsToVerifier();

        const emails = getAllEmails(); // { userId: email }
        const results = [];

        for (const [userId, email] of Object.entries(emails)) {
            let member;
            try {
                member = await interaction.guild.members.fetch(userId);
            } catch {
                member = null;
            }

            if (!member) {
                results.push(`⚠️ Utilisateur **${userId}** introuvable dans le serveur`);
                continue;
            }

            try {
                const tags = getLocalTagsForEmail(email);
                const normalized = Array.isArray(tags) ? tags.map(t => t.toLowerCase()) : [];

                if (normalized.includes(systemeio.tagAchat.toLowerCase())) {
                    results.push(`✅ ${member.user.tag} : local → rôle **ACHAT**`);
                } else if (normalized.includes(systemeio.tagAbonnement.toLowerCase())) {
                    results.push(`✅ ${member.user.tag} : local → rôle **ABONNE**`);
                } else {
                    results.push(`⚠️ ${member.user.tag} : local → **UNPAID**`);
                }

                await checkSystemeStatus(email, member);
            } catch (err) {
                console.error(`❌ Erreur avec ${email} (${userId}):`, err);
                results.push(`❌ ${member.user.tag} : erreur API`);
            }
        }

        const finalOutput = results.length > 0
            ? results.join('\n').slice(0, 2000)
            : 'Aucun utilisateur avec un email enregistré.';

        await interaction.editReply({ content: finalOutput });

    } catch (err) {
        console.error("❌ Erreur générale dans handleCodeModalSubmit :", err);
        await interaction.editReply({ content: '❌ Une erreur est survenue lors de la vérification.' });
    }
}

module.exports = {
    CodeModal,
    handleCodeModalSubmit
};
