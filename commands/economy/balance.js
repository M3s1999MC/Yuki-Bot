const db = require('../../database/db');
const { getBalanceTargetJid } = require('../../utils/messageSender');

module.exports = {
    name: 'balance',
    aliases: ['bal', 'saldo'],
    category: 'economy',
    description: 'Muestra tu saldo actual de billetera y banco.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const target = getBalanceTargetJid(m, sock);
        const username = target.split('@')[0];

        db.getSafeUser(target, (ensureErr, user) => {
            if (ensureErr) {
                console.error('Error al registrar usuario para consultar saldo:', ensureErr.message);
                return sock.sendMessage(jid, {
                    text: [
                        '🌸 ˚୨୧⋆｡˚ ⋆ *¡UPS!* ⋆ ˚｡⋆୨୧˚ 🌸',
                        '🍡 _¡Ay, se me enredaron los papelitos y no pude revisar tu monedero!_ 💦',
                        '',
                        '✦ *Estado:* Error al consultar la cuenta ♡',
                        '',
                        '━━━━━━━━━━ 🌸 ━━━━━━━━━━',
                        '_Inténtalo de nuevo en un ratito, ¿sí? - Orihime 🌸_'
                    ].join('\n')
                }, { quoted: m });
            }

            const wallet = Number(user.wallet) || 0;
            const bank = Number(user.bank) || 0;
            const total = wallet + bank;

            let comentario = '¡Apenas empezando a ahorrar! ¡Ven a trabajar o reclamar tu regalito conmigo~ 🍡';
            if (total >= 100000) {
                comentario = '¡Whoa, qué fortuna! ¡Eres todo un VIP en la casita de Yuki! ✨';
            } else if (total >= 20000) {
                comentario = '¡Qué buen ahorro llevas! Así da gusto contar moneditas~ ♡';
            }

            const text = [
                '🌸 ˚୨୧⋆｡˚ ⋆ *CAJITA DE MONEDITAS* ⋆ ˚｡⋆୨୧˚ 🌸',
                `🍡 _¡Holaaa, @${username}! Mira qué encontré en tus cuentas~_`,
                '',
                `✦ *Billetera:* \`$${wallet.toLocaleString('es-CO')} Bolívares\` 👛`,
                `✦ *Banco:* \`$${bank.toLocaleString('es-CO')} Bolívares\` 🏦`,
                '━━━━━━━━━━ 🌸 ━━━━━━━━━━',
                `✦ *Total:* \`$${total.toLocaleString('es-CO')} Bolívares\` 💎`,
                '',
                `♡ _${comentario}_`,
                '_Con cariño, Orihime 🌸_'
            ].join('\n');

            sock.sendMessage(jid, { text, mentions: [target] }, { quoted: m });
        });
    }
};
