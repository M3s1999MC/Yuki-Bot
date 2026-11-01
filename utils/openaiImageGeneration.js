const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const DEFAULT_IMAGE_MODEL = 'gpt-image-1-mini';

async function generateOriginalCharacterImage(character) {
    const apiKey = process.env.OPENAI_IMAGE_API_KEY;
    if (!apiKey) {
        throw new Error('Configura OPENAI_IMAGE_API_KEY en el entorno para generar ilustraciones.');
    }

    const description = ['role', 'description', 'design', 'personality']
        .map(field => `${field}: ${String(character[field] || '').slice(0, 500)}`)
        .join('\n');
    const prompt = [
        'Create one polished, original anime-inspired character illustration.',
        `Character name: ${String(character.name || 'Original character').slice(0, 120)}`,
        description,
        'The character must be an original design, not based on or resembling any existing character or franchise.',
        'Show one full-body character, clear silhouette, expressive pose, detailed colorful background, no text, no logos.'
    ].join('\n');

    const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: process.env.OPENAI_IMAGE_MODEL || DEFAULT_IMAGE_MODEL,
            prompt,
            size: '1024x1024',
            quality: 'low',
            n: 1
        }),
        signal: AbortSignal.timeout(90_000)
    });

    let result;
    try {
        result = await response.json();
    } catch (error) {
        throw new Error(`OpenAI devolvió una respuesta de imagen inválida: ${error.message}`);
    }
    if (!response.ok) {
        throw new Error(result?.error?.message || `OpenAI Images API respondió HTTP ${response.status}.`);
    }

    const encodedImage = result?.data?.[0]?.b64_json;
    if (typeof encodedImage !== 'string' || !encodedImage) {
        throw new Error('OpenAI no devolvió la imagen generada en formato base64.');
    }
    if (encodedImage.length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4) {
        throw new Error('La imagen generada supera el límite de 8 MB.');
    }

    const image = Buffer.from(encodedImage, 'base64');
    if (!image.length || image.length > MAX_IMAGE_BYTES) {
        throw new Error('La imagen generada está vacía o supera el límite de 8 MB.');
    }
    return image;
}

module.exports = { generateOriginalCharacterImage };
