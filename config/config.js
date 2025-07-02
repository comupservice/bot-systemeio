require('dotenv').config();

module.exports = {
    discord: {
        token: process.env.DISCORD_TOKEN,
        guildId: process.env.GUILD_ID,
        roleClientPayant: process.env.ROLE_CLIENT_PAYANT,
        roleNonPayant: process.env.ROLE_NON_PAYANT,
        roleNonIdentifie: process.env.ROLE_NON_IDENTIFIE,
        roleAbonne: process.env.ROLE_ABONNE
    },
    systemeio: {
        apiKey: process.env.SYSTEMEIO_API_KEY,
        tagAchat: process.env.TAG_FORMATION_DISCORD,
        tagAbonnement: process.env.TAG_ABONNEMENT_BOT
    },
    smtp: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '465'),
        user: process.env.SMTP_USER,
        password: process.env.SMTP_PASSWORD
    },
    app: {
        verificationInterval: parseInt(process.env.GLOBAL_VERIFICATION_INTERVAL, 10) || 60,
        webhookHost: process.env.WEBHOOK_HOST || '0.0.0.0',
        webhookPort: parseInt(process.env.WEBHOOK_PORT, 10) || 8080,
        enableCron: process.env.ENABLE_CRON_VERIFICATION === 'true'
    }
};
