const axios = require('axios');
const { systemeio } = require('../config/config');

async function getAllContacts() {
    let page = 1;
    const allContacts = [];

    while (true) {
        const res = await axios.get(`https://api.systeme.io/api/contacts?page=${page}`, {
            headers: { 'X-API-Key': systemeio.apiKey }
        });

        const items = res.data?.items || [];
        if (items.length === 0) break;

        allContacts.push(...items);
        page++;
    }

    return allContacts;
}

module.exports = { getAllContacts };
