function normalizeUserJid(jid) {
    if (typeof jid !== 'string' || !jid) return null;
    return jid.replace(/:([^@]+)(?=@)/, '');
}

function getMessageSenderJid(message, sock) {
    const key = message?.key || {};
    if (key.fromMe) {
        return normalizeUserJid(sock?.user?.id || key.participantAlt || key.participant);
    }

    const candidates = [
        key.participantAlt,
        key.participant,
        key.remoteJidAlt,
        key.remoteJid
    ].filter(value => typeof value === 'string' && value);

    return normalizeUserJid(
        candidates.find(jid => jid.endsWith('@s.whatsapp.net')) || candidates[0]
    );
}

function getBalanceTargetJid(message, sock) {
    const context = message?.message?.extendedTextMessage?.contextInfo;
    const mentionedJid = context?.mentionedJid?.find(jid => typeof jid === 'string' && jid);
    if (mentionedJid) return normalizeUserJid(mentionedJid);
    if (typeof context?.participant === 'string' && context.participant) {
        return normalizeUserJid(context.participant);
    }
    return getMessageSenderJid(message, sock);
}

module.exports = { getBalanceTargetJid, getMessageSenderJid };
