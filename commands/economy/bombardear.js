module.exports = {
    name: 'bombardear',
    aliases: ['bomb'],
    category: 'economy',
    description: 'Bombardea un país con riesgo de ganar o pagar daños.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const paises = ['Japón', 'Colombia', 'México', 'España', 'Argentina', 'Brasil'];
        const objetivo = args.join(' ') || paises[Math.floor(Math.random() * paises.length)];
        const victoria = Math.random() > 0.45;

        if (victoria) {
            const botin = Math.floor(Math.random() * 2500) + 800;
            await sock.sendMessage(jid, {
                text: `(「✿」 "ATAQUE EXITOSO"🌸)\n\n🚀 Saqueaste con éxito las reservas de **${objetivo}**.\n💰 Botín: *+¥${botin.toLocaleString()}*.`
            }, { quoted: m });
        } else {
            const multa = Math.floor(Math.random() * 1500) + 500;
            await sock.sendMessage(jid, {
                text: `(「✿」 "DEFENSAS ACTIVADAS"🌸)\n\n🛡️ Las defensas de **${objetivo}** repelieron el ataque.\n💸 Pagaste daños por *-¥${multa.toLocaleString()}*.`
            }, { quoted: m });
        }
    }
};
