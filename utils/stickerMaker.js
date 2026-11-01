const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const sharp = require('sharp');

const MAX_INPUT_BYTES = 20 * 1024 * 1024;
const MAX_STICKER_BYTES = 500 * 1024;

function runFfmpeg(args) {
    return new Promise((resolve, reject) => {
        const child = spawn(process.env.FFMPEG_PATH || (process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'), args, { windowsHide: true, shell: false });
        let stderr = '';
        const timer = setTimeout(() => child.kill('SIGKILL'), 45_000);
        child.stderr.on('data', data => { stderr = (stderr + data.toString()).slice(-4000); });
        child.on('error', error => {
            clearTimeout(timer);
            reject(error.code === 'ENOENT' ? new Error('FFmpeg no está instalado o no está en PATH; se necesita para convertir videos a stickers animados.') : error);
        });
        child.on('close', code => {
            clearTimeout(timer);
            code === 0 ? resolve() : reject(new Error(stderr.trim().split('\n').slice(-2).join(' ') || 'FFmpeg no pudo convertir el video.'));
        });
    });
}

async function makeSticker(buffer, { video = false } = {}) {
    if (!Buffer.isBuffer(buffer) || buffer.length === 0 || buffer.length > MAX_INPUT_BYTES) {
        throw new Error('El archivo está vacío o supera el límite de 20 MB.');
    }
    let output;
    if (video) {
        const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'yuki-sticker-'));
        const input = path.join(dir, 'input-video');
        const out = path.join(dir, 'sticker.webp');
        try {
            await fs.promises.writeFile(input, buffer);
            await runFfmpeg([
                '-y', '-i', input, '-t', '8', '-an', '-vf',
                'fps=10,scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000',
                '-loop', '0', '-c:v', 'libwebp', '-quality', '65', '-preset', 'default', out
            ]);
            output = await fs.promises.readFile(out);
        } finally {
            await fs.promises.rm(dir, { recursive: true, force: true }).catch(() => {});
        }
    } else {
        output = await sharp(buffer)
            .rotate()
            .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .webp({ quality: 80, effort: 4 })
            .toBuffer();
    }
    if (!output?.length || output.length > MAX_STICKER_BYTES) {
        throw new Error('El sticker generado supera el límite de 500 KB; prueba con una imagen o video más corto.');
    }
    // Normaliza el resultado y rechaza formatos que no sean imágenes válidas.
    await sharp(output).metadata();
    return output;
}

async function makeBratSticker(text) {
    const clean = text.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 160);
    const words = clean.split(/\s+/);
    const lines = [];
    let line = '';
    for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (candidate.length > 17 && line) { lines.push(line); line = word; }
        else line = candidate;
    }
    if (line) lines.push(line);
    const visible = lines.slice(0, 6);
    if (lines.length > 6) visible[5] = `${visible[5].slice(0, 12)}…`;
    const fontSize = visible.length >= 5 ? 43 : visible.length >= 3 ? 50 : 58;
    const lineHeight = fontSize * 1.05;
    const startY = 256 - ((visible.length - 1) * lineHeight) / 2;
    const escapeXml = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    const textNodes = visible.map((value, index) => `<text x="256" y="${startY + index * lineHeight}" text-anchor="middle" dominant-baseline="middle">${escapeXml(value)}</text>`).join('');
    const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" fill="#8ace00"/><g fill="#000" font-family="Arial,sans-serif" font-size="${fontSize}" font-weight="700" font-style="italic">${textNodes}</g></svg>`);
    const result = await sharp(svg).webp({ quality: 82 }).toBuffer();
    if (result.length > MAX_STICKER_BYTES) throw new Error('El sticker generado supera el límite de WhatsApp.');
    return result;
}

module.exports = { makeSticker, makeBratSticker };