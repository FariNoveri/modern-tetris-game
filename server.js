// server.js - LOADER SCRIPT
require('dotenv').config();
const fs = require('fs');
const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const ENCODING = 'hex';

// Gunakan secret key dari .env
const SECRET_KEY = crypto.createHash('sha256').update(process.env.SECRET_PASSWORD || 'fallback-default-key').digest();

function decrypt(data) {
    try {
        const { iv, content } = data;
        const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, Buffer.from(iv, ENCODING));
        let decrypted = decipher.update(content, ENCODING, 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
        console.error("❌ Gagal mendekripsi server.js:", e.message);
        process.exit(1);
    }
}

try {
    const encryptedData = JSON.parse(fs.readFileSync('encrypted-server.js', 'utf8'));
    const decryptedCode = decrypt(encryptedData);

    // Jalankan kode hasil dekripsi
    eval(decryptedCode);
} catch (e) {
    console.error("❌ Gagal menjalankan server:", e.message);
    process.exit(1);
}