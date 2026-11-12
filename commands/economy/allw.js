module.exports = {
    name: 'allw',
    aliases: ['todostrabajos'],
    category: 'economy',
    description: 'Reclama automáticamente todos los trabajos disponibles que no tengan espera.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        // Simulación de cobro masivo de oficios
        const totalGanado = 4500;

        const texto = `🛠️ *OFICINA DE EMPLEOS - RECLAMO GENERAL* 🛠️\n\n` +
                      `✨ Has reclamado los beneficios de tus turnos pendientes.\n` +
                      `💰 Ganancia total obtenida: *+¥${totalGanado.toLocaleString()}* en tu billetera.\n\n` +
                      `⏳ Los enfriamientos de cada oficio han vuelto a empezar.`;

        await sock.sendMessage(jid, { text: texto }, { quoted: m });
    }
};
