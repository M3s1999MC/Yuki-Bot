module.exports = {
    name: 'futuro',
    alias: ['destino'],
    desc: 'Predice tu vida en 10 años de forma absurda',
    run: async (sock, m) => {
        const jid = m.key.participant || m.key.remoteJid;
        const pred = [
            'serás el dueño de una granja de gatos galácticos.',
            'serás un famoso creador de memes retirado en una isla.',
            'terminarás trabajando testeando videojuegos retro todo el día.'
        ];
        const res = pred[Math.floor(Math.random() * pred.length)];
        await sock.sendMessage(m.key.remoteJid, { 
            text: `🔮 *EL DESTINO REVELA:* En 10 años @${jid.split('@')[0]} ${res}`,
            mentions: [jid]
        }, { quoted: m });
    }
};
