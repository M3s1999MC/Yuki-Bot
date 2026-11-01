const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
    // Kept as a non-conflicting legacy entry; dedicated command modules own these handlers.
    name: 'tools_legacy',
    aliases: [],
    category: 'utilidades',
    description: 'Herramientas de IA, conversión de multimedia y utilidades generales.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const body = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        const commandUsed = body.slice(1).trim().split(/ +/)[0].toLowerCase();
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        // 1. !chatgpt / !ia
        if (['chatgpt', 'ia'].includes(commandUsed)) {
            const prompt = args.join(' ');
            if (!prompt) {
                return await sock.sendMessage(jid, { text: '⚠️ ¿Qué le quieres consultar a la inteligencia artificial?\n_Ejemplo:_ `!ia ¿Qué es Godot Engine?`' }, { quoted: m });
            }

            try {
                const apiRes = await fetch(`https://api.siputzx.my.id/api/ai/chatgpt?query=${encodeURIComponent(prompt)}`);
                const json = await apiRes.json();
                const respuesta = json.data || json.result || 'No obtuve respuesta de la IA.';
                await sock.sendMessage(jid, { text: `🤖 *Yuki AI*\n\n${respuesta}` }, { quoted: m });
            } catch (err) {
                await sock.sendMessage(jid, { text: '❌ Ocurrió un error al conectar con el servicio de IA.' }, { quoted: m });
            }
            return;
        }

        // 2. !say / !decir
        if (['say', 'decir'].includes(commandUsed)) {
            const textToSay = args.join(' ');
            if (!textToSay) return;
            await sock.sendMessage(jid, { text: textToSay });
            return;
        }

        // 3. !getpic / !pfp (Foto de perfil)
        if (['getpic', 'pfp'].includes(commandUsed)) {
            let targetJid = m.key.participant || m.key.remoteJid;
            if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                targetJid = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
            }

            try {
                const ppUrl = await sock.profilePictureUrl(targetJid, 'image').catch(() => 'https://i.ibb.co/L5TBy74/orihime-menu.jpg');
                const imgRes = await fetch(ppUrl);
                const buffer = Buffer.from(await imgRes.arrayBuffer());
                await sock.sendMessage(jid, { image: buffer, caption: `🖼️ Foto de perfil de @${targetJid.split('@')[0]}`, mentions: [targetJid] }, { quoted: m });
            } catch {
                await sock.sendMessage(jid, { text: '❌ No se pudo obtener la foto de perfil.' }, { quoted: m });
            }
            return;
        }

        // 4. !toimg / !toimage (Sticker a imagen)
        if (['toimg', 'toimage'].includes(commandUsed)) {
            if (!quoted || !quoted.stickerMessage) {
                return await sock.sendMessage(jid, { text: '⚠️ Por favor, responde a un sticker con el comando `!toimg` para convertirlo en imagen.' }, { quoted: m });
            }

            try {
                const buffer = await downloadMediaMessage({ message: quoted }, 'buffer', {}, { logger: console });
                await sock.sendMessage(jid, { image: buffer, caption: '🖼️ Sticker convertido a imagen' }, { quoted: m });
            } catch (err) {
                await sock.sendMessage(jid, { text: '❌ Error al convertir el sticker a imagen.' }, { quoted: m });
            }
            return;
        }

        // 5. !hd / !enhance
        if (['hd', 'enhance', 'remini'].includes(commandUsed)) {
            await sock.sendMessage(jid, { text: '✨ Función de mejora de imagen en proceso de integración. Próximamente disponible.' }, { quoted: m });
        }
    }
};