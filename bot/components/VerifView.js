const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { EmailModal } = require('./EmailModal');

function VerifView() {
    const button = new ButtonBuilder()
        .setCustomId('verif_button')
        .setLabel('Vérifier')
        .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);
    return [row]; // tableau de rows
}

/**
 * Gère le clic sur le bouton de vérification
 * @param {import('discord.js').Interaction} interaction
 */
async function handleVerifButton(interaction) {
    try {
        const modal = EmailModal();
        await interaction.showModal(modal);
    } catch (err) {
        console.error('Erreur bouton vérif :', err);
        await interaction.reply({ content: '❌ Une erreur est survenue.', flags: 64 });
    }
}

module.exports = {
    VerifView,
    handleVerifButton
};
