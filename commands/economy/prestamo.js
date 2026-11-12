module.exports = {
    name: 'prestamo',
    aliases: ['préstamo', 'loan', 'prestar', 'pagardeuda', 'pagarprestamo'],
    category: 'economy',
    description: 'Solicita un préstamo al banco o paga tus deudas pendientes.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const subCommand = args[0]?.toLowerCase();

        if (subCommand === 'estado') {
            return await sock.sendMessage(jid, { 
                text: '🏦 *ESTADO DE TU PRÉSTAMO*\n\n❌ No tienes ninguna deuda activa con el Banco Central de Yuki.' 
            }, { quoted: m });
        }

        if (subCommand === 'pagar') {
            return await sock.sendMessage(jid, { 
                text: '💸 Has saldado tu deuda por completo con el banco. ¡Tu historial crediticio está limpio!' 
            }, { quoted: m });
        }

        const monto = parseInt(args[0]);
        if (!monto || isNaN(monto)) {
            return await sock.sendMessage(jid, { 
                text: '⚠️ Por favor indica la cantidad que deseas pedir.\n\n*Uso correcto:* `!prestamo <monto>` o `!prestamo estado` o `!prestamo pagar`' 
            }, { quoted: m });
        }

        if (monto > 500000) {
            return await sock.sendMessage(jid, { text: '❌ El límite máximo de préstamo para tu nivel actual es de ¥500,000.' }, { quoted: m });
        }

        await sock.sendMessage(jid, { 
            text: `✅ ¡Préstamo aprobado con éxito!\n\n💰 Se han depositado *¥${monto.toLocaleString()}* en tu billetera.\n⏳ Tienes un plazo máximo de 6 días para pagarlo.` 
        }, { quoted: m });
    }
};
