const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const { VerifView } = require('../components/VerifView');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addbouton')
        .setDescription('➕ Ajouter un bouton de vérification dans un salon')
        .addChannelOption(option =>
            option.setName('salon')
                .setDescription('Salon texte où envoyer le bouton')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
        const channel = interaction.options.getChannel('salon');

        if (!channel || channel.type !== ChannelType.GuildText) {
            return interaction.reply({ content: '❌ Salon invalide.', flags: 64 });
        }

        try {
            await channel.send({
                content: '📩 Cliquez sur le bouton ci-dessous pour vérifier votre email liée au compte de la formation et déverrouiller le serveur :',
                components: VerifView()
            });

            await interaction.reply({
                content: `✅ Bouton envoyé dans ${channel.toString()}`,
                flags: 64
            });
        } catch (err) {
            console.error('Erreur envoi bouton :', err);
            await interaction.reply({
                content: '❌ Une erreur est survenue lors de l’envoi du bouton.',
                flags: 64
            });
        }
    }
};
