const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { sendVerificationCode } = require('../../services/email');
const { generateCode } = require('../../utils/generateCode');
const { storeVerificationCode, saveMemberEmail, saveEmail } = require('../../utils/storage');

const EmailModal = () => {
    const modal = new ModalBuilder()
        .setCustomId('email_modal')
        .setTitle('Entrez votre adresse e-mail systeme.io');

    const emailInput = new TextInputBuilder()
        .setCustomId('email_input')
        .setLabel('Adresse e-mail')
        .setPlaceholder('exemple@gmail.com')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const row = new ActionRowBuilder().addComponents(emailInput);
    modal.addComponents(row);

    return modal;
};

/**
 * Gère la soumission de la modale e-mail
 * @param {import('discord.js').ModalSubmitInteraction} interaction
 */
async function handleEmailModalSubmit(interaction) {
    const email = interaction.fields.getTextInputValue('email_input').trim().toLowerCase();

    if (!/^[\w.-]+@[\w.-]+\.\w+$/.test(email)) {
        if (!interaction.replied && !interaction.deferred) {
            return await interaction.reply({
                content: '❌ Adresse e-mail invalide.',
                flags: 64
            });
        }
        return;
    }

    const code = generateCode();

    saveEmail(interaction.user.id, email);
    saveMemberEmail(email, interaction.member);
    storeVerificationCode(interaction.user.id, email, code);

    try {
        await interaction.deferReply({ flags: 64 });

        await sendVerificationCode(email, code);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`open_code_modal_${email}`)
                .setLabel('Entrer le code')
                .setStyle(ButtonStyle.Primary)
        );

        await interaction.editReply({
            content: `📩 Un code a été envoyé à **${email}**.\n📬 Vérifiez également vos spams si vous ne le voyez pas.\nCliquez sur le bouton ci-dessous pour le saisir :`,
            components: [row]
        });
    } catch (err) {
        console.error('Erreur envoi mail:', err);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: `❌ Erreur lors de l'envoi de l'e-mail : ${err.message}`,
                flags: 64
            });
        } else {
            await interaction.editReply({
                content: `❌ Erreur lors de l'envoi de l'e-mail : ${err.message}`
            });
        }
    }
}

module.exports = {
    EmailModal,
    handleEmailModalSubmit
};
