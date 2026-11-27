const { trackBotSentMessage } = require('../../handlers/aiChat');

const clipCounts = new Map();

function extractQuotedInfo(m) {
    const ctx = m?.message?.extendedTextMessage?.contextInfo;
    const quoted = ctx?.quotedMessage;
    if (!quoted) return null;

    const text =
        quoted.conversation ||
        quoted.extendedTextMessage?.text ||
        quoted.imageMessage?.caption ||
        quoted.videoMessage?.caption ||
        '';

    const rawSender = ctx.participant || '';
    const senderLabel = rawSender ? `@${rawSender.split('@')[0].split(':')[0]}` : 'Alguien del grupo';

    return {
        text: text.trim(),
        senderJid: rawSender || null,
        senderLabel
    };
}

function incrementClipCount(jid, key) {
    const mapKey = `${jid}:${key}`;
    const next = (clipCounts.get(mapKey) || 0) + 1;
    clipCounts.set(mapKey, next);
    return next;
}

module.exports = {
    name: 'corte',
    aliases: ['clipchat'],
    category: 'dinamicas',
    description: 'Guarda y destaca una frase o momento del chat.',

    async execute(sock, m, args = []) {
        const jid = m?.key?.remoteJid;
        if (!jid) return;

        try {
            if (typeof sock.sendPresenceUpdate === 'function') {
                await sock.sendPresenceUpdate('composing', jid).catch(() => {});
            }

            const quotedInfo = extractQuotedInfo(m);
            const argText = Array.isArray(args) ? args.join(' ').trim() : '';
            const quoteText = argText || quotedInfo?.text || '';

            if (!quoteText) {
                const msg = await sock.sendMessage(
                    jid,
                    { text: '🌸 Responde a un mensaje o escribe *!corte <frase>* para guardar el momento, ¿sí? 🍞' },
                    { quoted: m }
                );
                trackBotSentMessage?.(msg?.key);
                return;
            }

            const authorTag = quotedInfo?.senderLabel || `@${(m?.key?.participant || m?.key?.remoteJid || '').split('@')[0].split(':')[0]}`;
            const countKey = quoteText.toLowerCase().slice(0, 60);
            const times = incrementClipCount(jid, countKey);

            const mentions = [];
            if (quotedInfo?.senderJid) mentions.push(quotedInfo.senderJid);

            const reply = [
                `🎬 *Corte del grupo* ✨`,
                `💬 _"${quoteText}"_`,
                `— *Autor:* ${authorTag}`,
                `📌 *Citado:* ${times} ${times === 1 ? 'vez' : 'veces'}`
            ].join('\n');

            const sent = await sock.sendMessage(
                jid,
                { text: reply, mentions },
                { quoted: m }
            );
            trackBotSentMessage?.(sent?.key);
        } catch (err) {
            console.error('[corte] Error al crear el corte:', err.message || err);
            const errMsg = await sock.sendMessage(
                jid,
                { text: '😅 Se me cayó el guion del corte... ¿lo intentamos otra vez? 🌸' },
                { quoted: m }
            );
            trackBotSentMessage?.(errMsg?.key);
        } finally {
            if (typeof sock.sendPresenceUpdate === 'function') {
                await sock.sendPresenceUpdate('paused', jid).catch(() => {});
            }
        }
    }
};
