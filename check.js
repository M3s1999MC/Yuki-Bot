const fs = require('fs');
const path = require('path');

function scanDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== 'sessions') {
                scanDir(fullPath);
            }
        } else if (file.endsWith('.js') && file !== 'check.js') {
            const content = fs.readFileSync(fullPath, 'utf8');
            // Cuenta cuántas veces se declara 'db' con const, let o var
            const matches = content.match(/(const|let|var)\s+db\b/g);
            if (matches && matches.length > 1) {
                console.log(`❌ [ENCONTRADO] El archivo "${fullPath}" declara 'db' ${matches.length} veces.`);
            }
        }
    }
}

console.log('🔍 Buscando duplicados de "db" en el proyecto...');
scanDir(__dirname);
console.log('🏁 Búsqueda finalizada.');