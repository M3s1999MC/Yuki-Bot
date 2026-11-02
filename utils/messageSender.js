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
        ...(key.remoteJid?.endsWith('@g.us') ? [] : [key.remoteJid])
    ].filter(value => typeof value === 'string' && value);

    return normalizeUserJid(
        candidates.find(jid => jid.endsWith('@s.whatsapp.net')) || candidates[0]
    );
}

function getBalanceTargetJid(message, sock) {
    const context = message?.message?.extendedTextMessage?.contextInfo;
    const mentionedJid = context?.mentionedJid?.find(jid => typeof jid === 'string' && jid);
    if (mentionedJid) return normalizeUserJid(mentionedJid);
    return getMessageSenderJid(message, sock);
}

function getMessageCountTargetJid(message, sock) {
    const context = message?.message?.extendedTextMessage?.contextInfo;
    const target = context?.mentionedJid?.find(jid => typeof jid === 'string' && jid)
        || context?.participant
        || getMessageSenderJid(message, sock);
    return normalizeUserJid(target);
}

async function getCanonicalMessageCountJid(message, sock) {
    const jid = getMessageCountTargetJid(message, sock);
    if (!jid) return null;

    const mapping = sock?.signalRepository?.lidMapping;
    if (/@(?:hosted\.)?lid$/.test(jid) && typeof mapping?.getPNForLID === 'function') {
        return normalizeUserJid(await mapping.getPNForLID(jid)) || jid;
    }

    return jid;
}

async function getMessageCountJids(message, sock) {
    const canonicalJid = await getCanonicalMessageCountJid(message, sock);
    if (!canonicalJid) return [];

    const mapping = sock?.signalRepository?.lidMapping;
    if (canonicalJid.endsWith('@s.whatsapp.net') && typeof mapping?.getLIDForPN === 'function') {
        const lid = normalizeUserJid(await mapping.getLIDForPN(canonicalJid));
        return lid ? [canonicalJid, lid] : [canonicalJid];
    }

    const originalJid = getMessageCountTargetJid(message, sock);
    return originalJid && originalJid !== canonicalJid
        ? [canonicalJid, originalJid]
        : [canonicalJid];
}

module.exports = {
    getBalanceTargetJid,
    getCanonicalMessageCountJid,
    getMessageCountJids,
    getMessageCountTargetJid,
    getMessageSenderJid
};
