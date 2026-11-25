const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const { promisify } = require('util');
const yts = require('yt-search');

const execFileAsync = promisify(execFile);
const TMP_DIR = os.tmpdir();

function makeTempPath(prefix, ext) {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return path.join(TMP_DIR, `yuki_${prefix}_${id}${ext}`);
}

function safeUnlink(filePath) {
    if (!filePath) return;
    try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (_) {}
}

function isValidUrl(url) {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

function formatCaption(title, lines = []) {
    return [
        `🌸 ˚୨୧⋆｡˚ ⋆ *${title}* ⋆ ˚｡⋆୨୧˚ 🌸`,
        ...lines.filter(Boolean),
        '━━━━━━━━━━ 🌸 ━━━━━━━━━━',
        '_Yuki\'s MD • Orihime 🌸_'
    ].join('\n');
}

async function searchYouTube(query, limit = 5) {
    const res = await yts(query);
    return (res?.videos || []).slice(0, limit).map((v) => ({
        title: v.title,
        url: v.url,
        duration: v.timestamp || 'N/A',
        author: v.author?.name || 'Desconocido'
    }));
}

async function downloadWithYtDlp(url, { mode = 'mp4', maxDurationSec = 600 } = {}) {
    if (!isValidUrl(url)) throw new Error('URL inválida.');

    const rawOut = makeTempPath('raw', mode === 'mp3' ? '.m4a' : '.mp4');
    const finalOut = makeTempPath('out', mode === 'mp3' ? '.mp3' : '.mp4');

    try {
        const ytArgs = mode === 'mp3'
            ? [
                '--no-playlist',
                '--no-warnings',
                '--match-filter', `duration <= ${maxDurationSec}`,
                '-f', 'bestaudio[ext=m4a]/bestaudio/best',
                '-o', rawOut,
                url
            ]
            : [
                '--no-playlist',
                '--no-warnings',
                '--match-filter', `duration <= ${maxDurationSec}`,
                '-f', 'bestvideo[ext=mp4][height<=720]+bestaudio[ext=m4a]/best[ext=mp4][height<=720]/best',
                '--merge-output-format', 'mp4',
                '-o', finalOut,
                url
            ];

        await execFileAsync('yt-dlp', ytArgs, { timeout: 90000 });

        if (mode === 'mp3') {
            await execFileAsync('ffmpeg', [
                '-y',
                '-i', rawOut,
                '-vn',
                '-c:a', 'libmp3lame',
                '-b:a', '128k',
                finalOut
            ], { timeout: 60000 });
            safeUnlink(rawOut);
        }

        if (!fs.existsSync(finalOut)) throw new Error('Archivo no generado.');

        const buffer = fs.readFileSync(finalOut);
        safeUnlink(finalOut);
        return buffer;
    } catch (err) {
        safeUnlink(rawOut);
        safeUnlink(finalOut);
        throw err;
    }
}

async function searchPinterest(query, limit = 4) {
    const endpoint = `https://www.pinterest.com/resource/BaseSearchResource/get/?data=${encodeURIComponent(JSON.stringify({
        options: { query, scope: 'pins', page_size: limit }
    }))}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);

    try {
        const response = await fetch(endpoint, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        if (!response.ok) return [];
        const data = await response.json();
        const results = data?.resource_response?.data?.results || [];
        return results
            .map((pin) => {
                const img = pin?.images?.orig?.url || pin?.images?.['736x']?.url || pin?.images?.['474x']?.url;
                return img ? {
                    title: pin?.grid_title || pin?.title || 'Pin de Pinterest',
                    imageUrl: img,
                    pinUrl: pin?.id ? `https://www.pinterest.com/pin/${pin.id}/` : null
                } : null;
            })
            .filter(Boolean)
            .slice(0, limit);
    } catch (_) {
        return [];
    } finally {
        clearTimeout(timer);
    }
}

module.exports = {
    isValidUrl,
    formatCaption,
    searchYouTube,
    downloadWithYtDlp,
    searchPinterest
};
