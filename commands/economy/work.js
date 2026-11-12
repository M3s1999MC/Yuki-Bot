module.exports = {
    name: 'work',
    aliases: ['w', 'trabajar'],
    category: 'economy',
    description: 'Trabaja para ganar dinero.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const earnings = Math.floor(Math.random() * 500) + 200;

        const trabajos = [
            'repostero de pasteles de fresa',
            'asistente en la librería de Akihabara',
            'repartidor de ramen a domicilio',
            'organizador de estanterías en el supermercado'
        ];
        const trabajoElegido = trabajos[Math.floor(Math.random() * trabajos.length)];

        const text = `(「✿」 "JORNADA DE TRABAJO COMPLETADA"🌸)\n\n` +
                     `🌸 Trabajaste duro como *${trabajoElegido}*.\n` +
                     `💰 Ganancia obtenida: *+¥${earnings.toLocaleString()}*`;

        await sock.sendMessage(jid, { text }, { quoted: m });
    }
};
