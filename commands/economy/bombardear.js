const economy = require('../../utils/economy');
const { claim, formatDuration } = require('../../utils/cooldowns');
const { BOMB } = require('../../utils/ecoConfig');
const { COUNTRIES, findCountry } = require('../../utils/countries');
const { reply, senderJid, pickOne } = require('../../utils/commandHelpers');

const WIN_CHANCE = 0.55;
const WIN_RANGE = [500, 2500];
const LOSS_RANGE = [300, 1200];

// Es un juego de broma: las "bombas" son de confeti y globos de agua.
const wins = [
    'Tu lluvia de confeti dejó a {country} de fiesta toda la semana y cobraste los derechos del espectáculo.',
    'Tus globos de agua llegaron justo al desfile de {country}: todos rieron y te pagaron el show.',
    'La campaña de serpentinas sobre {country} fue un éxito y los organizadores te dieron un bono.'
];
const losses = [
    'En {country} te devolvieron los globos de agua y tuviste que pagar la lavandería.',
    'El viento llevó tu confeti lejos de {country} y perdiste el depósito del equipo.',
    'Los vecinos de {country} contraatacaron con espuma y pagaste los daños.'
];

module.exports = {
    name: 'bombardear',
    aliases: ['bomb'],
    category: 'economy',
    description: 'Lanza una lluvia de confeti sobre un país (hay 193): puedes ganar la batalla y dinero, o perder y pagar los daños (cada 30 minutos)',

    async execute(sock, m, args, usedPrefix = '!') {
        const jid = senderJid(m, sock);
        try {
            const query = args.join(' ').trim();
            let country;
            if (query) {
                country = findCountry(query);
                if (!country) {
                    return reply(sock, m, `「✿」 No encontré ese país 🌍 Hay ${COUNTRIES.length}; prueba con *${usedPrefix}bombardear Chile* o sin país para elegir uno al azar.`);
                }
            } else {
                country = pickOne(COUNTRIES);
            }

            await economy.ensureUser(jid);
            const cooldown = await claim(jid, BOMB.key, BOMB.ms);
            if (!cooldown.ok) {
                return reply(sock, m, `「✿」 ⏳ Tu flota de confeti se está recargando. Vuelve en *${formatDuration(cooldown.remainingMs)}*.`);
            }

            if (Math.random() < WIN_CHANCE) {
                const gain = economy.rollBetween(...WIN_RANGE);
                await economy.credit(jid, gain);
                return reply(sock, m, `「✿」 🎉 *${country}*\n${pickOne(wins).replace('{country}', country)}\n\n*+${economy.money(gain)}* 🌸`);
            }
            const lost = await economy.debitUpTo(jid, economy.rollBetween(...LOSS_RANGE));
            const extra = lost > 0 ? `\n\n*-${economy.money(lost)}* 💸` : '\n\nPor suerte no tenías nada que perder. 😅';
            return reply(sock, m, `「✿」 💦 *${country}*\n${pickOne(losses).replace('{country}', country)}${extra}`);
        } catch (error) {
            console.error('Error en !bombardear:', error.message);
            return reply(sock, m, '「✿」 No pude lanzar el ataque; inténtalo de nuevo en un momento.');
        }
    }
};
