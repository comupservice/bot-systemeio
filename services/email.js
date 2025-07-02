const nodemailer = require('nodemailer');
const { smtp } = require('../config/config');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // Ou un autre serveur SMTP
    port: 465,
    secure: true,
    auth: {
        user: smtp.user,
        pass: smtp.password
    },
      tls: {
        rejectUnauthorized: false // ⚠️ désactive la vérification du certificat
    }

});

/**
 * Envoie le code de vérification à l'adresse email
 * @param {string} toEmail
 * @param {string} code
 */
async function sendVerificationCode(toEmail, code) {
    const mailOptions = {
        from: `"systeme.io Vérification" <${smtp.user}>`,
        to: toEmail,
        subject: 'Votre code de vérification systeme.io',
        text: `Votre code de vérification est : ${code}`
    };

    await transporter.sendMail(mailOptions);
}

module.exports = {
    sendVerificationCode
};
