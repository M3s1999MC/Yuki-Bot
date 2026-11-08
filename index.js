require('./utils/loadEnv')();

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');
const fs = require('fs/promises');
const { Pool } = require('pg');
const { timingSafeEqual } = require('crypto');
const QRCode = require('qrcode');
const db = require('./database/db'); 
const gachaDatabaseReady = require('./database/gacha_db');
const CommandHandler = require('./handlers/commandHandler');
const practiceSessions = require('./utils/practiceSessions');
const { getMessageContent } = require('./utils/messageContent');
const { getCanonicalMessageCountJid, getMessageSenderJid } = require('./utils/messageSender');
const { recordGroupMessages } = require('./utils/groupMessageCounter');
const { createNeonAuthState } = require('./utils/neonAuthState');
const { pick, frases } = require('./utils/personality');

const express = require('express');
const app = express();
const port = process.env.PORT || 8000;
const dataDir = process.env.YUKI_DATA_DIR
    ? path.resolve(process.env.YUKI_DATA_DIR)
    : __dirname;
let currentQr = null;
let currentQrImage = null;
let authStatePromise;
let reconnectTimer;
let authResetPromise;

// --- COLA DE ENVÍO CON CONTROL DE VELOCIDAD ---
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getRandomDelay = (min = 1500, max = 3500) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const MAX_QUEUE_SIZE = 15;

class MessageQueue {
    constructor() {
        this.queue = [];
        this.processing = false;
    }

    // Devuelve false si la cola está llena (se descarta la tarea para no soltar ráfagas)