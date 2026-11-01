const { exec } = require('child_process');

module.exports = {
    name: 'gitpull',
    aliases: ['gitsync', 'updatetoken'],
    category: 'owner',
    description: 'Actualiza y descarga los últimos cambios del repositorio.',

    async execute(sock, m, args) {
        const jid = m.key.remoteJid;
        await sock.sendMessage(jid, { text: '🔄 Sincronizando repositorio con GitHub...' }, { quoted: m });

        exec('git pull', (error, stdout, stderr) => {
            if (error) {
                return sock.sendMessage(jid, { text: `❌ Error al actualizar:\n\`\`\`${error.message}\`\`\`` }, { quoted: m });
            }
            sock.sendMessage(jid, { text: `✅ ¡Repositorio actualizado con éxito!\n\`\`\`${stdout}\`\`\`` }, { quoted: m });
        });
    }
};