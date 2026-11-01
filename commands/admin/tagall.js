const { checkAdmin } = require('../../utils/permissions');

module.exports = {
    name: 'tagall_legacy',
    aliases: [],
    category: 'admin',
    description: 'Etiqueta a todos los miembros del grupo con o sin lista visible.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;

        if (!jid.endsWith('@g.us')) return;

        const body = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const prefix = '.';
        const commandUsed = body.slice(prefix.length).trim().split(/ +/)[0].toLowerCase();

        const { isUserAdmin, metadata } = await checkAdmin(sock, jid, sender);

        if (!isUserAdmin) {
            return await sock.sendMessage(jid, { text: '⚠️ Comando exclusivo para Administradores.' }, { quoted: m });
        }

        const participants = metadata?.participants || [];
        const mentions = participants.map(p => p.id);
        const textMessage = args.join(' ') || '📢 *Aviso general para el grupo*';

        // --- HIDETAG / TAG / ETIQUETAR (Sin lista explícita) ---
        if (['hidetag', 'tag', 'etiquetar'].includes(commandUsed)) {
            return await sock.sendMessage(jid, { text: textMessage, mentions }, { quoted: m });
        }

        // --- TAGALL / TODOS / INVOCAR (Con lista) ---
        let tagMsg = `📣 *LLAMADO A TODOS LOS MIEMBROS* 📣\n📝 *Mensaje:* ${textMessage}\n\n`;
        participants.forEach((p, idx) => {
            tagMsg += `${idx + 1}. @${p.id.split('@')[0]}\n`;
        });

        await sock.sendMessage(jid, { text: tagMsg, mentions }, { quoted: m });
    }
};