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
                if (!current) return reply(sock, m, `「✿」 No tienes un problema activo. Empieza con *${usedPrefix}math*.`);
                game.endSession(chat, jid);
                if (current.expired) return reply(sock, m, `「✿」 ⌛ Se acabó el tiempo. Era *${current.session.answer}*.`);
                const { session } = current;
                if (Number(first) !== session.answer) return reply(sock, m, `「✿」 ❌ Incorrecto. La respuesta era *${session.answer}*.`);
                const reward = game.DIFFICULTIES[session.difficulty].reward;
                await economy.credit(jid, reward);
                await economy.addExp(jid, 10);
                return reply(sock, m, `「✿」 ✅ ¡Correcto! *+${economy.money(reward)}* y +10 XP 🌸`);
            }

            const difficulty = game.normalizeDifficulty(first);
            if (!difficulty) return reply(sock, m, `「✿」 Dificultades: facil, medio, dificil, imposible. Ejemplo: ${usedPrefix}math dificil`);

            const current = game.getSession(chat, jid);
            if (current && !current.expired) {
                return reply(sock, m, `「✿」 Ya tienes un problema: *${current.session.text} = ?*\nResponde con *${usedPrefix}math <resultado>*`);
            }
            await economy.ensureUser(jid);
            const cooldown = await claim(jid, 'math', 20000);
            if (!cooldown.ok) return reply(sock, m, `「✿」 ⏳ Espera *${formatDuration(cooldown.remainingMs)}* para otro problema.`);

            const session = game.startSession(chat, jid, difficulty);
            const info = game.DIFFICULTIES[difficulty];
            return reply(sock, m, `「✿」 🧮 *Matemáticas (${info.label})*\n\n*${session.text} = ?*\n\nResponde con *${usedPrefix}math <resultado>* en 30 segundos. Premio: ${economy.money(info.reward)}.`);
        } catch (error) {
            console.error('Error en !math:', error.message);
            return reply(sock, m, '「✿」 No pude procesar el juego; inténtalo de nuevo en un momento.');
        }
    }
};
