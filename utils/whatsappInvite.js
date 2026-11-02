function getWhatsAppInviteUrl(jid) {
    if (typeof jid !== 'string' || !jid.endsWith('@s.whatsapp.net')) return null;

    const number = jid.slice(0, jid.indexOf('@')).split(':')[0];
    if (!/^\d{7,15}$/.test(number)) return null;

    return `https://wa.me/${number}`;
}

module.exports = { getWhatsAppInviteUrl };
