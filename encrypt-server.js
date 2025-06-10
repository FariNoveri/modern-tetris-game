// encrypt-server.js - JANGAN UPLOAD KE REPO!
require('dotenv').config(); // Muat .env
const fs = require('fs');
const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const ENCODING = 'hex';

// Gunakan secret key dari .env
const SECRET_KEY = crypto.createHash('sha256').update(process.env.SECRET_PASSWORD || 'fallback-default-key').digest();

function encrypt(data) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
    let encrypted = cipher.update(data, 'utf8', ENCODING);
    encrypted += cipher.final(ENCODING);
    return {
        iv: iv.toString(ENCODING),
        content: encrypted
    };
}

try {
    const sourceCode = fs.readFileSync('server_original.js', 'utf8');
    const encrypted = encrypt(sourceCode);
    fs.writeFileSync('encrypted-server.js', JSON.stringify(encrypted));
    console.log("✅ server.js berhasil dienkripsi menjadi encrypted-server.js");
} catch (e) {
    console.error("❌ Gagal enkripsi:", e.message);
}