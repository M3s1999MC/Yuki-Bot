const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Servidor web falso para que Render no cierre la aplicación por falta de puertos
app.get('/', (req, res) => {
    res.send('Yuki-Bot está en línea 🌸');
});

app.listen(PORT, () => {
    console.log(`[HTTP] Servidor web escuchando en el puerto ${PORT}`);
});

// Arranca tu bot principal automáticamente junto con el servidor
require('./index.js');
