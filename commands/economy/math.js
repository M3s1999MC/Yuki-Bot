const economy = require('../../utils/economy');
const game = require('../../utils/mathGame');
const { claim, formatDuration } = require('../../utils/cooldowns');
const { reply, senderJid } = require('../../utils/commandHelpers');

module.exports = {
    name: 'math',
    aliases: ['mates'],
    category: 'economy',
    description: 'Juego de matemáticas: !math [facil|medio|dificil|imposible] y responde con !math <resultado>',

    async execute(sock, m, args, usedPrefix = '!') {
        const chat = m.key.remoteJid;
        const jid = senderJid(m, sock);
        const first = String((args || [])[0] || '').trim();

        try {
            if (/^-?\d+$/.test(first)) {
                const current = game.getSession(chat, jid);
                if (!current) {
                    return reply(sock, m, `「✿」 SIN RETO ACTIVO 🥀\n\n₊˚ˑ༄ No tienes un problema matemático pendiente. Empieza con *${usedPrefix}math* 🌸`);
                }

                game.endSession(chat, jid);

                if (current.expired) {
                    return reply(sock, m, `「✿」 TIEMPO AGOTADO ⏳\n\n₊˚ˑ༄ Se acabó el tiempo. La respuesta correcta era *${current.session.answer}*.`);
                }

                const { session } = current;

                if (Number(first) !== session.answer) {
                    return reply(sock, m, `「✿」 RESPUESTA INCORRECTA ❌\n\n₊˚ˑ༄ Te equivoqué de cálculo. La respuesta era *${session.answer}*.`);
                }

                const reward = game.DIFFICULTIES[session.difficulty].reward;
                await economy.credit(jid, reward);
                await economy.addExp(jid, 10);

                const rewardF = reward.toLocaleString('es-CO');

                return reply(sock, m, 
                    `「✿」 ¡CÁLCULO CORRECTO! ✅✨\n\n` +
                    `₊˚ˑ༄ ¡Has resuelto el problema con éxito!\n` +
                    `❀ 💰 *Recompensa:* \`+$${rewardF} Bolívares\`\n` +
                    `❀ ✨ *Experiencia:* \`+10 XP\`\n` +
                    `───────────────────\n` +
                    `❀ _¡Una mente brillante en la red de Yuki!_ 🌸`,
                    [jid]
                );
            }

            const difficulty = game.normalizeDifficulty(first);
            if (!difficulty) {
                return reply(sock, m, 
                    `「✿」 MINIJUEGO DE MATEMÁTICAS 🧮✨\n\n` +
                    `₊˚ˑ༄ Elige una dificultad para poner a prueba tu intelecto:\n` +
                    `❀ *Niveles:* \`facil\`, \`medio\`, \`dificil\`, \`imposible\`\n` +
                    `❀ *Uso:* \`${usedPrefix}math <dificultad>\`\n` +
                    `❀ *Ejemplo:* \`${usedPrefix}math medio\` 🌸`
                );
            }

            const current = game.getSession(chat, jid);
            if (current && !current.expired) {
                return reply(sock, m, 
                    `「✿」 RETO EN CURSO ⏳\n\n` +
                    `₊˚ˑ༄ Ya tienes un problema activo:\n` +
                    `❀ *Operación:* \`${current.session.text} = ?\`\n` +
                    `❀ Responde con *${usedPrefix}math <resultado>* 🌸`
                );
            }

            await economy.ensureUser(jid);
            const cooldown = await claim(jid, 'math', 20000);

            if (!cooldown.ok) {
                const remainingFormatted = formatDuration(cooldown.remainingMs);
                return reply(sock, m, `「✿」 COOLDOWN ACTIVO ⏳\n\n₊˚ˑ༄ Espera *${remainingFormatted}* para resolver otro problema matemático.`);
            }

            const session = game.startSession(chat, jid, difficulty);
            const info = game.DIFFICULTIES[difficulty];
            const rewardF = info.reward.toLocaleString('es-CO');

            return reply(sock, m, 
                `「✿」 RETO MATEMÁTICO // ${info.label.toUpperCase()} 🧮✨\n\n` +
                `₊˚ˑ༄ Resuelve la siguiente operación:\n` +
                `❀ *Problema:* \`${session.text} = ?\`\n` +
                `❀ ⏱️ *Tiempo límite:* 30 segundos\n` +
                `❀ 💰 *Premio:* \`$${rewardF} Bolívares\`\n` +
                `───────────────────\n` +
                `❀ _Responde con_ \`${usedPrefix}math <resultado>\` 🌸`
            );

        } catch (error) {
            console.error('Error en !math:', error.message);
            return reply(sock, m, '「✿」 ERROR DE RED // No pude procesar el juego matemático; inténtalo de nuevo en un momento. 🥀');
        }
    }
};
