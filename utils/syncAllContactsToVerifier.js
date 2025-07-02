const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { systemeio } = require('../config/config');

const verifierPath = path.join(__dirname, '..', 'data', 'emailverifier.json');

async function fetchAllContacts() {
    const allContacts = [];
    const perPage = 25;

    for (let page = 1; page <= 2; page++) {
        try {
            const res = await axios.get(`https://api.systeme.io/api/contacts`, {
                headers: { 'X-API-Key': systemeio.apiKey },
                params: {
                    page: page,
                    limit: perPage
                }
            });

            const contacts = res.data?.items || [];

            console.log(`📦 Page ${page} : ${contacts.length} contacts`);
            allContacts.push(...contacts);

            await new Promise(resolve => setTimeout(resolve, 750));

        } catch (err) {
            console.error(`❌ Erreur sur page ${page} :`, err.response?.data || err.message);
            break;
        }
    }

    return allContacts;
}

async function syncAllContactsToVerifier() {
    try {
        console.log('🔁 Synchronisation complète des contacts en cours...');

        const contacts = await fetchAllContacts();
        const verifierData = contacts.map(c => ({
            email: c.email.toLowerCase(),
            tags: (c.tags || []).map(t => t.name.toLowerCase())
        }));

        fs.writeFileSync(verifierPath, JSON.stringify(verifierData, null, 2));
        console.log(`✅ ${verifierData.length} contacts enregistrés dans emailverifier.json`);
    } catch (err) {
        console.error('❌ Erreur lors de la synchronisation complète :', err?.response?.data || err.message);
    }
}

module.exports = { syncAllContactsToVerifier, fetchAllContacts };
