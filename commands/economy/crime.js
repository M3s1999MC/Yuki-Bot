module.exports = {
    name: 'crime',
    aliases: ['crimen'],
    category: 'economy',
    description: 'Comete un crimen para ganar dinero (con riesgo).',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const success = Math.random() > 0.4;

        if (success) {
            const reward = Math.floor(Math.random() * 2000) + 1000;
            await sock.sendMessage(jid, { 
                text: `(「✿」 "GOLPE DELICTIVO EXITOSO"🌸)\n\n🦹‍♂️ Lograste saquear el distrito comercial sin dejar rastro.\n💰 Botín: *+¥${reward.toLocaleString()}*` 
            }, { quoted: m });
        } else {
            const fine = Math.floor(Math.random() * 1000) + 500;
            await sock.sendMessage(jid, { 
                text: `(「✿」 "¡OPERACIÓN FRACASADA!"🌸)\n\n🚨 ¡La policía te atrapó huyendo de la escena!\n💸 Multa pagada: *-¥${fine.toLocaleString()}*` 
            }, { quoted: m });
        }
    }
};
