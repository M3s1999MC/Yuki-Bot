const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'crime',
    aliases: ['crimen'],
    category: 'economy',
    description: 'Comete un crimen en la red para ganar Bolívares (con riesgo de multa).',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const success = Math.random() > 0.4;

        const escenariosExito = [
            'hackeaste los servidores centrales del banco y desviaste fondos sin dejar rastro',
            'asaltaste un camión blindado lleno de billetes recién impresos',
            'vendiste información clasificada de la administración en el mercado negro',
            'saqueaste la bóveda de seguridad del distrito comercial'
        ];

        const escenariosFallo = [
            'activaste las alarmas silenciosas y la policía cibernética te rodeó',
            'te tropezaste huyendo con el botín y te atraparon en el callejón',
            'un infiltrado te delató antes de que pudieras escapar de la escena',
            'el sistema de seguridad bloqueó las puertas y tuviste que pagar fianza'
        ];

        db.getSafeUser(sender, async (err, user) => {
            if (err || !user) {
                return sock.sendMessage(jid, {
                    text: `「✿」 ERROR DE RED 🥀\n\n` +
                          `₊˚ˑ༄ No pude verificar tus antecedentes en la base de datos.`
                }, { quoted: m });
            }

            if (success) {
                const reward = Math.floor(Math.random() * 2000) + 1000;
                const crimen = escenariosExito[Math.floor(Math.random() * escenariosExito.length)];

                db.run(`UPDATE users SET wallet = wallet + ? WHERE jid = ?`, [reward, sender], async (updateErr) => {
                    if (updateErr) {
                        console.error('Error al actualizar botín de crimen:', updateErr.message);
                        return sock.sendMessage(jid, {
                            text: `「✿」 ERROR CRÍTICO 🥀\n\n` +
                                  `₊˚ˑ༄ No se pudo acreditar el botín en tu billetera.`
                        }, { quoted: m });
                    }

                    const text = `「✿」 GOLPE DELICTIVO EXITOSO 🌸✨\n\n` +
                                 `₊˚ˑ༄ Lograste ${crimen}.\n` +
                                 `❀ 💰 *Botín obtenido:* \`+$${reward.toLocaleString('es-CO')} Bolívares\`\n` +
                                 `───────────────────\n` +
                                 `❀ _¡El crimen sí paga en esta economía!_ 🦹‍♂️`;

                    await sock.sendMessage(jid, { text, mentions: [sender] }, { quoted: m });
                });
            } else {
                const fine = Math.floor(Math.random() * 1000) + 500;
                const walletActual = Number(user.wallet) || 0;
                const multaReal = Math.min(fine, walletActual);
                const fallo = escenariosFallo[Math.floor(Math.random() * escenariosFallo.length)];

                db.run(`UPDATE users SET wallet = MAX(0, wallet - ?) WHERE jid = ?`, [multaReal, sender], async (updateErr) => {
                    if (updateErr) {
                        console.error('Error al cobrar multa de crimen:', updateErr.message);
                        return sock.sendMessage(jid, {
                            text: `「✿」 ERROR CRÍTICO 🥀\n\n` +
                                  `₊˚ˑ༄ No se pudo procesar la multa en el sistema.`
                        }, { quoted: m });
                    }

                    const text = `「✿」 OPERACIÓN FRACASADA 🥀\n\n` +
                                 `₊˚ˑ༄ ¡Desastre total! Mientras operabas, ${fallo}.\n` +
                                 `❀ 💸 *Multa pagada:* \`-$${multaReal.toLocaleString('es-CO')} Bolívares\`\n` +
                                 `───────────────────\n` +
                                 `❀ _¡Por torpe te quedaste sin botín y más pobre!_ 📉`;

                    await sock.sendMessage(jid, { text, mentions: [sender] }, { quoted: m });
                });
            }
        });
    }
};
