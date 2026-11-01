module.exports = {
    name: 'tagall',
    aliases: ['todos', 'invocar'],
    adminOnly: true,
    category: 'group',
    description: 'Menciona a todos los miembros del grupo.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        if (!jid.endsWith('@g.us')) {
            return await sock.sendMessage(jid, { text: '⚠️ Este comando solo se puede usar en grupos.' }, { quoted: m });
        }

        try {
            const metadata = await sock.groupMetadata(jid);
            const participants = metadata.participants;
            const text = args.join(' ') || '¡Atención a todos!';

            let mentions = [];
            let msgText = `「✿」 *Invocación General* 🌸\n\n💬 Mensaje: _${text}_\n\n`;

            for (let p of participants) {
                mentions.push(p.id);
                msgText += `@${p.id.split('@')[0]}\n`;
            }

            await sock.sendMessage(jid, { text: msgText, mentions }, { quoted: m });
        } catch (err) {
            console.error(err);
            await sock.sendMessage(jid, { text: '❌ No se pudo realizar la mención general.' }, { quoted: m });
        }
    }
};