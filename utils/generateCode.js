/**
 * Génère un code numérique aléatoire à 6 chiffres
 * @returns {string}
 */
function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = {
    generateCode
};
