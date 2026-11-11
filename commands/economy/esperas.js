const economy = require('../../utils/economy');
const { remaining, formatDuration } = require('../../utils/cooldowns');
const { JOBS, cooldownKey } = require('../../utils/jobs');
const { CHEST, BOMB, TRIVIA, PERIODIC } = require('../../utils/ecoConfig');
const { reply, senderJid, targetJid, mentionTag } = require('../../utils/commandHelpers');

function line(label, ms) {
    return ms > 0 ? `⏳ ${label}: ${formatDuration(ms)}` : `✅ ${label}: disponible`;
}

// !winfo ya es del gacha, por eso este comando se llama !esperas.
module.exports = {
    name: 'esperas',
    aliases: ['cooldowns', 'espera'],
    category: 'economy',
    description: 'Ver el tiempo de espera de todos los comandos de economía: !esperas [@usuario]',

    async execute(sock, m) {
        try {
            const jid = targetJid(m) || senderJid(m, sock);
            const user = await economy.ensureUser(jid);
            const now = Date.now();

            const periodic = PERIODIC.map(item => line(item.label, Math.max(0, (Number(user[item.column]) || 0) + item.ms - now)));
            const jobs = [];
            for (const job of JOBS) jobs.push(line(job.label, await remaining(jid, cooldownKey(job), now)));
            const extras = [];
            for (const item of [CHEST, BOMB, TRIVIA]) extras.push(line(item.label, await remaining(jid, item.key, now)));

            const text = `「✿」 ⏱️ *Esperas de ${mentionTag(jid)}*\n\n*Recompensas*\n${periodic.join('\n')}\n\n*Trabajos*\n${jobs.join('\n')}\n\n*Otros*\n${extras.join('\n')}`;
            return reply(sock, m, text, [jid]);
        } catch (error) {
            console.error('Error en !esperas:', error.message);
            return reply(sock, m, '「✿」 No pude consultar las esperas; inténtalo de nuevo en un momento.');
        }
    }
};
