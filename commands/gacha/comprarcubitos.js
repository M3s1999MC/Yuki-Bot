module.exports = {
    name: 'comprarcubitos',
    aliases: ['cubitoscomprar'],
    category: 'gacha',
    description: 'Compra cubitos de fuerza para Brawlers.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const cantidad = parseInt(args[0]) || 1;
        const costo = cantidad * 2000;

        await sock.sendMessage(jid, {
            text: `(「✿」 "COMPRA DE CUBITOS"🌸)\n\n💎 Has comprado *${cantidad}x Cubito(s) de Fuerza* por ¥${costo.toLocaleString()}.`
        }, { quoted: m });
    }
};
