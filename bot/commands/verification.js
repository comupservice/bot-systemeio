const { SlashCommandBuilder } = require('discord.js');
const { EmailModal } = require('../components/EmailModal');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verification')
        .setDescription('📨 Lance la vérification Systeme.io via e-mail'),

    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
        try {
            const modal = EmailModal();
            await interaction.showModal(modal);
        } catch (err) {
            console.error('Erreur ouverture modale :', err);
            await interaction.reply({ content: '❌ Une erreur est survenue.', flags: 64 });
        }
    }
};
