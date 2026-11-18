const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'dado',
    aliases: ['dice'],
    category: 'economy',
    description: 'Lanza un dado del 1 al 8, apuesta tus Bolívares y multiplica x6 si aciertas.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        
        const numeroElegido = parseInt(args[0]);
        const apuesta = parseInt(args[1]);

        if (!numeroElegido || numeroElegido < 1 || numeroElegido > 8 || isNaN(apuesta) || apuesta <= 0) {
            return await sock.sendMessage(jid, {
                text: '(「✿」 "MINIJUEGO DE DADOS" 🎲)\n\n' +
                      '₊˚ˑ༄ Adivina un número del 1 al 8 para multiplicar tu apuesta por x6.\n' +
                      '❀ *Uso:* `!dado <número> <monto>`\n' +
                      '❀ *Ejemplo:* `!dado 4 500` 🌸'
            }, { quoted: m });
        }

        db.getSafeUser(sender, async (err, user) => {
            if (err || !user) {
                return sock.sendMessage(jid, { text: '(「✿」 "ERROR DE RED" 🥀)\n\nNo pude verificar tus fondos en el sistema.' }, { quoted: m });
            }

            const walletActual = Number(user.wallet) || 0;

            if (apuesta > walletActual) {
                return await sock.sendMessage(jid, {
                    text: `(「✿」 "FONDOS INSUFICIENTES" 🥀)\n\n` +
                          `₊˚ˑ༄ No tienes tantos Bolívares en tu billetera.\n` +
                          `❀ *Tu saldo actual:* \`$${walletActual.toLocaleString('es-CO')} Bolívares\` 📉`
                }, { quoted: m });
            }

            const resultadoDado = Math.floor(Math.random() * 8) + 1;

            if (numeroElegido === resultadoDado) {
                const ganancia = apuesta * 6;
                const diferenciaNeta = ganancia - apuesta; // Gana x6 sobre su apuesta neta

                db.run(`UPDATE users SET wallet = wallet + ? WHERE jid = ?`, [diferenciaNeta, sender], async (updateErr) => {
                    if (updateErr) {
                        console.error('Error al acreditar ganancia de dado:', updateErr.message);
                        return;
                    }

                    await sock.sendMessage(jid, {
                        text: `(「✿」 "¡DADO ACERTADO!" 🌸)\n\n` +
                              `₊˚ˑ༄ El dado giró y cayó en el número: **${resultadoDado}** 🎲✨\n` +
                              `❀ *Premio obtenido:* \`+$${diferenciaNeta.toLocaleString('es-CO')} Bolívares\` (x6)\n` +
                              `───────────────────\n` +
                              `❀ _¡Una tirada maestra en la red!_ 💵`,
                        mentions: [sender]
                    }, { quoted: m });
                });
            } else {
                db.run(`UPDATE users SET wallet = wallet - ? WHERE jid = ?`, [apuesta, sender], async (updateErr) => {
                    if (updateErr) {
                        console.error('Error al descontar apuesta de dado:', updateErr.message);
                        return;
                    }

                    await sock.sendMessage(jid, {
                        text: `(「✿」 "TIRO FALLIDO" 🥀)\n\n` +
                              `₊˚ˑ༄ El dado cayó en el **${resultadoDado}** (elegiste el ${numeroElegido}).\n` +
                              `❀ *Apuesta perdida:* \`-$${apuesta.toLocaleString('es-CO')} Bolívares\` 📉\n` +
                              `───────────────────\n` +
                              `❀ _¡La casa se queda con todo, tonto!_`,
                        mentions: [sender]
                    }, { quoted: m });
                });
            }
        });
    }
};
