// src/core/messageSender.js
const messageQueue = require('./messageQueue');

/**
 * Envia un mensaje a través de la cola de seguridad con delay aleatorio.
 * @param {Object} sock - Instancia de la conexión de Baileys.
 * @param {String} jid - ID del grupo o usuario destino.
 * @param {Object|String} content - Contenido del mensaje (objeto de Baileys o texto simple).
 * @param {Object} options - Opciones adicionales (como quoted: msg).
 */
function reply(sock, jid, content, options = {}) {
    // Si el contenido es solo un string, lo convierte al formato correcto de Baileys
    const formattedContent = typeof content === 'string' ? { text: content } : content;

    return new Promise((resolve, reject) => {
        messageQueue.add(async () => {
            try {
                const result = await sock.sendMessage(jid, formattedContent, options);
                resolve(result);
            } catch (err) {
                reject(err);
            }
        });
    });
}

module.exports = { reply };
