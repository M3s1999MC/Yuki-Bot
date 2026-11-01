const db = require('../database/db');

const pendingDuels = new Map();
const DUEL_TIMEOUT_MS = 45_000;

function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) return reject(err);
            resolve(this);
        });
    });
}

function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

function addPendingDuel(duel) {
    const timer = setTimeout(() => {
        if (pendingDuels.get(duel.id) !== entry) return;
        pendingDuels.delete(duel.id);
        duel.sock.sendMessage(duel.chatJid, {
            text: `「✿」 El reto de @${duel.opponent.split('@')[0]} expiró. No se modificó ningún saldo.`,
            mentions: [duel.opponent]
        }, { quoted: duel.challengeKey }).catch(err => {
            console.error('No se pudo anunciar la expiración del duelo:', err.message);
        });
    }, DUEL_TIMEOUT_MS);
    const entry = { ...duel, timer };
    pendingDuels.set(duel.id, entry);
}

async function settleDuel(duel, sock, responseMessage) {
    let result;
    await run('BEGIN IMMEDIATE');
    try {
        const users = await all(
            'SELECT jid, wallet FROM users WHERE jid IN (?, ?)',
            [duel.challenger, duel.opponent]
        );
        const balances = new Map(users.map(user => [user.jid, Number(user.wallet) || 0]));
        if ((balances.get(duel.challenger) || 0) < duel.amount) {
            throw new Error('El retador ya no tiene saldo suficiente; el duelo fue cancelado.');
        }
        if ((balances.get(duel.opponent) || 0) < duel.amount) {
            throw new Error('No tienes saldo suficiente para aceptar; el duelo fue cancelado.');
        }

        const winner = Math.random() < 0.5 ? duel.challenger : duel.opponent;
        const loser = winner === duel.challenger ? duel.opponent : duel.challenger;
        const debit = await run(
            'UPDATE users SET wallet = wallet - ? WHERE jid = ? AND wallet >= ?',
            [duel.amount, loser, duel.amount]
        );
        if (!debit.changes) throw new Error('El saldo del perdedor cambió; el duelo fue cancelado.');

        const credit = await run(
            'UPDATE users SET wallet = wallet + ? WHERE jid = ? AND wallet <= ?',
            [duel.amount, winner, Number.MAX_SAFE_INTEGER - duel.amount]
        );
        if (!credit.changes) throw new Error('No se pudo acreditar el premio; el duelo fue cancelado.');

        await run('COMMIT');
        result = { winner, loser };
    } catch (err) {
        try {
            await run('ROLLBACK');
        } catch (rollbackErr) {
            console.error('Error al revertir la transacción del duelo:', rollbackErr.message);
        }
        await sock.sendMessage(duel.chatJid, {
            text: `「✿」 ${err.message} No se modificaron los saldos.`,
            mentions: [duel.challenger, duel.opponent]
        }, { quoted: responseMessage });
        return;
    }

    try {
        await sock.sendMessage(duel.chatJid, {
            text: `「✿」 ¡Duelo terminado! 🎲\n\n🏆 Ganador: @${result.winner.split('@')[0]}\n💸 Perdedor: @${result.loser.split('@')[0]}\n🪙 Apuesta transferida: *$${duel.amount.toLocaleString('es-CO')}*`,
            mentions: [result.winner, result.loser]
        }, { quoted: responseMessage });
    } catch (sendErr) {
        console.error('El duelo se liquidó, pero no se pudo anunciar el resultado:', sendErr.message);
    }
}

async function respondToDuel({ id, chatJid, responder, action, sock, responseMessage }) {
    const duel = pendingDuels.get(id);
    if (!duel || duel.chatJid !== chatJid) {
        return sock.sendMessage(chatJid, {
            text: '「✿」 Ese reto no existe o ya expiró.'
        }, { quoted: responseMessage });
    }
    if (duel.opponent !== responder) {
        return sock.sendMessage(chatJid, {
            text: '「✿」 Solo la persona mencionada puede responder a este reto.'
        }, { quoted: responseMessage });
    }

    clearTimeout(duel.timer);
    pendingDuels.delete(id);
    if (action === 'rechazar') {
        return sock.sendMessage(chatJid, {
            text: `「✿」 @${responder.split('@')[0]} rechazó el reto. No se modificó ningún saldo.`,
            mentions: [responder]
        }, { quoted: responseMessage });
    }
    if (action !== 'aceptar') return;

    await settleDuel(duel, sock, responseMessage);
}

module.exports = { addPendingDuel, respondToDuel };
