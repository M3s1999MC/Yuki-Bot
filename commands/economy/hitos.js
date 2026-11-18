const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'hitos',
    aliases: ['elogros', 'metas'],
    category: 'economy',
    description: 'Consulta tus insignias y logros financieros basados en tu patrimonio en Bolívares.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        
        // Permitir ver los hitos de otro usuario si se menciona
        const targetUser = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || sender;

        db.getSafeUser(targetUser, async (err, user) => {
            if (err || !user) {
                return sock.sendMessage(jid, { 
                    text: '「✿」 ERROR DE RED // No pude verificar los datos del usuario en el sistema. 🥀' 
                }, { quoted: m });
            }

            const wallet = Number(user.wallet) || 0;
            const bank = Number(user.bank) || 0;
            const patrimonio = wallet + bank;

            // Definición de hitos financieros en Bolívares
            const hito1 = patrimonio >= 10000;
            const hito2 = patrimonio >= 100000;
            const hito3 = patrimonio >= 1000000;

            const check1 = hito1 ? '✓' : ' ';
            const check2 = hito2 ? '✓' : ' ';
            const check3 = hito3 ? '✓' : ' ';

            const patrimonioFormateado = patrimonio.toLocaleString('es-CO');

            const text = `「✿」 HITOS FINANCIEROS 🏆✨\n\n` +
                         `₊˚ˑ༄ Insignias y logros de: @${targetUser.split('@')[0]}\n` +
                         `❀ 💰 *Patrimonio actual:* \`$${patrimonioFormateado} Bolívares\`\n\n` +
                         `🥉 [${check1}] *Primeros Ahorros* ($10.000)\n` +
                         `🥈 [${check2}] *Inversionista* ($100.000)\n` +
                         `🥇 [${check3}] *Magnate de Yuki* ($1.000.000)\n` +
                         `───────────────────\n` +
                         `❀ _¡Sigue acumulando fondos para desbloquear todas las insignias!_ 🌸`;

            await sock.sendMessage(jid, { text, mentions: [targetUser] }, { quoted: m });
        });
    }
};
