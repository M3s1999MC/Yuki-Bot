async function getFallbackCharacterImage() {
    const response = await fetch('https://api.waifu.im/search/?included_tags=waifu', {
        signal: AbortSignal.timeout(15_000)
    });
    if (!response.ok) throw new Error(`La fuente de imágenes respondió HTTP ${response.status}.`);
    const json = await response.json();
    const imageUrl = json?.images?.[0]?.url;
    if (typeof imageUrl !== 'string') throw new Error('La fuente no devolvió una imagen.');

    const imageResponse = await fetch(imageUrl, { signal: AbortSignal.timeout(15_000) });
    const contentType = imageResponse.headers.get('content-type') || '';
    if (!imageResponse.ok || !contentType.startsWith('image/')) throw new Error('La URL de imagen no devolvió multimedia válida.');
    const declaredSize = Number(imageResponse.headers.get('content-length') || 0);
    if (declaredSize > 8 * 1024 * 1024) throw new Error('La imagen supera el límite permitido.');
    const buffer = Buffer.from(await imageResponse.arrayBuffer());
    if (!buffer.length || buffer.length > 8 * 1024 * 1024) throw new Error('La imagen está vacía o supera el límite permitido.');
    return buffer;
}

module.exports = { getFallbackCharacterImage };