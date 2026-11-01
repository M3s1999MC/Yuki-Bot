function getMessageContent(message) {
    let content = message || {};
    const wrappers = [
        'ephemeralMessage',
        'viewOnceMessage',
        'viewOnceMessageV2',
        'viewOnceMessageV2Extension',
        'documentWithCaptionMessage',
        'deviceSentMessage'
    ];

    while (true) {
        const wrapper = wrappers.find(key => content[key]?.message);
        if (!wrapper) return content;
        content = content[wrapper].message;
    }
}

module.exports = { getMessageContent };
