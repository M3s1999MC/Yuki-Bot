const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'invertir',
    aliases: ['inversion', 'invest'],
    category: 'economy',
    description: 'Invierte tus Bolívares en la bolsa de valores simulada de Yuki con riesgo de multiplicar o perder.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const monto = parseInt(args[0]);

        if (!monto || isNaN(monto) || monto <= 0) {
            return await sock.sendMessage(jid, { 
                text: `「✿」 MERCADO BURSÁTIL 📈\n\n` +
                      `₊˚ˑ༄ Coloca tus fondos en la bolsa de valores con riesgo de ganancia o pérdida.\n` +
                      `❀ *Uso:* \`!invertir <cantidad>\`\n` +
                      `❀ *Ejemplo:* \`!invertir 2000\` 🌸` 
            }, { quoted: m });
        }

        db.getSafeUser(sender, async (err, user) => {
            if (err || !user) {
                return sock.sendMessage(jid, { 
                    text: '「✿」 ERROR DE RED // No pude verificar tu cuenta en el sistema central. 🥀' 
                }, { quoted: m });
            }

            const walletActual = Number(user.wallet) || 0;

            if (monto > walletActual) {
                return await sock.sendMessage(jid, { 
                    text: `「✿」 FONDOS INSUFICIENTES 🥀\n\n` +
                          `₊˚ˑ༄ No tienes tantos Bolívares en tu billetera para arriesgar en la bolsa.\n` +
                          `❀ *Tu saldo:* \`$${walletActual.toLocaleString('es-CO')} Bolívares\` 📉` 
                }, { quoted: m });
            }

            // Probabilidad de éxito / fracaso bursátil (50% de ganar un multiplicador aleatorio o perder parte/todo)
            const exito = Math.random() > 0.45;

            if (exito) {
                // Multiplicador de ganancia entre x1.2 y x2.5
                const multiplicador = parseFloat((Math.random() * 1.3 + 1.2).toFixed(2));
                const gananciaNeta = Math.floor(monto * (multiplicador - 1));

                db.run(`UPDATE users SET wallet = wallet + ? WHERE jid = ?`, [gananciaNeta, sender], async (updateErr) => {
                    if (updateErr) {
                        console.error('Error al acreditar inversión:', updateErr.message);
                        return;
                    }

                    const textoExito = `「✿」 INVERSIÓN EXITOSA 📈✨\n\n` +
                                       `₊˚ˑ༄ ¡La bolsa de valores cerró en verde y tu activo se revalorizó!\n` +
                                       `❀ 📊 *Multiplicador:* \`x${multiplicador}\`\n` +
                                       `❀ 💰 *Beneficio neto:* \`+$${gananciaNeta.toLocaleString('es-CO')} Bolívares\` 💵\n` +
                                       `───────────────────\n` +
                                       `❀ _¡Un auténtico lobo de Wall Street en la red de Yuki!_ 🌸`;

                    await sock.sendMessage(jid, { text: textoExito, mentions: [sender] }, { quoted: m });
                });
            } else {
                // Pérdida parcial o total (pierde entre el 50% y el 100% de lo invertido)
                const porcentajePerdida = Math.random() > 0.5 ? 1 : 0.5;
                const perdida = Math.floor(monto * porcentajePerdida);

                db.run(`UPDATE users SET wallet = wallet - ? WHERE jid = ?`, [perdida, sender], async (updateErr) => {
                    if (updateErr) {
                        console.error('Error al descontar pérdida de inversión:', updateErr.message);
                        return;
                    }

                    const textoFallo = `「✿」 CRASH BURSÁTIL 📉🥀\n\n` +
                                       `₊˚ˑ༄ ¡El mercado se derrumbó de repente y tus acciones cayeron en picada!\n` +
                                       `❀ 💸 *Pérdida registrada:* \`-$${perdida.toLocaleString('es-CO')} Bolívares\`\n` +
                                       `───────────────────\n` +
                                       `❀ _¡Invertir conlleva sus riesgos, ten más cuidado la próxima!_ 📉`;

                    await sock.sendMessage(jid, { text: textoFallo, mentions: [sender] }, { quoted: m });
                });
            }
        });
    }
};
