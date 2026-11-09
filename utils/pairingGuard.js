// utils/pairingGuard.js
// Protege la ruta pública /api/request-pairing.
//
// requestPairingCode() de Baileys sobrescribe creds.me de la sesión activa con el
// número recibido (y lo guarda) y además hace que WhatsApp envíe una notificación
// push a ese número. Por eso solo debe poder usarse mientras Yuki NO está vinculada,
// con un número válido y con un límite de intentos.

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_IP = 3;
const MAX_GLOBAL = 10;

function createPairingGuard({ now = () => Date.now(), windowMs = WINDOW_MS, maxPerIp = MAX_PER_IP, maxGlobal = MAX_GLOBAL } = {}) {
    const byIp = new Map();
    let global = [];

    function prune(list, t) {
        while (list.length && t - list[0] >= windowMs) list.shift();
        return list;
    }

    return {
        /**
         * @returns {{ok: true, phone: string} | {ok: false, status: number, error: string}}
         */
        check({ sock, phone, ip }) {
            if (!sock) {
                return { ok: false, status: 503, error: 'El bot aún no está inicializado. Espera unos segundos.' };
            }
            if (sock.authState?.creds?.registered) {
                return {
                    ok: false,
                    status: 409,
                    error: 'Yuki ya está vinculada a un número. Para cambiarlo, primero hay que desvincularla desde WhatsApp.'
                };
            }
            if (typeof phone !== 'string') {
                return { ok: false, status: 400, error: 'Número de teléfono inválido.' };
            }
            const digits = phone.replace(/\D/g, '');
            if (digits.length < 10 || digits.length > 15) {
                return { ok: false, status: 400, error: 'Número de teléfono inválido.' };
            }

            const t = now();
            const key = String(ip || 'desconocida');
            const ipList = prune(byIp.get(key) || [], t);
            global = prune(global, t);
            if (ipList.length >= maxPerIp || global.length >= maxGlobal) {
                return { ok: false, status: 429, error: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.' };
            }

            ipList.push(t);
            byIp.set(key, ipList);
            global.push(t);

            // Evita que el mapa crezca sin límite
            if (byIp.size > 1000) {
                for (const [k, list] of byIp) if (!prune(list, t).length) byIp.delete(k);
            }
            return { ok: true, phone: digits };
        }
    };
}

module.exports = { createPairingGuard, WINDOW_MS, MAX_PER_IP, MAX_GLOBAL };
