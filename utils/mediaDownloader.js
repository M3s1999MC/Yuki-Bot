const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const yts = require('yt-search');

const MAX_VIDEO_BYTES = 48 * 1024 * 1024;
const MAX_AUDIO_BYTES = 24 * 1024 * 1024;
const ALLOWED_HOSTS = [
    'youtube.com', 'youtu.be', 'tiktok.com', 'instagram.com',
    'facebook.com', 'fb.watch', 'x.com', 'twitter.com'
];

function validateMediaUrl(input) {
    let url;
    try {
        url = new URL(input);
    } catch {
        throw new Error('URL inválida.');
    }
    const host = url.hostname.toLowerCase();
    if (!['http:', 'https:'].includes(url.protocol) ||
        !ALLOWED_HOSTS.some(domain => host === domain || host.endsWith(`.${domain}`))) {
        throw new Error('El enlace no pertenece a una plataforma admitida.');
    }
    return url.toString();
}

function runYtDlp(args, timeoutMs = 150_000) {
    return new Promise((resolve, reject) => {
        const executable = process.env.YTDLP_PATH || (process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
        let stdout = '';
        let stderr = '';
        let settled = false;
        let child;
        let timer;
        const finish = (error, output) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            error ? reject(error) : resolve(output);
        };
        const launch = (command, commandArgs, allowPythonFallback) => {
            child = spawn(command, commandArgs, { windowsHide: true, shell: false });
            const launchedChild = child;
            timer = setTimeout(() => {
                launchedChild.kill('SIGKILL');
                finish(new Error('La descarga superó el tiempo máximo.'));
            }, timeoutMs);
            launchedChild.stdout.on('data', chunk => { stdout = (stdout + chunk.toString()).slice(-16_384); });
            launchedChild.stderr.on('data', chunk => { stderr = (stderr + chunk.toString()).slice(-16_384); });
            launchedChild.on('error', error => {
                if (error.code === 'ENOENT' && allowPythonFallback && !settled) {
                    clearTimeout(timer);
                    const windowsLauncher = path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Python', 'Launcher', 'py.exe');
                    const python = process.env.PYTHON_PATH ||
                        (process.platform === 'win32' && fs.existsSync(windowsLauncher) ? windowsLauncher : process.platform === 'win32' ? 'py' : 'python3');
                    launch(python, ['-m', 'yt_dlp', ...args], false);
                    return;
                }
                finish(error.code === 'ENOENT'
                    ? new Error('No se encontró yt-dlp. Instálalo o define YTDLP_PATH/PYTHON_PATH.')
                    : error);
            });
            launchedChild.on('close', code => {
                if (launchedChild !== child) return;
                if (code !== 0) return finish(new Error(stderr.trim().split('\n').slice(-2).join(' ') || `yt-dlp terminó con código ${code}.`));
                finish(null, stdout.trim());
            });
        };
        launch(executable, args, !process.env.YTDLP_PATH);
    });
}

async function downloadMedia(input, { audio = false } = {}) {
    const url = validateMediaUrl(input);
    const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'yuki-media-'));
    const template = path.join(dir, 'media.%(ext)s');
    const limit = audio ? MAX_AUDIO_BYTES : MAX_VIDEO_BYTES;
    const cookieArgs = [];
    if (process.env.YTDLP_COOKIES?.trim()) {
        cookieArgs.push('--cookies', process.env.YTDLP_COOKIES.trim());
    } else if (process.env.YTDLP_COOKIES_FROM_BROWSER?.trim()) {
        cookieArgs.push('--cookies-from-browser', process.env.YTDLP_COOKIES_FROM_BROWSER.trim());
    }
    const host = new URL(url).hostname.toLowerCase();
    const isYouTube = host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtu.be';
    const isInstagram = host === 'instagram.com' || host.endsWith('.instagram.com');
    const format = audio
        ? 'bestaudio/best'
        : isYouTube
            ? 'bv*[vcodec^=avc1][ext=mp4]+ba[ext=m4a]/b[ext=mp4]/best'
            : isInstagram
                ? 'bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/best'
                : 'best[ext=mp4]/best';
    const args = [
        '--no-playlist', '--no-progress', '--no-warnings', '--restrict-filenames',
        ...cookieArgs,
        '--max-filesize', `${Math.floor(limit / 1024 / 1024)}M`,
        '-f', format,
        ...(audio ? ['-x', '--audio-format', 'mp3'] : ['--merge-output-format', 'mp4']),
        ...(!audio && isYouTube
            ? ['--recode-video', 'mp4', '--postprocessor-args', 'VideoConvertor:-c:v libx264 -c:a aac -movflags +faststart']
            : []),
        ...(process.env.FFMPEG_LOCATION ? ['--ffmpeg-location', process.env.FFMPEG_LOCATION] : []),
        '-o', template, '--print', 'title', '--print', 'after_move:filepath', url
    ];
    try {
        const printedOutput = await runYtDlp(args);
        const candidates = (await fs.promises.readdir(dir)).map(name => path.join(dir, name));
        const outputLines = printedOutput.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
        const filePath = [...outputLines].reverse().find(line => candidates.includes(line)) || candidates[0];
        if (!filePath || !candidates.includes(filePath)) throw new Error('yt-dlp no produjo un archivo descargable.');
        const stat = await fs.promises.stat(filePath);
        if (!stat.isFile() || stat.size === 0 || stat.size > limit) throw new Error('El archivo está vacío o supera el límite permitido.');
        const ext = path.extname(filePath).toLowerCase();
        const mimetype = audio
            ? ({ '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg', '.opus': 'audio/ogg', '.webm': 'audio/webm' }[ext] || 'audio/mpeg')
            : ({ '.webm': 'video/webm', '.mkv': 'video/x-matroska' }[ext] || 'video/mp4');
        const title = outputLines.find(line => !candidates.includes(line)) || path.basename(filePath, ext);
        return { buffer: await fs.promises.readFile(filePath), ext, mimetype, title };
    } finally {
        await fs.promises.rm(dir, { recursive: true, force: true }).catch(() => {});
    }
}

async function searchYouTube(query) {
    const result = await yts(query);
    return (result.videos || []).slice(0, 5).map(video => ({
        title: video.title,
        url: video.url,
        duration: video.timestamp || '—',
        views: Number(video.views || 0).toLocaleString('es')
    }));
}

async function searchTikTok(query) {
    const endpoint = process.env.TIKTOK_SEARCH_API_URL;
    if (!endpoint) throw new Error('Búsqueda TikTok no configurada. Define TIKTOK_SEARCH_API_URL con una API de búsqueda compatible.');
    const requestUrl = endpoint.includes('{query}')
        ? endpoint.replaceAll('{query}', encodeURIComponent(query))
        : `${endpoint}${endpoint.includes('?') ? '&' : '?'}q=${encodeURIComponent(query)}`;
    const response = await fetch(requestUrl, { signal: AbortSignal.timeout(20_000) });
    if (!response.ok) throw new Error(`La API de TikTok respondió HTTP ${response.status}.`);
    const json = await response.json();
    const rows = json?.data?.videos || json?.videos || json?.data || json?.result || [];
    if (!Array.isArray(rows)) throw new Error('La respuesta de búsqueda TikTok no tiene un formato reconocido.');
    return rows.slice(0, 5).map(item => ({
        title: item.title || item.desc || item.description || 'Video de TikTok',
        url: item.url || item.share_url || item.video_url || item.play || item.playUrl
    })).filter(item => typeof item.url === 'string' && /^https?:\/\//i.test(item.url));
}

module.exports = { downloadMedia, searchYouTube, searchTikTok, validateMediaUrl };