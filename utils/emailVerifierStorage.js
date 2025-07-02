const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'data', 'emailverifier.json');

function getLocalTagsForEmail(email) {
    if (!fs.existsSync(filePath)) return null;

    try {
        delete require.cache[require.resolve(filePath)];
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const entry = data.find(e => e.email.toLowerCase() === email.toLowerCase());
        return entry ? entry.tags : [];
    } catch (err) {
        console.error('Erreur lecture emailverifier.json:', err);
        return null;
    }
}

module.exports = {
    getLocalTagsForEmail
};
