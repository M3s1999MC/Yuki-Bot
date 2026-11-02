const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const PINTEREST_HOST = 'www.pinterest.com';
const IMAGE_HOST = 'i.pinimg.com';

async function fetchPinterestImage(imageUrl) {
    let url;
    try {
        url = new URL(imageUrl);
    } catch {
        throw new Error('La URL de imagen de Pinterest no es válida.');
    }
    if (url.protocol !== 'https:' || url.hostname !== IMAGE_HOST) {
        throw new Error('La imagen no pertenece al CDN público de Pinterest.');
    }

    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
            Referer: 'https://www.pinterest.com/'
        },
        signal: AbortSignal.timeout(20_000)
    });
    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || !contentType.startsWith('image/')) {
        throw new Error('Pinterest devolvió un resultado que no es una imagen accesible.');
    }
    if (Number(response.headers.get('content-length') || 0) > MAX_IMAGE_BYTES) {
        throw new Error('La imagen supera el límite de 8 MB.');
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) {
        throw new Error('La imagen está vacía o supera el límite de 8 MB.');
    }
    return buffer;
}

async function searchPinterestImage(query) {
    if (typeof query !== 'string' || !query.trim()) {
        throw new Error('Escribe qué imagen quieres buscar en Pinterest.');
    }

    const searchUrl = new URL('/search/pins/', `https://${PINTEREST_HOST}`);
    searchUrl.searchParams.set('q', query.trim());
    const response = await fetch(searchUrl, {
        headers: {
            Accept: 'text/html,application/xhtml+xml',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36'
        },
        signal: AbortSignal.timeout(20_000)
    });
    if (!response.ok) throw new Error(`La búsqueda pública de Pinterest respondió HTTP ${response.status}.`);

    const html = (await response.text())
        .replace(/\\u002F/gi, '/')
        .replace(/\\u003D/gi, '=')
        .replace(/\\\//g, '/')
        .replace(/&amp;/g, '&');
    const pinResultsHtml = html
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/url\(\s*(['"]?)[^)]+\1\s*\)/gi, '');
    const foundUrls = pinResultsHtml.match(
        /https?:\/\/i\.pinimg\.com\/[^\s"'<>\\]*?\.(?:jpe?g|png|webp)(?:\?[^\s"'<>\\]*)?/gi
    ) || [];
    const candidates = [...new Set(foundUrls.map(candidate => {
        try {
            const imageUrl = new URL(candidate.replace(/[),}\]]+$/, ''));
            if (imageUrl.hostname !== IMAGE_HOST ||
                !/\.(?:jpe?g|png|webp)(?:$|[?#])/i.test(imageUrl.href)) return null;
            return imageUrl;
        } catch {
            return null;
        }
    }).filter(Boolean))];
    candidates.sort((left, right) =>
        Number(/\/originals\//i.test(right.pathname)) - Number(/\/originals\//i.test(left.pathname))
    );

    if (!candidates.length) {
        if (/"lop_unauth_lockdown_search"\s*:\s*"(?:enabled|enabled_rollout)"/i.test(html)) {
            throw new Error('Pinterest está restringiendo los resultados para búsquedas sin iniciar sesión.');
        }
        throw new Error('Pinterest no mostró imágenes públicas para esa búsqueda.');
    }

    let lastError;
    for (const candidate of candidates.slice(0, 5)) {
        try {
            return { buffer: await fetchPinterestImage(candidate.href), url: candidate.href };
        } catch (error) {
            lastError = error;
        }
    }
    throw new Error(`No se pudo descargar una imagen pública de Pinterest${lastError ? `: ${lastError.message}` : '.'}`);
}

async function searchPinterestImageBuffer(query) {
    const image = await searchPinterestImage(query);
    return image.buffer;
}

module.exports = { searchPinterestImage, searchPinterestImageBuffer, fetchPinterestImage };
