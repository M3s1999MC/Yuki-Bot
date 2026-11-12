module.exports = {
    name: 'monthly',
    category: 'economy',
    description: 'Reclama tu recompensa mensual.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const recompensa = 50000;

        await sock.sendMessage(jid, {
            text: `(「✿」 "SUELDO MENSUAL"🌸)\n\n🗓️ Has recibido tu pago mensual de *+¥${recompensa.toLocaleString()}*.`
        }, { quoted: m });
    }
};
