module.exports = {
    name: 'cantar',
    alias: ['letra'],
    desc: 'Lanza un verso aleatorio de una canción',
    run: async (sock, m) => {
        const versos = [
            '🎵 "Y no me digas más que soy el hijo de Hernández..." 🎶',
            '🎵 "Ya te vas a mejorar, ya te vas a mejorar..." 🎶',
            '🎵 "Bienvenido al circo digital..." 🎶'
        ];
        const v = versos[Math.floor(Math.random() * versos.length)];
        await sock.sendMessage(m.key.remoteJid, { text: v }, { quoted: m });
    }
};
