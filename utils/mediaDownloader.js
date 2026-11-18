const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const tempDir = path.join(os.tmpdir(), 'yuki_downloads');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

function runCommand(bin, args, timeoutMs = 120000) {
    return new Promise((resolve, reject) => {
        execFile(bin, args, { timeout: timeoutMs, maxBuffer: 1024 * 1024 * 20 }, (err, stdout, stderr) => {
            if (err) {
                err.stderr = stderr;
                return reject(err);
            }
            resolve({ stdout, stderr });
        });
    });
}

/**
 * Descarga video o audio usando yt-dlp y convierte a mp3 con ffmpeg si se solicita.
 * @param {string} url
 * @param {{ type?: 'video' | 'audio', prefix?: string }} options
 */
async function downloadWithYtDlp(url, options = {}) {
    const type = options.type || 'video';
    const prefix = options.prefix || 'media';
    const id = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const outTemplate = path.join(tempDir, `${id}.%(ext)s`);

    if (type === 'audio') {
        const args = [
            '--no-playlist',
            '--no-warnings',
            '-x',
            '--audio-format', 'mp3',
            '--audio-quality', '0',
            '-o', outTemplate,
            url
        ];

        await runCommand('yt-dlp', args);

        const mp3Path = path.join(tempDir, `${id}.mp3`);
        if (fs.existsSync(mp3Path)) {
            return { filePath: mp3Path, ext: 'mp3', cleanup: () => safeUnlink(mp3Path) };
        }

        // Respaldo con ffmpeg si yt-dlp dejó otro formato de audio
        const files = fs.readdirSync(tempDir).filter(f => f.startsWith(id));
        if (!files.length) throw new Error('No se generó ningún archivo de audio.');

        const rawPath = path.join(tempDir, files[0]);
        const convertedPath = path.join(tempDir, `${id}_conv.mp3`);

        await runCommand('ffmpeg', ['-y', '-i', rawPath, '-vn', '-ab', '192k', convertedPath]);
        safeUnlink(rawPath);

        return {
            filePath: convertedPath,
            ext: 'mp3',
            cleanup: () => safeUnlink(convertedPath)
        };
    }

    const args = [
        '--no-playlist',
        '--no-warnings',
        '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        '--merge-output-format', 'mp4',
        '-o', outTemplate,
        url
    ];

    await runCommand('yt-dlp', args);

    const mp4Path = path.join(tempDir, `${id}.mp4`);
    if (fs.existsSync(mp4Path)) {
        return { filePath: mp4Path, ext: 'mp4', cleanup: () => safeUnlink(mp4Path) };
    }

    const files = fs.readdirSync(tempDir).filter(f => f.startsWith(id));
    if (!files.length) throw new Error('No se generó ningún archivo de video.');

    const foundPath = path.join(tempDir, files[0]);
    return {
        filePath: foundPath,
        ext: path.extname(foundPath).replace('.', '') || 'mp4',
        cleanup: () => safeUnlink(foundPath)
    };
}

function safeUnlink(filePath) {
    try {
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (_) {}
}

module.exports = {
    downloadWithYtDlp,
    runCommand,
    tempDir
};
