module.exports = {
    name: 'confesion',
    alias: ['confesar'],
    desc: 'Genera una confesión absurda al azar',
    run: async (sock, m) => {
        const confesiones = [
            'Confieso que una vez me comí un borrador pensando que era un dulce.',
            'Confieso que duermo con la luz prendida si veo un sticker raro.',
            'Confieso que le hablo a las plantas cuando nadie me ve.',
            'Confieso que le dije a mi mamá que hice la tarea cuando solo copié la portada.'
        ];
        const random = confesiones[Math.floor(Math.random() * confesiones.length)];
        await sock.sendMessage(m.key.remoteJid, { text: `💬 *CONFESIÓN ANÓNIMA:* ${random}` }, { quoted: m });
    }
};
