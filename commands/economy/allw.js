const economy = require('../../utils/economy');
const { formatDuration } = require('../../utils/cooldowns');
const { JOBS, performJob } = require('../../utils/jobs');
const { reply, senderJid } = require('../../utils/commandHelpers');

module.exports = {
    name: 'allw',
    aliases: ['todostrabajos'],
    category: 'economy',
    description: 'Reclamar todos los trabajos disponibles (respeta cada espera)',

    async execute(sock, m) {
        const jid = senderJid(m, sock);
        try {
            const lines = [];
            let total = 0;
            let shortestWait = Infinity;

            for (const job of JOBS) {
                const result = await performJob(jid, job);
                if (!result.ok) {
                    shortestWait = Math.min(shortestWait, result.remainingMs);
                    continue;
                }
                const delta = result.success ? result.amount : -result.amount;
                total += delta;
                lines.push(`${job.emoji} ${job.label}: *${delta >= 0 ? '+' : '-'}${economy.money(Math.abs(delta))}*`);
            }

            if (!lines.length) {
                return reply(sock, m, `「✿」 ⏳ No hay ningún trabajo disponible ahora. El próximo estará listo en *${formatDuration(shortestWait)}*.`);
            }
            const sign = total >= 0 ? '+' : '-';
            return reply(sock, m, `「✿」 💼 *Trabajos reclamados*\n\n${lines.join('\n')}\n\n*Total: ${sign}${economy.money(Math.abs(total))}* 🌸`);
        } catch (error) {
            console.error('Error en !allw:', error.message);
            return reply(sock, m, '「✿」 No pude reclamar los trabajos; inténtalo de nuevo en un momento.');
        }
    }
};
