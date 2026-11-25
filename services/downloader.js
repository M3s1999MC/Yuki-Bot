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
            await downloadYouTubeFallback(url, mode, finalOut);
            lastErr = null;
        }

        if (lastErr) {
            throw lastErr;
        }

        if (mode === 'mp3' && fs.existsSync(rawOut) && !fs.existsSync(finalOut)) {
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
