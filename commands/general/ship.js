const M = require('../../utils/marriage');

module.exports = {
    name: 'ship',
    category: 'social',
    description: 'Calcula la compatibilidad entre dos personas.',

    async execute(sock, m) {
        const jid = m.key.remoteJid;
        const ctx = m.message?.extendedTextMessage?.contextInfo;
        let [a, b] = ctx?.mentionedJid || [];

        if (!a || !b) {
            if (!jid.endsWith('@g.us'))
                return sock.sendMessage(jid, { text: '「✿」 Uso: !ship @user1 @user2' }, { quoted: m });

            const meta = await sock.groupMetadata(jid);
            const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const pool = meta.participants.map(p => p.id).filter(id => id !== botId);
            const pick = (exclude) => {
                const list = pool.filter(x => x !== exclude);
                return list[Math.floor(Math.random() * list.length)];
            };
            if (!a) a = pick(b);
            if (!b) b = pick(a);
        }

        const pct = Math.floor(Math.random() * 101);
        const bar = '█'.repeat(Math.round(pct / 10)).padEnd(10, '░');
        sock.sendMessage(jid, {
            text: `「✿」 💘 *SHIP*\n${M.tag(a)} ❤️ ${M.tag(b)}\n\n[${bar}] ${pct}%`,
            mentions: [a, b],
        }, { quoted: m });
    }
};