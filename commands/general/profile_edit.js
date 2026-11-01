const db = require('../../database/db');

const fields = {
    setbirth: { column: 'birthday', empty: 'No registrado', label: 'cumpleaños' },
    delbirth: { column: 'birthday', empty: 'No registrado', label: 'cumpleaños' },
    setdesc: { column: 'bio', empty: 'Sin asignar', label: 'descripción' },
    setdescription: { column: 'bio', empty: 'Sin asignar', label: 'descripción' },
    deldesc: { column: 'bio', empty: 'Sin asignar', label: 'descripción' },
    deldescription: { column: 'bio', empty: 'Sin asignar', label: 'descripción' },
    sethobby: { column: 'hobby', empty: 'Sin asignar', label: 'pasatiempo' },
    setpasatiempo: { column: 'hobby', empty: 'Sin asignar', label: 'pasatiempo' },
    delhobby: { column: 'hobby', empty: 'Sin asignar', label: 'pasatiempo' },
    delpasatiempo: { column: 'hobby', empty: 'Sin asignar', label: 'pasatiempo' },
    removehobby: { column: 'hobby', empty: 'Sin asignar', label: 'pasatiempo' },
    setgenre: { column: 'gender', empty: 'Sin asignar', label: 'género' },
    delgenre: { column: 'gender', empty: 'Sin asignar', label: 'género' }
};

const deleteCommands = new Set(['delbirth', 'deldesc', 'deldescription', 'delhobby', 'delpasatiempo', 'removehobby', 'delgenre']);

module.exports = {
    name: 'profile_edit',
    aliases: Object.keys(fields),
    category: 'general',
    description: 'Modifica los datos personales de tu perfil.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        const sender = jid.endsWith('@g.us') ? (m.key.participant || jid) : jid;
        const body = m.message?.conversation ||
            m.message?.extendedTextMessage?.text ||
            m.message?.imageMessage?.caption ||
            m.message?.videoMessage?.caption || '';
        const commandUsed = body.replace(/^!/, '').trim().split(/\s+/)[0].toLowerCase();
        const field = fields[commandUsed];
        if (!field) {
            return sock.sendMessage(jid, { text: '「✿」 No reconocí el campo del perfil.' }, { quoted: m });
        }

        const value = args.join(' ').trim();
        const removing = deleteCommands.has(commandUsed);
        if (!removing && !value) {
            return sock.sendMessage(jid, {
                text: `「✿」 Escribe el valor para tu ${field.label}.\n_Ejemplo:_ !${commandUsed} ${field.label === 'cumpleaños' ? '15 de octubre' : 'tu respuesta'}`
            }, { quoted: m });
        }

        db.getSafeUser(sender, (ensureErr) => {
            if (ensureErr) {
                console.error('Error al registrar usuario para editar perfil:', ensureErr.message);
                return sock.sendMessage(jid, { text: '「✿」 No pude preparar tu perfil en la base de datos.' }, { quoted: m });
            }

            db.run(`UPDATE users SET ${field.column} = ? WHERE jid = ?`, [removing ? field.empty : value, sender], (err) => {
                if (err) {
                    console.error(`Error al actualizar ${field.column}:`, err.message);
                    return sock.sendMessage(jid, { text: `「✿」 No se pudo actualizar tu ${field.label}.` }, { quoted: m });
                }

                const text = removing
                    ? `「✿」 Tu ${field.label} se eliminó de tu perfil. 🌸`
                    : `「✿」 Tu ${field.label} se actualizó correctamente. ✨`;
                sock.sendMessage(jid, { text }, { quoted: m });
            });
        });
    }
};
