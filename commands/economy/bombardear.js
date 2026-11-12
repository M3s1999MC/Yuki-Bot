module.exports = {
    name: 'bombardear',
    aliases: ['bomb'],
    category: 'economy',
    description: 'Ataca un país al azar o elegido para ganar dinero o pagar daños.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const paises = ['Japón', 'Colombia', 'México', 'España', 'Argentina', 'Brasil', 'Corea del Sur', 'Italia', 'Francia', 'Alemania', 'Canadá', 'Australia'];
        
        const objetivo = args.length > 0 
            ? args.join(' ') 
            : paises[Math.floor(Math.random() * paises.length)];

        const victoria = Math.random() > 0.45; // 55% probabilidad de éxito

        if (victoria) {
            const botin = Math.floor(Math.random() * 2500) + 800;
            await sock.sendMessage(jid, {
                text: `🚀 ¡Ataque aéreo exitoso sobre **${objetivo}**!\n\n💰 Saqueaste las reservas y ganaste **+¥${botin.toLocaleString()}**.`
            }, { quoted: m });
        } else {
            const multa = Math.floor(Math.random() * 1500) + 500;
            await sock.sendMessage(jid, {
                text: `🛡️ ¡Las defensas de **${objetivo}** derribaron tu flota!\n\n💸 Tuviste que pagar **-¥${multa.toLocaleString()}** por daños internacionales.`
            }, { quoted: m });
        }
    }
};
