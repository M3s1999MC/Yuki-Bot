// utils/jobCommand.js
// Fábrica de comandos de trabajo: cada archivo de commands/economy solo indica la clave del trabajo.
const { JOBS_BY_KEY, performJob, formatJobResult } = require('./jobs');
const { reply, senderJid } = require('./commandHelpers');
const missions = require('./missions');

function makeJobCommand(key) {
    const job = JOBS_BY_KEY.get(key);
    if (!job) throw new Error(`Trabajo desconocido: ${key}`);

    return {
        name: job.name,
        aliases: job.aliases,
        category: 'economy',
        description: job.desc,

        async execute(sock, m) {
            const jid = senderJid(m, sock);
            if (!jid) return reply(sock, m, '「✿」 No pude identificarte. Inténtalo de nuevo.');
            try {
                const result = await performJob(jid, job);
                if (result.ok) await missions.track(jid, 'trabajos');
                return reply(sock, m, formatJobResult(job, result));
            } catch (error) {
                console.error(`Error en el trabajo ${job.key}:`, error.message);
                return reply(sock, m, '「✿」 No pude completar el trabajo; inténtalo de nuevo en un momento.');
            }
        }
    };
}

module.exports = { makeJobCommand };
