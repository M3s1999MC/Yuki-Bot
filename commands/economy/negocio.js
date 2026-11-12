module.exports = {
    name: 'negocios',
    aliases: ['shopnegocios', 'tiendanegocios', 'negocio', 'minegocios', 'misnegocios', 'ngmis', 'ngreclamar', 'ngcobrar'],
    category: 'economy',
    description: 'Administra y compra negocios.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        
        const menuNegocios = `(「✿」 "GESTIÓN EMPRESARIAL"🌸)\n\n` +
                             `1️⃣ *Cafetería Neko* - Precio: ¥50,000\n` +
                             `2️⃣ *Tienda de Ramen* - Precio: ¥120,000\n` +
                             `3️⃣ *Arcade Akihabara* - Precio: ¥300,000\n\n` +
                             `💡 *Uso:* \`!negocio comprar <número>\` o \`!minegocios\``;

        await sock.sendMessage(jid, { text: menuNegocios }, { quoted: m });
    }
};
