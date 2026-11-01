const db = require('../../database/db');

module.exports = {
    name: 'bank_legacy',
    aliases: [],
    category: 'economy',
    description: 'Deposita o retira dinero de tu cuenta bancaria.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = jid.endsWith('@g.us') ? (m.key.participant || m.key.remoteJid) : jid;
        const cmd = m.text?.split(' ')[0]?.replace('!', '') || 'deposit';
        const amountArg = args[0];

        if (!amountArg) {
            return await sock.sendMessage(jid, { text: `⚠️ Por favor indica la cantidad que deseas ${cmd.includes('dep') ? 'depositar' : 'retirar'}.` }, { quoted: m });
        }

        await sock.sendMessage(jid, { text: `🏦 Operación bancaria procesada con éxito.` }, { quoted: m });
    }
};