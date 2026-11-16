const economy = require('../../utils/economy');
const { claim, formatDuration } = require('../../utils/cooldowns');
const { reply, senderJid } = require('../../utils/commandHelpers');

const STAKE = 200;
const MOVES = { piedra: '🪨', papel: '📄', tijera: '✂️', tijeras: '✂️', rock: '🪨', paper: '📄', scissors: '✂️' };
const CANONICAL = { piedra: 'piedra', papel: 'papel', tijera: 'tijera', tijeras: 'tijera', rock: 'piedra', paper: 'papel', scissors: 'tijera' };
const BEATS = { piedra: 'tijera', papel: 'piedra', tijera: 'papel' };

/** @returns {'win'|'lose'|'tie'} desde el punto de vista del jugador */
function outcome(player, bot) {
    if (player === bot) return 'tie';
    return BEATS[player] === bot ? 'win' : 'lose';
}

module.exports = {
    name: 'ppt',
    aliases: [],
    category: 'economy',
    description: `Piedra, papel o tijera contra el bot: ganas o pierdes ${STAKE} monedas`,
    outcome,

    async execute(sock, m, args, usedPrefix = '!') {
        const move = CANONICAL[String((args || [])[0] || '').toLowerCase()];
        if (!move) return reply(sock, m, `「✿」 Uso: *${usedPrefix}ppt <piedra|papel|tijera>*`);
        const jid = senderJid(m, sock);
        try {
            if ((await economy.getWallet(jid)) < STAKE) return reply(sock, m, `「✿」 Necesitas ${economy.money(STAKE)} en tu billetera para jugar.`);
            const cooldown = await claim(jid, 'ppt', 15000);
            if (!cooldown.ok) return reply(sock, m, `「✿」 ⏳ Espera *${formatDuration(cooldown.remainingMs)}* para jugar otra vez.`);

            const botMove = economy.pickFrom(['piedra', 'papel', 'tijera']);
            const result = outcome(move, botMove);
            const board = `${MOVES[move]} vs ${MOVES[botMove]}`;
            if (result === 'tie') return reply(sock, m, `「✿」 ${board}\nEmpate: nadie gana ni pierde. 🤝`);
            if (result === 'win') {
                await economy.credit(jid, STAKE);
                return reply(sock, m, `「✿」 ${board}\n¡Ganaste! *+${economy.money(STAKE)}* 🌸`);
            }
            await economy.debit(jid, STAKE);
            return reply(sock, m, `「✿」 ${board}\nPerdiste *${economy.money(STAKE)}*.`);
        } catch (error) {
            console.error('Error en !ppt:', error.message);
            return reply(sock, m, '「✿」 No pude jugar; inténtalo de nuevo en un momento.');
        }
    }
};
