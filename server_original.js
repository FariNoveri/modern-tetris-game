const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ENKRIPSI CONFIG
const ALGORITHM = 'aes-256-cbc';
const ENCODING = 'hex';
const SECRET_KEY = crypto.createHash('sha256').update('your-secret-password').digest();

const LEADERBOARD_FILE = path.join(__dirname, 'leaderboard.json.enc');

// Fungsi enkripsi dan dekripsi
function encrypt(data) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', ENCODING);
    encrypted += cipher.final(ENCODING);
    return {
        iv: iv.toString(ENCODING),
        content: encrypted
    };
}

function decrypt(data) {
    const { iv, content } = data;
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, Buffer.from(iv, ENCODING));
    let decrypted = decipher.update(content, ENCODING, 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
}

// Baca leaderboard dari file
function readLeaderboard() {
    if (!fs.existsSync(LEADERBOARD_FILE)) {
        return [];
    }
    try {
        const data = fs.readFileSync(LEADERBOARD_FILE, 'utf8');
        return decrypt(JSON.parse(data));
    } catch (e) {
        console.error("Error reading or decrypting leaderboard:", e);
        return [];
    }
}

// Simpan leaderboard ke file
function writeLeaderboard(data) {
    const encrypted = encrypt(data);
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(encrypted));
}

// Ambil leaderboard
app.get('/leaderboard', (req, res) => {
    const leaderboard = readLeaderboard();
    res.json(leaderboard);
});

// Submit skor baru
app.post('/submit-score', (req, res) => {
    const newEntry = req.body;
    const currentData = readLeaderboard();

    currentData.push(newEntry);
    currentData.sort((a, b) => b.score - a.score);

    writeLeaderboard(currentData);
    res.json({ success: true });
});

// Reset leaderboard (manual)
app.post('/reset-leaderboard', (req, res) => {
    const { type, value, username } = req.body; // type: "all", "username", "interval"
    let leaderboard = readLeaderboard();

    switch (type) {
        case 'all':
            leaderboard = [];
            break;
        case 'username':
            if (!username) return res.status(400).json({ error: "Username required" });
            leaderboard = leaderboard.filter(entry => entry.name !== username);
            break;
        case 'interval':
            const now = new Date();
            let cutoffDate = new Date(now);

            switch (value) {
                case 'daily': cutoffDate.setDate(now.getDate() - 1); break;
                case 'weekly': cutoffDate.setDate(now.getDate() - 7); break;
                case 'monthly': cutoffDate.setMonth(now.getMonth() - 1); break;
                case 'yearly': cutoffDate.setFullYear(now.getFullYear() - 1); break;
                default:
                    return res.status(400).json({ error: "Invalid interval type" });
            }

            leaderboard = leaderboard.filter(entry => new Date(entry.date) > cutoffDate);
            break;
        default:
            return res.status(400).json({ error: "Invalid reset type" });
    }

    writeLeaderboard(leaderboard);
    res.json({ success: true, message: "Leaderboard reset!" });
});

// Cek auto-reset bulanan saat server start
function autoResetMonthly() {
    const today = new Date();
    if (today.getDate() === 1) {
        const leaderboard = readLeaderboard();
        writeLeaderboard([]);
        console.log("✅ Monthly leaderboard reset triggered");
    }
}

// Jalankan auto-reset
autoResetMonthly();

// Start server
app.listen(PORT, () => {
    console.log(`🎮 Leaderboard server running at http://localhost:${PORT}`);
    console.log(`📁 Leaderboard file: ${LEADERBOARD_FILE}`);
});