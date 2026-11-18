const economy = require('../../utils/economy');
const { claim, formatDuration } = require('../../utils/cooldowns');
const { reply, senderJid } = require('../../utils/commandHelpers');

const STAKE = 500; // Ajustado a la escala económica en Bolívares
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
    aliases: ['piedrapapeltijera'],
    category: 'economy',
    description: `Juega piedra, papel o tijera contra Yuki arriesgando o ganando Bolívares.`,
    outcome,

    async execute(sock, m, args, usedPrefix = '!') {
        const move = CANONICAL[String((args || [])[0] || '').toLowerCase()];
        const jid = senderJid(m, sock);

        if (!move) {
            return reply(sock, m, 
                `「✿」 PIEDRA, PAPEL O TIJERA ✊📄✂️\n\n` +
                `₊˚ˑ༄ Pon a prueba tu suerte contra el sistema de Yuki:\n` +
                `❀ *Uso:* \`${usedPrefix}ppt <piedra|papel|tijera>\`\n` +
                `❀ *Apuesta:* \`$${STAKE.toLocaleString('es-CO')} Bolívares\` 🌸`
            );
        }

        try {
            const walletActual = await economy.getWallet(jid);
            const stakeF = STAKE.toLocaleString('es-CO');

            if (walletActual < STAKE) {
                return reply(sock, m, 
                    `「✿」 FONDOS INSUFICIENTES 🥀\n\n` +
                    `₊˚ˑ༄ Necesitas al menos \`$${stakeF} Bolívares\` en tu billetera para participar en esta apuesta.\n` +
                    `❀ *Tu saldo:* \`$${walletActual.toLocaleString('es-CO')} Bolívares\` 📉`
                );
            }

            const cooldown = await claim(jid, 'ppt', 15000);
            if (!cooldown.ok) {
                const remainingFormatted = formatDuration(cooldown.remainingMs);
                return reply(sock, m, `「✿」 COOLDOWN ACTIVO ⏳\n\n₊˚ˑ༄ Espera *${remainingFormatted}* para volver a jugar.`);
            }

            const botMove = economy.pickFrom(['piedra', 'papel', 'tijera']);
            const result = outcome(move, botMove);
            const board = `${MOVES[move]} (Tú) vs ${MOVES[botMove]} (Yuki)`;

            if (result === 'tie') {
                return reply(sock, m, 
                    `「✿」 DUELO EMPATADO 🤝✨\n\n` +
                    `₊˚ˑ༄ ${board}\n` +
                    `❀ Ninguno gana ni pierde fondos en esta ronda.\n` +
                    `───────────────────\n` +
                    `❀ _¡Inténtalo de nuevo para desempatar!_ 🌸`,
                    [jid]
                );
            }

            if (result === 'win') {
                await economy.credit(jid, STAKE);
                return reply(sock, m, 
                    `「✿」 ¡VICTORIA EN EL DUELO! 🎉✨\n\n` +
                    `₊˚ˑ༄ ${board}\n` +
                    `❀ 💰 *Premio obtenido:* \`+$${stakeF} Bolívares\` 💵\n` +
                    `───────────────────\n` +
                    `❀ _¡Una excelente jugada en la red de Yuki!_ 🌸`,
                    [jid]
                );
            }

            await economy.debit(jid, STAKE);
            return reply(sock, m, 
                `「✿」 DERROTA EN EL DUELO 🥀\n\n` +
                `₊˚ˑ༄ ${board}\n` +
                `❀ 💸 *Fondos perdidos:* \`-$${stakeF} Bolívares\`\n` +
                `───────────────────\n` +
                `❀ _¡La casa de Yuki siempre cobra sus apuestas!_ 📉`,
                [jid]
            );

        } catch (error) {
            console.error('Error en !ppt:', error.message);
            return reply(sock, m, '「✿」 ERROR DE RED // No pude procesar el juego de piedra, papel o tijera. 🥀');
        }
    }
};
