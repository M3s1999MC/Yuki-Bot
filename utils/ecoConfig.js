// utils/ecoConfig.js
// Claves y esperas de los comandos de economía que no son trabajos.
const MIN = 60 * 1000;
const HOUR = 60 * MIN;

module.exports = {
    CHEST: { key: 'chest', ms: 24 * HOUR, label: 'Cofre misterioso' },
    BOMB: { key: 'bomb', ms: 30 * MIN, label: 'Bombardear' },
    TRIVIA: { key: 'trivia', ms: 60 * 1000, label: 'Trivia' },
    // Recompensas que ya existen y guardan su última reclamación en la tabla users.
    PERIODIC: [
        { column: 'lastDaily', label: 'Daily', ms: 24 * HOUR },
        { column: 'lastWeekly', label: 'Weekly', ms: 7 * 24 * HOUR },
        { column: 'lastMonthly', label: 'Monthly', ms: 30 * 24 * HOUR }
    ]
};
