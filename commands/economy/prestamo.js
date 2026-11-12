module.exports = {
    name: 'prestamo',
    aliases: ['préstamo', 'loan', 'prestar', 'pagardeuda', 'pagarprestamo'],
    category: 'economy',
    description: 'Solicita un préstamo al banco de Yuki.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const subCommand = args[0]?.toLowerCase();

        if (subCommand === 'estado') {
            return await sock.sendMessage(jid, { 
                text: '(「✿」 "ESTADO DE CREDITO"🌸)\n\n❌ No tienes ninguna deuda activa con el Banco Central de Yuki.' 
            }, { quoted: m });
        }

        if (subCommand === 'pagar') {
            return await sock.sendMessage(jid, { 
                text: '(「✿」 "DEUDA SALDADA"🌸)\n\n💸 Has pagado por completo tu préstamo al banco. ¡Tu historial crediticio está limpio!' 
            }, { quoted: m });
        }

        const monto = parseInt(args[0]);
        if (!monto || isNaN(monto)) {
            return await sock.sendMessage(jid, { 
                text: '(「✿」 "BANCO CENTRAL DE YUKI"🌸)\n\n⚠️ Indica la cantidad que deseas pedir.\n*Uso:* `!prestamo <monto>` o `!prestamo estado`' 
            }, { quoted: m });
        }

        await sock.sendMessage(jid, { 
            text: `(「✿」 "PRÉSTAMO APROBADO"🌸)\n\n💰 Se han depositado *¥${monto.toLocaleString()}* en tu billetera.\n⏳ Tienes un plazo de 6 días para pagar.` 
        }, { quoted: m });
    }
};
