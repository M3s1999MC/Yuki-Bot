module.exports = {
    name: 'negocios',
    aliases: ['shopnegocios', 'tiendanegocios', 'negocio', 'minegocios', 'misnegocios', 'ngmis', 'ngreclamar', 'ngcobrar'],
    category: 'economy',
    description: 'Administra, compra y cobra las ganancias de tus negocios en YukiBot-MD.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sub = args[0]?.toLowerCase();

        if (sub === 'comprar' || sub === 'ngcomprar') {
            const numero = args[1];
            if (!numero) {
                return await sock.sendMessage(jid, { text: '⚠️ Indica el número del negocio que quieres comprar. Usa `!negocios` para ver la tienda.' }, { quoted: m });
            }
            return await sock.sendMessage(jid, { text: `🏢 ¡Has comprado exitosamente el negocio #${numero}!` }, { quoted: m });
        }

        // Menú general de negocios o listado de los del usuario
        const menuNegocios = `🏢 *TIENDA Y ESTADO DE NEGOCIOS* 🏢\n\n` +
                             `1️⃣ *Cafetería Neko* - Precio: ¥50,000 (Genera ¥2,500/día)\n` +
                             `2️⃣ *Tienda de Ramen* - Precio: ¥120,000 (Genera ¥6,000/día)\n` +
                             `3️⃣ *Arcade Akihabara* - Precio: ¥300,000 (Genera ¥16,000/día)\n\n` +
                             `💡 *Comandos útiles:*\n` +
                             `• \`!negocio comprar <número>\`\n` +
                             `• \`!minegocios\` (Ver tus negocios)\n` +
                             `• \`!ngreclamar\` (Cobrar ganancias)`;

        await sock.sendMessage(jid, { text: menuNegocios }, { quoted: m });
    }
};
