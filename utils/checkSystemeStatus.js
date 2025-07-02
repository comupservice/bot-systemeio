const axios = require('axios');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const { systemeio, discord } = config;
const { fetchAllContacts } = require('./syncAllContactsToVerifier');
const emailVerifierPath = path.join(__dirname, '../data/emailverifier.json');


async function updateEmailVerifier(email, tags = []) {
    let data = [];
    try {
        if (fs.existsSync(emailVerifierPath)) {
            const raw = fs.readFileSync(emailVerifierPath, 'utf8');
            data = JSON.parse(raw);
        }
    } catch (err) {
        console.error('Erreur lecture emailverifier.json:', err);
    }

    const existing = data.find(e => e.email.toLowerCase() === email.toLowerCase());
    if (existing) {
        existing.tags = tags;
    } else {
        data.push({ email, tags });
    }

    try {
        fs.writeFileSync(emailVerifierPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        console.error('Erreur écriture emailverifier.json:', err);
    }
}

function getCachedTags(email) {
    try {
        if (!fs.existsSync(emailVerifierPath)) return null;
        const raw = fs.readFileSync(emailVerifierPath, 'utf8');
        const data = JSON.parse(raw);
        const found = data.find(e => e.email.toLowerCase() === email.toLowerCase());
        return found ? found.tags : null;
    } catch (err) {
        console.error('Erreur lecture cache email:', err);
        return null;
    }
}

async function checkSystemeStatus(email, member) {
    try {
        if (typeof email !== 'string') {
            console.error('❌ [checkSystemeStatus] "email" n’est pas une string :', email);
            return false;
        }

        let tags = getCachedTags(email);
        if (!tags || tags.length === 0) {
            const contact = await fetchAllContacts(email);
            if (!contact) {
                console.log(`❌ Aucun contact trouvé pour ${email}`);
                return false;
            }
            tags = contact.tags || [];
            await updateEmailVerifier(email, tags);
        }

        const roles = member.guild.roles.cache;
        const guild = member.guild;

        const lowerTags = tags
            .filter(t => typeof t === 'string')
            .map(t => t.toLowerCase());

        const hasTagAchat = systemeio.tagAchat && lowerTags.includes(systemeio.tagAchat.toLowerCase());
        const hasTagAbonnement = systemeio.tagAbonnement && lowerTags.includes(systemeio.tagAbonnement.toLowerCase());

        if (hasTagAchat || hasTagAbonnement) {
            const roleName = hasTagAchat ? discord.roleClientPayant : discord.roleAbonne;
            const role = guild.roles.cache.find(r => r.name === roleName);
            if (role) {
                await member.roles.add(role);
                console.log(`✅ Rôle ${role.name} ajouté à ${member.user.username}`);

                // Retirer le rôle "non identifié" s'il est présent
                const fallbackRole = guild.roles.cache.find(r => r.name === discord.roleNonIdentifie);
                if (fallbackRole && member.roles.cache.has(fallbackRole.id)) {
                    await member.roles.remove(fallbackRole);
                    console.log(`🧹 Rôle ${fallbackRole.name} retiré de ${member.user.username}`);
                }

                return true;
            } else {
                console.warn(`⚠️ Rôle "${roleName}" introuvable`);
                return false;
            }
        } else {
            const fallbackRole = guild.roles.cache.find(r => r.name === discord.roleNonIdentifie);
            if (fallbackRole) {
                await member.roles.add(fallbackRole);
                console.log(`❌ Aucun tag détecté. Rôle ${fallbackRole.name} attribué à ${member.user.username}`);
            } else {
                console.warn(`⚠️ Rôle fallback "${discord.roleNonIdentifie}" introuvable`);
            }
            return false;
        }
    } catch (err) {
        console.error('❌ Erreur checkSystemeStatus:', err);
        return false;
    }
}

module.exports = {
    checkSystemeStatus,
};