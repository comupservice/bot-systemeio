/**
 * G�n�re un code num�rique al�atoire � 6 chiffres
 * @returns {string}
 */
function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = {
    generateCode
};
