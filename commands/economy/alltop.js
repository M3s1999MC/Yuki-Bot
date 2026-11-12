module.exports = {
    name: 'alltop',
    aliases: ['tops'],
    category: 'economy',
    description: 'Ver los primeros puestos de todos los rankings.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const text = `(「✿」 "RANKINGS GLOBALES"🌸)\n\n` +
                     `💰 *Top Patrimonio*\n1. Usuario 1 — ¥1,500,000\n\n` +
                     `✨ *Top Experiencia*\n1. Usuario 2 — Nivel 45`;

        await sock.sendMessage(jid, { text }, { quoted: m });
    }
};
