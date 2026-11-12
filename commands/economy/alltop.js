module.exports = {
    name: 'alltop',
    aliases: ['tops'],
    category: 'economy',
    description: 'Muestra los primeros puestos de todos los rankings en un solo mensaje.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;

        // TODO: Consultar en Neon/Postgres los TOP 3 de cada categoría
        const topDinero = [
            { id: '573000000001@s.whatsapp.net', total: 1500000 },
            { id: '573000000002@s.whatsapp.net', total: 980000 },
            { id: '573000000003@s.whatsapp.net', total: 540000 }
        ];

        const topXp = [
            { id: '573000000002@s.whatsapp.net', nivel: 45, xp: 120500 },
            { id: '573000000001@s.whatsapp.net', nivel: 38, xp: 98400 },
            { id: '573000000004@s.whatsapp.net', nivel: 31, xp: 76200 }
        ];

        let texto = `🏆 *RANKINGS GLOBALES DE YUKI* 🏆\n\n`;

        texto += `💰 *TOP PATRIMONIO (DINERO)*\n`;
        topDinero.forEach((u, i) => {
            texto += `${i + 1}. @${u.id.split('@')[0]} — *¥${u.total.toLocaleString()}*\n`;
        });

        texto += `\n✨ *TOP EXPERIENCIA (NIVEL)*\n`;
        topXp.forEach((u, i) => {
            texto += `${i + 1}. @${u.id.split('@')[0]} — *Nivel ${u.nivel}* (${u.xp.toLocaleString()} XP)\n`;
        });

        const mentions = [...new Set([...topDinero.map(u => u.id), ...topXp.map(u => u.id)])];

        await sock.sendMessage(jid, { text: texto, mentions }, { quoted: m });
    }
};
