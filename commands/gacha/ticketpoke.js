module.exports = {
    name: 'ticketpoke',
    aliases: ['ticketpokemon'],
    category: 'gacha',
    description: 'Usa un ticket para obtener un Pokémon eligiendo su ID.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const id = args[0];

        if (!id) {
            return await sock.sendMessage(jid, {
                text: '(「✿」 "CANJE DE TICKET POKÉMON"🌸)\n\n⚠️ Indica el ID del Pokémon que deseas reclamar.\n*Uso:* `!ticketpoke <ID>`'
            }, { quoted: m });
        }

        // TODO: Verificar que el usuario tenga >= 1 ticket_poke en inventario y asignar el Pokémon
        await sock.sendMessage(jid, {
            text: `(「✿」 "¡TICKET CANJEADO!"🌸)\n\n🎟️ Has usado 1 Ticket Pokémon y obtenido al ejemplar \`${id}\`.`
        }, { quoted: m });
    }
};
