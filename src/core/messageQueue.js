// src/core/messageQueue.js

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Genera un delay aleatorio para simular comportamiento humano (por defecto entre 1.5 y 3.5 segundos)
const getRandomDelay = (min = 1500, max = 3500) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

class MessageQueue {
    constructor() {
        this.queue = [];
        this.processing = false;
    }

    /**
     * Añade un trabajo de envío a la cola y ejecuta el procesamiento.
     * @param {Function} task - Función asíncrona que ejecuta el sock.sendMessage real.
     */
    add(task) {
        this.queue.push(task);
        this.process();
    }

    async process() {
        if (this.processing) return;
        this.processing = true;

        try {
            while (this.queue.length > 0) {
                const task = this.queue.shift();

                try {
                    // Espera un tiempo aleatorio antes de procesar el siguiente mensaje de la lista
                    const delay = getRandomDelay(1500, 3500);
                    await sleep(delay);

                    // Ejecuta el envío real de Baileys
                    await task();
                } catch (error) {
                    console.error("[MessageQueue Error]:", error);
                }
            }
        } finally {
            this.processing = false;
        }
    }
}

// Exportamos una instancia única (Singleton) para que toda la app use la misma cola
module.exports = new MessageQueue();
