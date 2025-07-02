const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getAllEmails } = require('../../utils/storage');
const { checkSystemeStatus } = require('../../utils/checkSystemeStatus');
const { getLocalTagsForEmail } = require('../../utils/emailVerifierStorage');
const { syncAllContactsToVerifier } = require('../../utils/syncAllContactsToVerifier');
const { systemeio } = require('../../config/config');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('forceverif')
        .setDescription('🔁 Vérifie le statut de tous les utilisateurs enregistrés')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });
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
    }
};
