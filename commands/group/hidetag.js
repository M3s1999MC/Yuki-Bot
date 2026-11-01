// hidetag.js
module.exports = {
    name: 'hidetag',
    aliases: ['tag', 'etiquetar'],
    adminOnly: true,
    category: 'group',
    description: 'Menciona en silencio a todos los usuarios del grupo.',
    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        if (!jid.endsWith('@g.us')) return;

        const metadata = await sock.groupMetadata(jid);
        const participants = metadata.participants.map(u => u.id);
        const text = args.join(' ') || '¡Atención a todos!';

        await sock.sendMessage(jid, { text, mentions: participants }, { quoted: m });
    }
};