// utils/dbp.js
// Envoltorios con promesas para la base de datos (SQLite o Neon: ambas exponen run/get/all con callbacks).
const db = require('../database/db');

function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function onRun(err) {
            if (err) return reject(err);
            resolve({ changes: (this && this.changes) || 0 });
        });
    });
}

function get(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
    });
}

function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows || [])));
    });
}

module.exports = { run, get, all, db };
