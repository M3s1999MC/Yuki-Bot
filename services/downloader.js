async function getYouTubeVideoDetails(queryOrUrl) {
    let targetUrl = queryOrUrl.trim();
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
            likes: typeof info?.like_count === 'number'
                ? info.like_count.toLocaleString('es-ES')
                : 'No disponible',
            thumbnail: info?.thumbnail || (Array.isArray(info?.thumbnails) && info.thumbnails.length
                ? info.thumbnails[info.thumbnails.length - 1].url
                : null),
            url: info?.webpage_url || targetUrl
        };
    } catch (_) {
        const fallback = await searchYouTube(targetUrl, 1);
        if (!fallback.length) return null;
        const v = fallback[0];
        return {
            title: v.title,
            description: 'Descripción no disponible en este momento.',
            channel: v.author,
            likes: 'No disponible',
            thumbnail: `https://i.ytimg.com/vi/${v.url.split('v=')[1]?.split('&')[0] || ''}/hqdefault.jpg`,
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
            likes: typeof entry.like_count === 'number'
                ? entry.like_count.toLocaleString('es-ES')
                : 'No disponible',
            thumbnail: entry.thumbnail || (Array.isArray(entry.thumbnails) && entry.thumbnails.length
                ? entry.thumbnails[entry.thumbnails.length - 1].url
                : null),
            url: entry.webpage_url || entry.original_url || entry.url || null
        };
    } catch (_) {
        return null;
    }
}
