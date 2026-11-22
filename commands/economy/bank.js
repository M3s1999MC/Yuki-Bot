const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'banco',
    aliases: ['bank'],
    category: 'economy',
    description: 'Revisa el estado detallado e intereses de tu cuenta bancaria',
    
    async execute(sock, m) {
        const sender = getMessageSenderJid(m, sock);
        const remoteJid = m.key.remoteJid;

        db.getSafeUser(sender, async (err, user) => {
            if (err || !user) {
                return sock.sendMessage(remoteJid, {
                    text: [
                        '🌸 ˚୨୧⋆｡˚ ⋆ *¡UPS!* ⋆ ˚｡⋆୨୧˚ 🌸',
                        '🍡 _¡Ay, se trabó la ventanilla del banquito y no pude abrir tu libretita!_ 💦',
                        '',
                        '✦ *Estado:* Error al consultar el banco ♡',
                        '',
                        '━━━━━━━━━━ 🌸 ━━━━━━━━━━',
                        '_Inténtalo de nuevo en un segundito, ¿sí? - Orihime 🌸_'
                    ].join('\n')
                }, { quoted: m });
            }

            const banco = Number(user.bank) || 0;
            const interesEstimado = Math.floor(banco * 0.02);

            let notaOrihime = '¡Tu ahorrito está súper seguro conmigo! Nadie te lo puede robar aquí adentro~ 🔒♡';
            if (banco === 0) {
                notaOrihime = '¡Tu alcancía está vaciíta! Usa *!deposit* para guardar tus moneditas antes de que te las roben~ 🍡';
            } else if (interesEstimado >= 5000) {
                notaOrihime = '¡Mira cuánto crece tu dinerito solito cada día! ¡Eres un genio del ahorro! ✨';
            }

            const text = [
                '🌸 ˚୨୧⋆｡˚ ⋆ *BANQUITO DE YUKI* ⋆ ˚｡⋆୨୧˚ 🌸',
                '🍡 _¡Mira cómo van creciendo tus ahorritos en mi bóveda secreta~_',
                '',
                `✦ *Saldo en Banco:* \`$${banco.toLocaleString('es-CO')} Bolívares\` 🏦`,
                `✦ *Interés Diario (2%):* \`+$${interesEstimado.toLocaleString('es-CO')} Bolívares\` 📈`,
                '━━━━━━━━━━ 🌸 ━━━━━━━━━━',
                `♡ _${notaOrihime}_`,
                '_Cuido tus ahorros con amor, Orihime 🌸_'
            ].join('\n');

            await sock.sendMessage(remoteJid, { text }, { quoted: m });
        });
    }
};
