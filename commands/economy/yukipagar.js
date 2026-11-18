const { listOwned, findBusiness, payUpkeep } = require('../../utils/businesses');
const { getMessageSenderJid } = require('../../utils/messageSender');

module.exports = {
    name: 'yukipagar',
    aliases: ['pagarnegocios', 'pagarmantenimiento', 'ygp'],
    category: 'economy',
    description: 'Paga el mantenimiento periódico de tus negocios y empresas en la red usando Bolívares.',

    async execute(sock, m, args, usedPrefix = '!') {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const username = sender.split('@')[0];

        try {
            const query = args[0]?.toLowerCase();
            const ownedList = await listOwned(sender);

            if (ownedList.length === 0) {
                return sock.sendMessage(jid, { 
                    text: `「✿」 SIN NEGOCIOS REGISTRADOS 🥀\n\n₊˚ˑ༄ No posees empresas en el ciberespacio para pagar mantenimiento.\n❀ *Explora el catálogo con:* \`${usedPrefix}negocios\` 🌸` 
                }, { quoted: m });
            }

            // Si pasa un argumento específico (ej: !yukipagar arepas o !yukipagar 1)
            if (query && !['todo', 'all'].includes(query)) {
                const business = findBusiness(query);
                if (!business) {
                    return sock.sendMessage(jid, { 
                        text: `「✿」 NEGOCIO NO ENCONTRADO 🥀\n\n₊˚ˑ༄ No encontré ninguna empresa con ese nombre o identificador.` 
                    }, { quoted: m });
                }

                const result = await payUpkeep(sender, business);
                if (!result.ok) {
                    if (result.reason === 'not-owned') {
                        return sock.sendMessage(jid, { text: `「✿」 ACCESO DENEGADO // No eres propietario de ese negocio. 🥀` }, { quoted: m });
                    }
                    if (result.reason === 'too-early') {
                        return sock.sendMessage(jid, { text: `「✿」 MANTENIMIENTO AL DÍA ⏳\n\n₊˚ˑ༄ Los pagos de mantenimiento para esta empresa están muy adelantados.` }, { quoted: m });
                    }
                    if (result.reason === 'funds') {
                        const costoF = Number(business.upkeep || 0).toLocaleString('es-CO');
                        return sock.sendMessage(jid, { 
                            text: `「✿」 FONDOS INSUFICIENTES 🥀\n\n₊˚ˑ༄ No tienes suficientes Bolívares para pagar el mantenimiento de ${business.emoji} *${business.name}* (\`$${costoF}\`).` 
                        }, { quoted: m });
                    }
                    return sock.sendMessage(jid, { text: `「✿」 ERROR DE RED // No pude procesar el pago en este momento. 🥀` }, { quoted: m });
                }

                const costFormatted = Number(result.cost || 0).toLocaleString('es-CO');
                const recMsg = result.recovered > 0 ? `\n❀ _¡Ganancias recuperadas: +$${Number(result.recovered).toLocaleString('es-CO')} Bolívares!_` : '';

                const text = `「✿」 MANTENIMIENTO PAGADO 🧾✨\n\n` +
                             `₊˚ˑ༄ Se ha procesado el costo operativo de tu empresa.\n` +
                             `❀ ${business.emoji} *${business.name}*: \`-$${costFormatted} Bolívares\`\n` +
                             recMsg + `\n` +
                             `───────────────────\n` +
                             `❀ _¡Tu negocio sigue operando sin interrupciones en la red de Yuki!_ 🌸`;

                return sock.sendMessage(jid, { text, mentions: [sender] }, { quoted: m });
            }

            // Si no especifica o pone "todo", intentamos pagar el mantenimiento de todos los negocios
            let totalCost = 0;
            const details = [];
            let failed = false;

            for (const { business } of ownedList) {
                const result = await payUpkeep(sender, business);
                if (result.ok) {
                    totalCost += result.cost;
                    details.push(`❀ ${business.emoji} ${business.name}: \`-$${Number(result.cost || 0).toLocaleString('es-CO')} Bolívares\``);
                } else if (result.reason === 'funds') {
                    details.push(`❀ ${business.emoji} ${business.name}: ❌ \`Fondos insuficientes\``);
                    failed = true;
                }
            }

            if (totalCost === 0 && failed) {
                return sock.sendMessage(jid, { 
                    text: `「✿」 FONDOS INSUFICIENTES 🥀\n\n₊˚ˑ༄ No tienes suficiente saldo en tu cuenta para cubrir el mantenimiento de tus negocios.` 
                }, { quoted: m });
            }

            if (details.length === 0) {
                return sock.sendMessage(jid, { 
                    text: `「✿」 EMPRESAS AL DÍA 🌸\n\n₊˚ˑ༄ Todos tus negocios en el ciberespacio ya tienen sus pagos al día.` 
                }, { quoted: m });
            }

            const totalFormatted = totalCost.toLocaleString('es-CO');

            const text = `「✿」 MANTENIMIENTO GLOBAL PROCESADO 🧾✨\n\n` +
                         `₊˚ˑ༄ Resumen de pagos de tus empresas en la red:\n\n` +
                         details.join('\n') + `\n\n` +
                         `───────────────────\n` +
                         `❀ 👤 *Propietario:* @${username}\n` +
                         `❀ 💸 *Total pagado:* \`-$${totalFormatted} Bolívares\`\n` +
                         `───────────────────\n` +
                         `❀ _¡Tu imperio empresarial marcha a la perfección en el ciberespacio!_ 🌸`;

            await sock.sendMessage(jid, { text, mentions: [sender] }, { quoted: m });

        } catch (error) {
            console.error('Error en !yukipagar:', error.message);
            return sock.sendMessage(jid, { text: '「✿」 ERROR CRÍTICO // No pude procesar el pago de mantenimiento. 🥀' }, { quoted: m });
        }
    }
};
