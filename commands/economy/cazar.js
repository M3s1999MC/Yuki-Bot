const db = require('../../database/db');
const { getMessageSenderJid } = require('../../utils/messageSender');

const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutos
const MIN_REWARD = 300;
const MAX_REWARD = 1200;
const SUCCESS_CHANCE = 0.65; // 65% de éxito, 35% de que se escape

function formatRemainingTime(ms) {
    const totalSeconds = Math.max(1, Math.ceil(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
}

module.exports = {
    name: 'cazar',
    aliases: ['hunt'],
    category: 'economy',
    description: 'Sal a cazar en la selva o el multiverso para ganar Bolívares.',
    cooldown: COOLDOWN_MS,

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = getMessageSenderJid(m, sock);
        const username = sender.split('@')[0];

        db.getSafeUser(sender, async (err, user) => {
            if (err || !user) {
                if (err) {
                    console.error('Error al consultar usuario en cazar:', err.message);
                }
                return await sock.sendMessage(jid, {
                    text: [
                        '🌸 ˚୨୧⋆｡˚ ⋆ *¡UPS!* ⋆ ˚｡⋆୨୧˚ 🌸',
                        '🍡 _¡Ay, se me perdió tu mapita de cazador y no pude revisar tu cuenta!_ 💦',
                        '',
                        '✦ *Estado:* Error al acceder a la economía ♡',
                        '',
                        '━━━━━━━━━━ 🌸 ━━━━━━━━━━',
                        '_Inténtalo de nuevo en un ratito, ¿sí? - Orihime 🌸_'
                    ].join('\n')
                }, { quoted: m });
            }

            // Revisar cooldown (soporta lastHunt, last_hunt o lastWork como respaldo)
            const lastHuntRaw = user.lastHunt ?? user.last_hunt ?? 0;
            const lastHunt = Number(lastHuntRaw) || 0;
            const now = Date.now();
            const elapsed = now - lastHunt;

            if (lastHunt > 0 && elapsed < COOLDOWN_MS) {
                const restante = formatRemainingTime(COOLDOWN_MS - elapsed);
                return await sock.sendMessage(jid, {
                    text: [
                        '🌸 ˚୨୧⋆｡˚ ⋆ *¡DESCANSA UN POQUITO!* ⋆ ˚｡⋆୨୧˚ 🌸',
                        `🍡 _¡Acabamos de volver del bosque, @${username}! Toma agüita y espera un ratito~_ 🍵`,
                        '',
                        `✦ *Tiempo restante:* \`${restante}\` ⏳`,
                        '━━━━━━━━━━ 🌸 ━━━━━━━━━━',
                        '♡ _¡No te canses demasiado, yo te cuido aquí!_',
                        '_Con cariño, Orihime 🌸_'
                    ].join('\n'),
                    mentions: [sender]
                }, { quoted: m });
            }

            const gano = Math.random() < SUCCESS_CHANCE;

            if (gano) {
                const reward = Math.floor(Math.random() * (MAX_REWARD - MIN_REWARD + 1)) + MIN_REWARD;

                // Actualiza billetera y guarda timestamp del cooldown (intenta lastHunt y si falla, solo wallet)
                db.run(
                    `UPDATE users SET wallet = COALESCE(wallet, 0) + ?, lastHunt = ? WHERE jid = ?`,
                    [reward, now, sender],
                    async (updateErr) => {
                        if (updateErr) {
                            console.warn('No se pudo actualizar lastHunt en cazar, intentando solo wallet:', updateErr.message);
                            return db.run(
                                `UPDATE users SET wallet = COALESCE(wallet, 0) + ? WHERE jid = ?`,
                                [reward, sender],
                                async (fallbackErr) => {
                                    if (fallbackErr) {
                                        console.error('Error al acreditar recompensa de caza:', fallbackErr.message);
                                        return await sock.sendMessage(jid, {
                                            text: '🌸 ˚୨୧⋆｡˚ ⋆ *¡UPS!* ⋆ ˚｡⋆୨୧˚ 🌸\n🍡 _¡Se me cayeron las moneditas al guardar tu botín!_ 💦'
                                        }, { quoted: m });
                                    }

                                    await sock.sendMessage(jid, {
                                        text: [
                                            '🌸 ˚୨୧⋆｡˚ ⋆ *¡CAZA EXITOSA!* ⋆ ˚｡⋆୨୧˚ 🌸',
                                            `🍡 _¡Whoa, @${username}! Entramos al bosque digital y atrapamos una criatura increíble~_ ✨`,
                                            '',
                                            `✦ *Recompensa:* \`+$${reward.toLocaleString('es-CO')} Bolívares\` 💵`,
                                            '━━━━━━━━━━ 🌸 ━━━━━━━━━━',
                                            '♡ _¡Qué buen ojo tienes! Ven a presumirme tu botín~_',
                                            '_Con emoción, Orihime 🌸_'
                                        ].join('\n'),
                                        mentions: [sender]
                                    }, { quoted: m });
                                }
                            );
                        }

                        await sock.sendMessage(jid, {
                            text: [
                                '🌸 ˚୨୧⋆｡˚ ⋆ *¡CAZA EXITOSA!* ⋆ ˚｡⋆୨୧˚ 🌸',
                                `🍡 _¡Whoa, @${username}! Entramos al bosque digital y atrapamos una criatura increíble~_ ✨`,
                                '',
                                `✦ *Recompensa:* \`+$${reward.toLocaleString('es-CO')} Bolívares\` 💵`,
                                '━━━━━━━━━━ 🌸 ━━━━━━━━━━',
                                '♡ _¡Qué buen ojo tienes! Ven a presumirme tu botín~_',
                                '_Con emoción, Orihime 🌸_'
                            ].join('\n'),
                            mentions: [sender]
                        }, { quoted: m });
                    }
                );
            } else {
                // Aun si se escapa la presa, registramos el intento para respetar el cooldown
                db.run(
                    `UPDATE users SET lastHunt = ? WHERE jid = ?`,
                    [now, sender],
                    () => {}
                );

                await sock.sendMessage(jid, {
                    text: [
                        '🌸 ˚୨୧⋆｡˚ ⋆ *¡SE ESCAPÓ!* ⋆ ˚｡⋆୨୧˚ 🌸',
                        `🍡 _¡Ay, @${username}! Nos tropezamos con una ramita y la presa salió corriendo~_ 💦`,
                        '',
                        '✦ *Recompensa:* `$0 Bolívares` 📉',
                        '━━━━━━━━━━ 🌸 ━━━━━━━━━━',
                        '♡ _¡No te me pongas triste, ¿sí? A la próxima la atrapamos juntos!_',
                        '_Te apoyo siempre, Orihime ♡_'
                    ].join('\n'),
                    mentions: [sender]
                }, { quoted: m });
            }
        });
    }
};
