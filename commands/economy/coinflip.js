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
    description: 'Apuesta monedas a cara o cruz: !coinflip <cantidad|all> <cara|cruz>',
    parseBet,

    async execute(sock, m, args, usedPrefix = '!') {
        const jid = senderJid(m, sock);
        try {
            const wallet = await economy.getWallet(jid);
            const { side, amount } = parseBet(args || [], wallet);
            if (!side || !amount || amount <= 0) {
                return reply(sock, m, `「✿」 Uso: *${usedPrefix}coinflip <cantidad|all> <cara|cruz>*. Ejemplo: ${usedPrefix}coinflip 500 cara`);
            }
            if (amount > wallet) return reply(sock, m, `「✿」 No tienes tanto en la billetera (${economy.money(wallet)}).`);

            const cooldown = await claim(jid, 'coinflip', 8000);
            if (!cooldown.ok) return reply(sock, m, `「✿」 ⏳ Espera *${formatDuration(cooldown.remainingMs)}* para otra moneda.`);
            if (!(await economy.debit(jid, amount))) {
                await release(jid, 'coinflip').catch(() => {});
                return reply(sock, m, '「✿」 Tu saldo cambió; inténtalo de nuevo.');
            }

            const result = Math.random() < 0.5 ? 'cara' : 'cruz';
            if (result === side) {
                await economy.credit(jid, amount * 2);
                return reply(sock, m, `「✿」 🪙 Salió *${result}*. ¡Ganaste *+${economy.money(amount)}*! 🌸`);
            }
            return reply(sock, m, `「✿」 🪙 Salió *${result}*. Perdiste *${economy.money(amount)}*.`);
        } catch (error) {
            console.error('Error en !coinflip:', error.message);
            return reply(sock, m, '「✿」 No pude lanzar la moneda; inténtalo de nuevo en un momento.');
        }
    }
};
