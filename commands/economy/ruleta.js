const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');
const { claim, formatDuration } = require('../../utils/cooldowns');

module.exports = {
    name: 'ruleta',
    aliases: ['roulette'],
    category: 'economy',
    description: 'Apuesta tus Bolívares en la ruleta del casino de Yuki (Rojo, Negro o Verde).',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        
        const opcion = args[0]?.toLowerCase();
        const apuesta = parseInt(args[1]);

        const opcionesValidas = ['rojo', 'negro', 'verde', 'red', 'black', 'green'];

        if (!opcion || !opcionesValidas.includes(opcion) || !apuesta || isNaN(apuesta) || apuesta <= 0) {
            const tabla = `「✿」 RULETA DEL CASINO 🎡✨\n\n` +
                          `₊˚ˑ༄ Pon a prueba tu suerte apostando en la ruleta:\n\n` +
                          `❀ 🔴 *Rojo / Red* (Multiplicador x2)\n` +
                          `❀ ⚫ *Negro / Black* (Multiplicador x2)\n` +
                          `❀ 🟢 *Verde / Green* (Multiplicador x14)\n\n` +
                          `───────────────────\n` +
                          `❀ *Uso:* \`!ruleta <color> <monto>\`\n` +
                          `❀ *Ejemplo:* \`!ruleta rojo 500\` 🌸`;

            return await sock.sendMessage(jid, { text: tabla }, { quoted: m });
        }

        // Normalizar opción de color
        const colorApuesta = ['red'].includes(opcion) ? 'rojo' : ['black'].includes(opcion) ? 'negro' : ['green'].includes(opcion) ? 'verde' : opcion;

        // Cooldown de 10 segundos para evitar spam en el casino
        const cooldown = await claim(sender, 'ruleta', 10000);
        if (!cooldown.ok) {
            const remainingFormatted = formatDuration(cooldown.remainingMs);
            return sock.sendMessage(jid, { 
                text: `「✿」 COOLDOWN DE APUESTA ⏳\n\n₊˚ˑ༄ Espera *${remainingFormatted}* para volver a girar la ruleta.` 
            }, { quoted: m });
        }

        db.getSafeUser(sender, async (errUser, user) => {
            if (errUser || !user) {
                return sock.sendMessage(jid, { text: '「✿」 ERROR DE RED // No pude verificar tu cuenta en el casino. 🥀' }, { quoted: m });
            }

            const walletActual = Number(user.wallet) || 0;
            const apuestaF = apuesta.toLocaleString('es-CO');

            if (walletActual < apuesta) {
                return sock.sendMessage(jid, { 
                    text: `「✿」 FONDOS INSUFICIENTES 🥀\n\n` +
                          `₊˚ˑ༄ No tienes suficientes Bolívares en tu billetera para esta apuesta.\n` +
                          `❀ *Apuesta:* \`$${apuestaF} Bolívares\`\n` +
                          `❀ *Tu saldo:* \`$${walletActual.toLocaleString('es-CO')} Bolívares\` 📉` 
                }, { quoted: m });
            }

            // Simulación de giro de ruleta (0 al 36)
            const numero = Math.floor(Math.random() * 37);
            let colorResultado = numero === 0 ? 'verde' : (numero % 2 === 0 ? 'negro' : 'rojo');
            const gano = (colorApuesta === colorResultado);

            const emojiColor = colorResultado === 'rojo' ? '🔴' : colorResultado === 'negro' ? '⚫' : '🟢';

            if (gano) {
                const multiplicador = colorResultado === 'verde' ? 14 : 2;
                const premio = apuesta * multiplicador;
                const gananciaNeta = premio - apuesta; // Ganancia real añadida a la billetera

                db.run(`UPDATE users SET wallet = wallet + ? WHERE jid = ?`, [gananciaNeta, sender], async (updateErr) => {
                    if (updateErr) {
                        return sock.sendMessage(jid, { text: '「✿」 ERROR CRÍTICO // No se pudo abonar tu premio de la ruleta. 🥀' }, { quoted: m });
                    }

                    const premioF = premio.toLocaleString('es-CO');
                    const text = `「✿」 ¡VICTORIA EN LA RULETA! 🎉✨\n\n` +
                                 `₊˚ˑ༄ La esfera se detuvo en: ${emojiColor} *${numero} (${colorResultado.toUpperCase()})*\n` +
                                 `❀ 🎯 *Tu elección:* \`${colorApuesta.toUpperCase()}\`\n` +
                                 `❀ 💰 *Premio obtenido:* \`+$${premioF} Bolívares\` (x${multiplicador})\n` +
                                 `───────────────────\n` +
                                 `❀ _¡La suerte sonríe a los audaces en la red de Yuki!_ 🌸`;

                    await sock.sendMessage(jid, { text, mentions: [sender] }, { quoted: m });
                });

            } else {
                db.run(`UPDATE users SET wallet = wallet - ? WHERE jid = ?`, [apuesta, sender], async (updateErr) => {
                    if (updateErr) {
                        return sock.sendMessage(jid, { text: '「✿」 ERROR CRÍTICO // No se pudo debitar tu apuesta de la ruleta. 🥀' }, { quoted: m });
                    }

                    const text = `「✿」 DERROTA EN LA RULETA 🥀\n\n` +
                                 `₊˚ˑ༄ La esfera cayó en: ${emojiColor} *${numero} (${colorResultado.toUpperCase()})*\n` +
                                 `❀ 🎯 *Tu elección:* \`${colorApuesta.toUpperCase()}\`\n` +
                                 `❀ 💸 *Fondos perdidos:* \`-$${apuestaF} Bolívares\`\n` +
                                 `───────────────────\n` +
                                 `❀ _¡La casa de Yuki siempre gana! Inténtalo de nuevo._ 📉`;

                    await sock.sendMessage(jid, { text, mentions: [sender] }, { quoted: m });
                });
            }
        });
    }
};
