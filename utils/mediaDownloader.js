async function downloadWithYtDlp(url, options = {}) {
    const type = options.type || 'video';
    const prefix = options.prefix || 'media';
    const id = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const outTemplate = path.join(tempDir, `${id}.%(ext)s`);

    // Parámetros base para evitar bloqueos de datacenter en Render
    const baseArgs = [
        '--no-playlist',
        '--no-warnings',
        '--extractor-args', 'youtube:player_client=android,web'
    ];

    if (type === 'audio') {
        const args = [
            ...baseArgs,
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
        ...baseArgs,
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
