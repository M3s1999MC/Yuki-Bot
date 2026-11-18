const economy = require('../../utils/economy');
const { claim, release, formatDuration } = require('../../utils/cooldowns');
const { reply, senderJid } = require('../../utils/commandHelpers');

const FACES = { cara: 'cara', heads: 'cara', cruz: 'cruz', sello: 'cruz', tails: 'cruz' };

function parseBet(args, wallet) {
    let side = null;
    let amount = null;
    for (const raw of args) {
        const word = String(raw).toLowerCase();
        if (FACES[word]) side = FACES[word];
        else if (['all', 'todo', 'todas'].includes(word)) amount = wallet;
        else if (/^\d+$/.test(word)) amount = Number(word);
    }
    return { side, amount };
}

module.exports = {
    name: 'coinflip',
    aliases: ['flip', 'cf'],
    category: 'economy',
    description: 'Apuesta tus Bolívares a cara o cruz: !coinflip <cantidad|all> <cara|cruz>',
    parseBet,

    async execute(sock, m, args, usedPrefix = '!') {
        const jid = senderJid(m, sock);
        try {
            const wallet = await economy.getWallet(jid);
            const { side, amount } = parseBet(args || [], wallet);

            if (!side || !amount || amount <= 0) {
                return reply(sock, m, 
                    `(「✿ / COINFLIP」 🪙)\n\n` +
                    `₊˚ˑ༄ Uso incorrecto del comando de apuestas.\n` +
                    `❀ *Formato:* \`${usedPrefix}coinflip <cantidad|all> <cara|cruz>\`\n` +
                    `❀ *Ejemplo:* \`${usedPrefix}coinflip 500 cara\` 🌸`
                );
            }

            if (amount > wallet) {
                const walletFormateada = typeof wallet === 'number' ? wallet.toLocaleString('es-CO') : wallet;
                return reply(sock, m, 
                    `(「✿」 "FONDOS INSUFICIENTES" 🥀)\n\n` +
                    `₊˚ˑ༄ No tienes tantos Bolívares en la billetera.\n` +
                    `❀ *Tu saldo actual:* \`$${walletFormateada} Bolívares\` 📉`
                );
            }

            const cooldown = await claim(jid, 'coinflip', 8000);
            if (!cooldown.ok) {
                return reply(sock, m, 
                    `(「✿」 "ESPERA UN MOMENTO" ⏳)\n\n` +
                    `₊˚ˑ༄ Estás lanzando monedas muy rápido.\n` +
                    `❀ Podrás volver a apostar en: *${formatDuration(cooldown.remainingMs)}* ☕`
                );
            }

            if (!(await economy.debit(jid, amount))) {
                await release(jid, 'coinflip').catch(() => {});
                return reply(sock, m, '(「✿」 "ERROR DE RED" 🥀)\n\nTu saldo cambió de último momento; inténtalo de nuevo.');
            }

            const result = Math.random() < 0.5 ? 'cara' : 'cruz';
            const cantidadFormateada = amount.toLocaleString('es-CO');

            if (result === side) {
                await economy.credit(jid, amount * 2);
                const gananciaTotal = (amount * 2).toLocaleString('es-CO');
                
                return reply(sock, m, 
                    `(「✿」 "¡VICTORIA EN COINFLIP!" 🌸)\n\n` +
                    `₊˚ˑ༄ La moneda giró y cayó en: *${result.toUpperCase()}* 🪙✨\n` +
                    `❀ *Ganancia obtenida:* \`+$${gananciaTotal} Bolívares\` 💵\n` +
                    `───────────────────\n` +
                    `❀ ¡Excelente tirada!`
                );
            }

            return reply(sock, m, 
                `(「✿」 "DERROTA EN COINFLIP" 💀📉)\n\n` +
                `₊˚ˑ༄ La moneda giró y cayó en: *${result.toUpperCase()}* 🪙\n` +
                `❀ *Perdiste en la apuesta:* \`-$${cantidadFormateada} Bolívares\` 🥀\n` +
                `───────────────────\n` +
                `❀ ¡La casa se queda con todo, tonto!`
            );

        } catch (error) {
            console.error('Error en !coinflip:', error.message);
            return reply(sock, m, '(「✿」 "ERROR CRÍTICO" 🥀)\n\nNo pude lanzar la moneda; inténtalo de nuevo en un momento.');
        }
    }
};
