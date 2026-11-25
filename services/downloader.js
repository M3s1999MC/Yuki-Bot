const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const { promisify } = require('util');
const ytdlp = require('yt-dlp-exec');
const yts = require('yt-search');

let ytdl = null;
try {
    ytdl = require('@distube/ytdl-core');
} catch (_) {}

const execFileAsync = promisify(execFile);
const TMP_DIR = os.tmpdir();

const DOWNLOAD_API_URL = String(process.env.DOWNLOAD_API_URL || '').trim().replace(/\/+$/, '');
const DOWNLOAD_API_KEY = String(process.env.DOWNLOAD_API_KEY || '').trim();

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

function isYouTubeUrl(url) {
    if (!isValidUrl(url)) return false;
    try {
        const host = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
        return host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be';
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

function formatCount(val, fallback = 'No disponible') {
    if (typeof val === 'number' && Number.isFinite(val)) {
        return val.toLocaleString('es-ES');
    }
    if (typeof val === 'string' && val.trim()) {
        return val.trim();
    }
    return fallback;
}

async function convertToMp3IfNeeded(inputPath, outputPath) {
    await execFileAsync('ffmpeg', [
        '-y',
        '-i', inputPath,
        '-vn',
        '-c:a', 'libmp3lame',
        '-b:a', '128k',
        outputPath
    ], { timeout: 60000 });
}

async function downloadFromApiKey(url, mode = 'mp4') {
    if (!DOWNLOAD_API_URL || !DOWNLOAD_API_KEY) {
        return null;
    }

    const endpoint = `${DOWNLOAD_API_URL}/download?url=${encodeURIComponent(url)}&format=${encodeURIComponent(mode)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);

    try {
        const res = await fetch(endpoint, {
            method: 'GET',
            signal: controller.signal,
            headers: {
                'Authorization': `Bearer ${DOWNLOAD_API_KEY}`,
                'x-api-key': DOWNLOAD_API_KEY,
                'Accept': '*/*'
            }
        });

        if (!res.ok) {
            throw new Error(`API de descarga respondió HTTP ${res.status}`);
        }

        const contentType = String(res.headers.get('content-type') || '').toLowerCase();
        if (contentType.includes('application/json')) {
            const data = await res.json();
            const directUrl = data?.downloadUrl || data?.url || data?.data?.url || data?.result?.url;
            if (!directUrl || !isValidUrl(directUrl)) {
                throw new Error('La API no devolvió un enlace directo válido.');
            }
            const fileRes = await fetch(directUrl);
            if (!fileRes.ok) {
                throw new Error(`Error descargando archivo desde API (${fileRes.status})`);
            }
            return Buffer.from(await fileRes.arrayBuffer());
        }

        const arrayBuf = await res.arrayBuffer();
        const buf = Buffer.from(arrayBuf);
        if (!buf.length) {
            throw new Error('La API devolvió un archivo vacío.');
        }
        return buf;
    } finally {
        clearTimeout(timer);
    }
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

async function getYouTubeVideoDetails(queryOrUrl) {
    let targetUrl = String(queryOrUrl || '').trim();
    if (!targetUrl) return null;

    if (!isYouTubeUrl(targetUrl)) {
        const found = await searchYouTube(targetUrl, 1);
        if (!found.length) return null;
        targetUrl = found[0].url;
    }

    try {
        const info = await ytdlp(targetUrl, {
            dumpSingleJson: true,
            noWarnings: true,
            noPlaylist: true,
            skipDownload: true
        });

        return {
            title: info?.title || 'Sin título',
            description: (info?.description || 'Sin descripción disponible.').trim(),
            channel: info?.uploader || info?.channel || 'Desconocido',
            likes: formatCount(info?.like_count),
            thumbnail: info?.thumbnail || (Array.isArray(info?.thumbnails) && info.thumbnails.length
                ? info.thumbnails[info.thumbnails.length - 1].url
                : null),
            url: info?.webpage_url || targetUrl
        };
    } catch (_) {
        const fallback = await searchYouTube(targetUrl, 1);
        if (!fallback.length) return null;
        const v = fallback[0];
        const vidId = v.url.split('v=')[1]?.split('&')[0] || '';
        return {
            title: v.title,
            description: 'Descripción no disponible en este momento.',
            channel: v.author,
            likes: 'No disponible',
            thumbnail: vidId ? `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg` : null,
            url: v.url
        };
    }
}

async function searchTikTokVideos(query) {
    const searchUrl = `ytsearch1:${query} tiktok`;
    try {
        const info = await ytdlp(searchUrl, {
            dumpSingleJson: true,
            noWarnings: true,
            noPlaylist: true,
            skipDownload: true
        });

        const entry = Array.isArray(info?.entries) && info.entries.length
            ? info.entries[0]
            : info;

        if (!entry || (!entry.title && !entry.webpage_url && !entry.url)) {
            return null;
        }

        return {
            title: entry.title || 'Video de TikTok',
            description: (entry.description || 'Sin descripción disponible.').trim(),
            channel: entry.uploader || entry.creator || entry.channel || 'Creador de TikTok',
            likes: formatCount(entry.like_count),
            thumbnail: entry.thumbnail || (Array.isArray(entry.thumbnails) && entry.thumbnails.length
                ? entry.thumbnails[entry.thumbnails.length - 1].url
                : null),
            url: entry.webpage_url || entry.original_url || entry.url || null
        };
    } catch (_) {
        return null;
    }
}

async function downloadYouTubeFallback(url, mode, finalOut) {
    if (!ytdl || !isYouTubeUrl(url)) {
        throw new Error('Fallback de YouTube no disponible.');
    }

    const rawOut = makeTempPath('ytdl_raw', mode === 'mp3' ? '.m4a' : '.mp4');
    try {
        await new Promise((resolve, reject) => {
            const stream = ytdl(url, {
                quality: mode === 'mp3' ? 'highestaudio' : 'highest',
                filter: mode === 'mp3' ? 'audioonly' : 'audioandvideo'
            });

            const writer = fs.createWriteStream(rawOut);
            stream.on('error', reject);
            writer.on('error', reject);
            writer.on('finish', resolve);
            stream.pipe(writer);
        });

        if (mode === 'mp3') {
            await convertToMp3IfNeeded(rawOut, finalOut);
            safeUnlink(rawOut);
        } else {
            fs.renameSync(rawOut, finalOut);
        }

        if (!fs.existsSync(finalOut)) {
            throw new Error('No se pudo generar el archivo con el fallback.');
        }
    } catch (err) {
        safeUnlink(rawOut);
        throw err;
    }
}

async function runYtDlpAttempt(url, mode, targetOut, playerClient) {
    const baseFlags = {
        noPlaylist: true,
        noWarnings: true,
        extractorArgs: `youtube:player_client=${playerClient}`,
        output: targetOut
    };

    const flags = mode === 'mp3'
        ? {
            ...baseFlags,
            format: 'bestaudio[ext=m4a]/bestaudio/best'
        }
        : {
            ...baseFlags,
            format: 'bestvideo[ext=mp4][height<=720]+bestaudio[ext=m4a]/best[ext=mp4][height<=720]/best',
            mergeOutputFormat: 'mp4'
        };

    await ytdlp(url, flags);
}

async function downloadWithYtDlp(url, { mode = 'mp4' } = {}) {
    if (!isValidUrl(url)) throw new Error('URL inválida.');

    // 1. Intento directo por API Key si está configurada
    if (DOWNLOAD_API_URL && DOWNLOAD_API_KEY) {
        try {
            const apiBuffer = await downloadFromApiKey(url, mode);
            if (apiBuffer && apiBuffer.length) {
                if (mode === 'mp3') {
                    const rawApi = makeTempPath('api_raw', '.bin');
                    const outMp3 = makeTempPath('api_out', '.mp3');
                    try {
                        fs.writeFileSync(rawApi, apiBuffer);
                        await convertToMp3IfNeeded(rawApi, outMp3);
                        const converted = fs.readFileSync(outMp3);
                        safeUnlink(rawApi);
                        safeUnlink(outMp3);
                        return converted;
                    } catch (_) {
                        safeUnlink(rawApi);
                        safeUnlink(outMp3);
                        return apiBuffer;
                    }
                }
                return apiBuffer;
            }
        } catch (apiErr) {
            console.error('[download api]', apiErr?.message || apiErr);
        }
    }

    // 2. Respaldo local con yt-dlp / ytdl-core / ffmpeg
    const rawOut = makeTempPath('raw', mode === 'mp3' ? '.m4a' : '.mp4');
    const finalOut = makeTempPath('out', mode === 'mp3' ? '.mp3' : '.mp4');
    const targetOut = mode === 'mp3' ? rawOut : finalOut;

    const clientsToTry = isYouTubeUrl(url)
        ? ['mweb,web_embedded', 'tv_embedded', 'android']
        : [null];

    let lastErr = null;

    try {
        for (const client of clientsToTry) {
            try {
                if (client) {
                    await runYtDlpAttempt(url, mode, targetOut, client);
                } else {
                    await ytdlp(url, {
                        noPlaylist: true,
                        noWarnings: true,
                        ...(mode === 'mp3'
                            ? { format: 'bestaudio[ext=m4a]/bestaudio/best', output: targetOut }
                            : {
                                format: 'bestvideo[ext=mp4][height<=720]+bestaudio[ext=m4a]/best[ext=mp4][height<=720]/best',
                                mergeOutputFormat: 'mp4',
                                output: targetOut
                            })
                    });
                }
                lastErr = null;
                break;
            } catch (err) {
                lastErr = err;
                safeUnlink(targetOut);
            }
        }

        if (lastErr && isYouTubeUrl(url) && ytdl) {
            try {
                await downloadYouTubeFallback(url, mode, finalOut);
                lastErr = null;
            } catch (fallbackErr) {
                console.error('[ytdl fallback]', fallbackErr?.message || fallbackErr);
            }
        }

        if (lastErr) {
            throw lastErr;
        }

        if (mode === 'mp3' && fs.existsSync(rawOut) && !fs.existsSync(finalOut)) {
            await convertToMp3IfNeeded(rawOut, finalOut);
            safeUnlink(rawOut);
        }

        if (!fs.existsSync(finalOut)) {
            throw new Error('Archivo no generado tras descargar.');
        }

        const buffer = fs.readFileSync(finalOut);
        safeUnlink(finalOut);
        return buffer;
    } catch (err) {
        safeUnlink(rawOut);
        safeUnlink(finalOut);
        throw err;
    }
}

async function searchPinterestHtmlFallback(query, limit = 25) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const searchUrl = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`;

    try {
        const res = await fetch(searchUrl, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
            }
        });
        if (!res.ok) return [];
        const html = await res.text();

        const matches = html.match(/https:\/\/i\.pinimg\.com\/(?:originals|[0-9]+x)\/[^\s"'<>\\]+/g) || [];
        const uniqueImgs = [];
        const seen = new Set();

        for (const raw of matches) {
            const clean = raw.replace(/\\u002F/g, '/').replace(/\\/g, '');
            const key = clean.split('/').pop();
            if (!key || seen.has(key)) continue;
            seen.add(key);
            uniqueImgs.push(clean);
            if (uniqueImgs.length >= limit) break;
        }

        return uniqueImgs.map((img, idx) => ({
            title: `Pin ${idx + 1}`,
            author: 'Desconocido',
            username: 'No disponible',
            followers: 'No disponible',
            likes: 'No disponible',
            imageUrl: img,
            pinUrl: searchUrl
        }));
    } catch (_) {
        return [];
    } finally {
        clearTimeout(timer);
    }
}

async function searchPinterest(query, limit = 25) {
    const endpoint = `https://www.pinterest.com/resource/BaseSearchResource/get/?data=${encodeURIComponent(JSON.stringify({
        options: { query, scope: 'pins', page_size: limit }
    }))}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    try {
        const response = await fetch(endpoint, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'X-Requested-With': 'XMLHttpRequest',
                'Referer': `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const results = Array.isArray(data?.resource_response?.data?.results)
                ? data.resource_response.data.results
                : [];

            const parsed = results
                .map((pin) => {
                    const img = pin?.images?.orig?.url || pin?.images?.['736x']?.url || pin?.images?.['474x']?.url;
                    if (!img) return null;

                    const owner = pin?.native_creator || pin?.pinner || {};
                    const author = owner?.full_name || pin?.domain || 'Desconocido';
                    const username = owner?.username || 'No disponible';
                    const followers = formatCount(owner?.follower_count ?? pin?.pinner?.follower_count);
                    const likes = formatCount(
                        pin?.reaction_counts?.['1'] ??
                        pin?.repin_count ??
                        pin?.aggregated_pin_data?.aggregated_stats?.saves
                    );

                    return {
                        title: pin?.grid_title || pin?.title || pin?.auto_alt_text || 'Pin de Pinterest',
                        author,
                        username,
                        followers,
                        likes,
                        imageUrl: img,
                        pinUrl: pin?.id ? `https://www.pinterest.com/pin/${pin.id}/` : null
                    };
                })
                .filter(Boolean);

            if (parsed.length) return parsed;
        }
    } catch (_) {}
    finally {
        clearTimeout(timer);
    }

    return searchPinterestHtmlFallback(query, limit);
}

module.exports = {
    isValidUrl,
    formatCaption,
    searchYouTube,
    getYouTubeVideoDetails,
    searchTikTokVideos,
    downloadWithYtDlp,
    searchPinterest
};
