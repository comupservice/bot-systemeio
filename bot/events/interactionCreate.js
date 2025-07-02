const { Events, InteractionType } = require('discord.js');
const { handleVerifButton } = require('../components/VerifView');
const { handleEmailModalSubmit } = require('../components/EmailModal');
const { handleCodeModalSubmit, CodeModal } = require('../components/CodeModal');

module.exports = {
    name: Events.InteractionCreate,

    /**
     * @param {import('discord.js').Interaction} interaction
     */
    async execute(interaction) {
        try {
            // 🔹 Slash command
            if (interaction.isChatInputCommand()) {
                const command = interaction.client.commands.get(interaction.commandName);
                if (!command) return;
                await command.execute(interaction);
            }

            // 🔹 Bouton (customId : "verif_button")
            else if (interaction.isButton()) {
                if (interaction.customId === 'verif_button') {
                    await handleVerifButton(interaction);
                } else if (interaction.customId.startsWith('open_code_modal_')) {
                    const email = interaction.customId.replace('open_code_modal_', '');
                    const modal = CodeModal(email);
                    return await interaction.showModal(modal);
                }
            }
            // 🔹 Modales (customId commence par "email_modal" ou "code_modal_...")
            else if (interaction.type === InteractionType.ModalSubmit) {
                if (interaction.customId === 'email_modal') {
                    await handleEmailModalSubmit(interaction);
                } else if (interaction.customId.startsWith('code_modal_')) {
                    await handleCodeModalSubmit(interaction);
                }
            }

        } catch (err) {
            console.error('❌ Erreur dans interactionCreate :', err);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: '❌ Une erreur est survenue.', flags: 64 });
            } else {
                await interaction.reply({ content: '❌ Une erreur est survenue.', flags: 64 });
            }
        }
    }
};
