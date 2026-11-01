const API_BASE = 'https://api.jikan.moe/v4';
const USER_AGENT = 'Yuki WhatsApp bot character search';

async function fetchJikanJson(url) {
    const response = await fetch(url, {
        headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(15_000)
    });
    if (!response.ok) throw new Error(`Jikan respondió HTTP ${response.status}.`);
    return response.json();
}

async function getRandomAnimeCharacter() {
    const page = Math.floor(Math.random() * 5) + 1;
    const animeResponse = await fetchJikanJson(`${API_BASE}/top/anime?page=${page}`);
    const animeList = animeResponse?.data;
    if (!Array.isArray(animeList) || !animeList.length) {
        throw new Error('Jikan no devolvió una lista de animes.');
    }

    const anime = animeList[Math.floor(Math.random() * animeList.length)];
    if (!Number.isInteger(anime?.mal_id)) throw new Error('Jikan devolvió un anime sin identificador.');

    await new Promise(resolve => setTimeout(resolve, 400));
    const charactersResponse = await fetchJikanJson(`${API_BASE}/anime/${anime.mal_id}/characters`);
    const entries = charactersResponse?.data;
    if (!Array.isArray(entries) || !entries.length) {
        throw new Error(`Jikan no encontró personajes para ${anime.title || 'el anime seleccionado'}.`);
    }

    const mainCharacters = entries.filter(entry => {
        const role = Array.isArray(entry?.role) ? entry.role.join(', ') : entry?.role;
        return typeof role === 'string' && role.toLowerCase() === 'main';
    });
    const candidates = mainCharacters.length ? mainCharacters : entries;
    const selected = candidates[Math.floor(Math.random() * candidates.length)];
    const name = selected?.character?.name?.trim();
    if (!name) throw new Error('Jikan devolvió un personaje sin nombre.');

    const role = Array.isArray(selected.role) ? selected.role.join(', ') : selected.role;
    return {
        id: selected.character.mal_id,
        name,
        serie: anime.title_english || anime.title || 'Anime',
        role: typeof role === 'string' && role.trim() ? role : 'Personaje',
        price: 1000
    };
}

module.exports = { getRandomAnimeCharacter };
