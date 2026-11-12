// utils/owners.js
// Yuki no tenía un concepto de "owner". Se define así:
//   - el propio número del bot (mensajes con key.fromMe), y
//   - los números de la variable de entorno YUKI_OWNERS (separados por comas, solo dígitos con código de país).
function ownerNumbers() {
    return String(process.env.YUKI_OWNERS || '')
        .split(',')
        .map(value => value.replace(/\D/g, ''))
        .filter(Boolean);
}

function numberOf(jid) {
    return String(jid || '').split('@')[0].split(':')[0].replace(/\D/g, '');
}

/** @param {object} m mensaje de Baileys  @param {string[]} [candidateJids] JID del remitente (PN y/o LID) */
function isOwner(sock, m, candidateJids = []) {
    if (m?.key?.fromMe) return true;
    const owners = ownerNumbers();
    const own = numberOf(sock?.user?.id);
    const numbers = candidateJids.map(numberOf).filter(Boolean);
    return numbers.some(n => owners.includes(n) || (own && n === own));
}

module.exports = { isOwner, ownerNumbers, numberOf };
