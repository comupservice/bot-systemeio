const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'data', 'emails.json');
const emailToMember = new Map(); // cache temporaire
const verificationCodes = new Map(); // code de vérification en mémoire

function saveMemberEmail(email, member) {
    emailToMember.set(email.toLowerCase(), member);
}

function getMemberByEmail(email) {
    return emailToMember.get(email.toLowerCase());
}

function readStorage() {
    if (!fs.existsSync(filePath)) return {};
    try {
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Erreur lecture emails.json:', err);
        return {};
    }
}

function writeStorage(data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
        console.error('Erreur écriture emails.json:', err);
    }
}

/**
 * Associe un e-mail à un ID utilisateur (Discord)
 * @param {string} userId
 * @param {string} email
 */
function saveEmail(userId, email) {
    const db = readStorage();
    db[userId] = email.toLowerCase();
    writeStorage(db);
}

/**
 * Récupère l'email d'un utilisateur Discord
 * @param {string} userId
 * @returns {string | undefined}
 */
function getEmail(userId) {
    const db = readStorage();
    return db[userId];
}

/**
 * Récupère la map userId → email (pour forceverif)
 * @returns {Object}
 */
function getAllEmails() {
    return readStorage();
}
function getUserIdByEmail(email) {
    const db = readStorage(); // emails.json
    const lowerEmail = email.toLowerCase();
    return Object.entries(db).find(([userId, savedEmail]) => savedEmail === lowerEmail)?.[0];
}
/**
 * Stocke un code de vérification pour un utilisateur + e-mail
 * @param {string} userId
 * @param {string} email
 * @param {string} code
 * @param {number} ttlSeconds - durée de vie du code en secondes
 */
function storeVerificationCode(userId, email, code, ttlSeconds = 3600) {
    const key = `${userId}_${email.toLowerCase()}`;
    const expiresAt = Date.now() + ttlSeconds * 1000;
    verificationCodes.set(key, { code, expiresAt });
    console.log("[store] storing code for:", userId, email, code);
}

/**
 * Vérifie un code de vérification
 * @param {string} userId
 * @param {string} email
 * @param {string} submittedCode
 * @returns {{ success: boolean, reason?: string }}
 */
function validateVerificationCode(userId, email, submittedCode) {
    const key = `${userId}_${email.toLowerCase()}`;
    const record = verificationCodes.get(key);

    if (!record) return { success: false, reason: 'no_code' };

    const now = Date.now();
    if (now > record.expiresAt) {
        verificationCodes.delete(key);
        return { success: false, reason: 'expired' };
    }

    if (record.code !== submittedCode) {
        return { success: false, reason: 'invalid' };
    }

    verificationCodes.delete(key);
    return { success: true };
}

module.exports = {
    saveEmail,
    getEmail,
    getAllEmails,
    saveMemberEmail,
    getMemberByEmail,
    storeVerificationCode,
    validateVerificationCode,
    getUserIdByEmail
};
