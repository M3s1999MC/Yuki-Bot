module.exports = {
    name: 'pokemonpvp',
    category: 'gacha',
    description: 'Desafía a otro usuario con tu Pokémon en combate por rondas.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const targetUser = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const apuesta = parseInt(args[1]);
        const idPokemon = args[2];

        if (!targetUser || !apuesta || !idPokemon) {
            return await sock.sendMessage(jid, {
                text: '(「✿」 "COMBATE POKÉMON PVP"🌸)\n\n⚠️ Uso correcto:\n`!pokemonpvp @usuario <apuesta> <ID>`'
            }, { quoted: m });
        }

        await sock.sendMessage(jid, {
            text: `(「✿」 "DUELO INICIADO"🌸)\n\n⚔️ El combate Pokémon contra @${targetUser.split('@')[0]} por ¥${apuesta.toLocaleString()} ha comenzado.`,
            mentions: [targetUser]
        }, { quoted: m });
    }
};
