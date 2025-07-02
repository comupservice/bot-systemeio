const { discord } = require('../config/config');

/**
 * Assigne un rôle à un membre Discord en fonction du statut renvoyé par Systeme.io
 * @param {import('discord.js').GuildMember} member
 * @param {'achat' | 'unpaid' | 'unknown'| 'abonne'} status
 */
async function assignRoleFromStatus(member, status) {
    const roles = member.guild.roles.cache;

    const roleMap = {
        achat: discord.roleClientPayant || 'client payant',
        unpaid: discord.roleNonPayant || 'non payant',
        unknown: discord.roleNonIdentifie || 'non identifié',
        abonne: discord.roleAbonne || 'abonné'
    };

    const roleNameToAdd = roleMap[status];
    const roleToAdd = roles.get(roleNameToAdd) || roles.find(r => r.name.toLowerCase() === roleNameToAdd.toLowerCase());

    if (!roleToAdd) {
        console.warn(`⚠️ Rôle introuvable : ${roleNameToAdd}`);
        return;
    }

    // Supprimer les autres rôles du même groupe avant d'ajouter le nouveau
    const rolesToRemove = Object.values(roleMap)
        .map(name => roles.find(r => r.name.toLowerCase() === name.toLowerCase()))
        .filter(r => r && member.roles.cache.has(r.id) && r.id !== roleToAdd.id);

    try {
        if (rolesToRemove.length > 0) {
            await member.roles.remove(rolesToRemove);
        }

        if (!member.roles.cache.has(roleToAdd.id)) {
            await member.roles.add(roleToAdd);
            console.log(`✅ ${member.user.tag} → ${status.toUpperCase()} (${roleToAdd.name})`);
        }
    } catch (err) {
        console.error(`❌ Erreur d’attribution de rôle à ${member.user.tag} :`, err.message);
    }
}

module.exports = {
    assignRoleFromStatus
};
