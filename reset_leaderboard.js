// reset-leaderboard.js - Tool Interaktif untuk Mengelola Leaderboard dengan Fitur Undo

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

// KONFIGURASI ENKRIPSI
const ALGORITHM = 'aes-256-cbc';
const ENCODING = 'hex';
const SECRET_KEY = crypto.createHash('sha256').update('your-secret-password').digest();

const LEADERBOARD_FILE = path.join(__dirname, 'leaderboard.json.enc');
const BACKUP_FILE = path.join(__dirname, 'leaderboard-backup.json.enc');
const HISTORY_FILE = path.join(__dirname, 'reset-history.json');

// Fungsi untuk membersihkan layar
function clearScreen() {
    console.clear();
    // Alternatif jika console.clear() tidak bekerja:
    // process.stdout.write('\x1Bc');
}

function decrypt(data) {
    const { iv, content } = data;
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, Buffer.from(iv, ENCODING));
    let decrypted = decipher.update(content, ENCODING, 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
}

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

let resetHistory = [];

function loadLeaderboard() {
    if (!fs.existsSync(LEADERBOARD_FILE)) {
        console.log("⚠️ File leaderboard tidak ditemukan!");
        process.exit(1);
    }
    try {
        const data = fs.readFileSync(LEADERBOARD_FILE, 'utf8');
        return decrypt(JSON.parse(data));
    } catch (e) {
        console.error("⚠️ Gagal membaca file leaderboard:", e.message);
        process.exit(1);
    }
}

function saveLeaderboard(data) {
    const encrypted = encrypt(data);
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(encrypted));
    console.log(`💾 Data leaderboard berhasil disimpan.`);
}

function backupLeaderboard(originalData) {
    const encrypted = encrypt(originalData);
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(encrypted));
}

function saveHistory() {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(resetHistory, null, 2));
}

function showLeaderboard(leaderboard) {
    console.log("\n📊 Daftar Leaderboard Saat Ini:");
    console.log("================================");
    if (leaderboard.length === 0) {
        console.log("📭 Leaderboard kosong");
    } else {
        leaderboard.forEach((entry, index) => {
            console.log(`${index + 1}. ${entry.name} — Skor: ${entry.score}, Baris: ${entry.lines}, Level: ${entry.level}`);
        });
    }
    console.log('');
}

function promptUserForDeletion(leaderboard) {
    showLeaderboard(leaderboard);
    
    if (leaderboard.length === 0) {
        console.log("📭 Leaderboard kosong, tidak ada yang bisa dihapus.");
        mainMenu();
        return;
    }

    readline.question("🔍 Masukkan nomor urut atau nama pemain yang ingin dihapus (0 untuk kembali): ", (input) => {
        if (input.trim() === '0') {
            clearScreen();
            console.log("⬅️ Kembali ke menu utama.\n");
            mainMenu();
            return;
        }
        if (!input.trim()) {
            console.log("❌ Input kosong, silakan masukkan nomor atau nama pemain.");
            promptUserForDeletion(leaderboard);
            return;
        }

        let toDelete = null;
        const isNumber = !isNaN(parseInt(input));

        if (isNumber) {
            const index = parseInt(input) - 1;
            if (index >= 0 && index < leaderboard.length) {
                toDelete = leaderboard[index];
            }
        } else {
            toDelete = leaderboard.find(e => e.name.toLowerCase() === input.toLowerCase());
        }

        if (toDelete) {
            const newLeaderboard = leaderboard.filter(e => e.name !== toDelete.name || e.score !== toDelete.score);

            // Simpan ke riwayat
            resetHistory.push({
                type: 'delete',
                entry: toDelete,
                timestamp: Date.now(),
                description: `Hapus pemain "${toDelete.name}" dengan skor ${toDelete.score}`
            });

            backupLeaderboard(leaderboard);
            saveLeaderboard(newLeaderboard);
            saveHistory();
            console.log(`✅ Berhasil menghapus "${toDelete.name}" dari leaderboard.`);
            
            readline.question("\n🔄 Apakah ingin menghapus pemain lain? (y/n/0 untuk menu utama): ", (answer) => {
                if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
                    const updatedLeaderboard = loadLeaderboard();
                    promptUserForDeletion(updatedLeaderboard);
                } else if (answer.trim() === '0') {
                    clearScreen();
                    console.log("⬅️ Kembali ke menu utama.\n");
                    mainMenu();
                } else {
                    console.log("✅ Selesai menghapus pemain.");
                    mainMenu();
                }
            });
        } else {
            console.log("❌ Pemain dengan nama atau nomor tersebut tidak ditemukan.");
            readline.question("\n🔄 Coba lagi? (y/n/0 untuk menu utama): ", (answer) => {
                if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
                    promptUserForDeletion(leaderboard);
                } else if (answer.trim() === '0') {
                    clearScreen();
                    console.log("⬅️ Kembali ke menu utama.\n");
                    mainMenu();
                } else {
                    mainMenu();
                }
            });
        }
    });
}

function promptAutoResetType(leaderboard) {
    if (leaderboard.length === 0) {
        console.log("📭 Leaderboard kosong, tidak ada yang bisa direset.");
        mainMenu();
        return;
    }

    console.log(`
⏰ Pilih Interval Waktu untuk Reset Otomatis:
==========================================
1. 📅 Harian (hapus data lebih dari 1 hari)
2. 🗓️ Mingguan (hapus data lebih dari 1 minggu)
3. 📆 Bulanan (hapus data lebih dari 1 bulan)
4. 🗓️ Tahunan (hapus data lebih dari 1 tahun)
0. ⬅️ Kembali ke menu utama
`);
    readline.question("➡️ Pilih opsi (1/2/3/4/0 untuk menu utama): ", (choice) => {
        if (choice.trim() === '0') {
            clearScreen();
            console.log("⬅️ Kembali ke menu utama.\n");
            mainMenu();
            return;
        }
        
        let cutoffDate = new Date();
        let intervalName = '';
        
        switch (choice.trim()) {
            case '1':
                cutoffDate.setDate(cutoffDate.getDate() - 1);
                intervalName = 'Harian';
                break;
            case '2':
                cutoffDate.setDate(cutoffDate.getDate() - 7);
                intervalName = 'Mingguan';
                break;
            case '3':
                cutoffDate.setMonth(cutoffDate.getMonth() - 1);
                intervalName = 'Bulanan';
                break;
            case '4':
                cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
                intervalName = 'Tahunan';
                break;
            default:
                console.log("❌ Pilihan tidak valid, silakan coba lagi");
                return mainMenu();
        }

        const filtered = leaderboard.filter(entry => {
            const entryDate = entry.date ? new Date(entry.date) : new Date(0);
            return entryDate > cutoffDate;
        });

        const deletedEntries = leaderboard.filter(entry => {
            const entryDate = entry.date ? new Date(entry.date) : new Date(0);
            return entryDate <= cutoffDate;
        });

        if (deletedEntries.length === 0) {
            console.log(`ℹ️ Tidak ada data lama untuk dihapus (interval ${intervalName}).`);
            mainMenu();
            return;
        }

        // Buat entri batch untuk reset berdasarkan waktu
        const batchId = Date.now();
        resetHistory.push({
            type: 'auto-reset-batch',
            entries: deletedEntries,
            timestamp: batchId,
            interval: intervalName,
            cutoffDate: cutoffDate.toISOString(),
            description: `Reset ${intervalName} - ${deletedEntries.length} pemain dihapus`
        });

        backupLeaderboard(leaderboard);
        saveLeaderboard(filtered);
        saveHistory();

        if (filtered.length === 0) {
            console.log(`🧹 Semua data leaderboard telah dihapus (Reset ${intervalName}).`);
        } else {
            console.log(`✅ Reset ${intervalName} selesai - ${deletedEntries.length} pemain dihapus, ${filtered.length} pemain tersisa.`);
        }
        mainMenu();
    });
}

function resetAllLeaderboard(leaderboard) {
    if (leaderboard.length === 0) {
        console.log("📭 Leaderboard sudah kosong.");
        mainMenu();
        return;
    }

    console.log(`\n⚠️ PERINGATAN: Anda akan menghapus semua ${leaderboard.length} pemain dari leaderboard:`);
    showLeaderboard(leaderboard);
    
    readline.question("🛑 Yakin ingin menghapus SEMUA data leaderboard? Ketik 'YA' untuk konfirmasi (0 untuk batal): ", (confirmation) => {
        if (confirmation.trim() === '0') {
            clearScreen();
            console.log("⬅️ Kembali ke menu utama.\n");
            mainMenu();
            return;
        }
        
        if (confirmation === 'YA') {
            // Buat entri batch untuk reset semua
            const batchId = Date.now();
            resetHistory.push({
                type: 'reset-all-batch',
                entries: [...leaderboard],
                timestamp: batchId,
                description: `Reset semua leaderboard - ${leaderboard.length} pemain dihapus`
            });

            backupLeaderboard(leaderboard);
            saveLeaderboard([]);
            saveHistory();
            
            console.log(`🧹 Semua data leaderboard telah dihapus! (${leaderboard.length} pemain)`);
        } else {
            console.log("❌ Reset dibatalkan.");
        }
        mainMenu();
    });
}

function showResetHistoryAndPromptUndo() {
    if (resetHistory.length === 0) {
        console.log("📭 Tidak ada riwayat reset yang tersimpan.");
        mainMenu();
        return;
    }

    // Kelompokkan riwayat berdasarkan jenis
    const deleteHistory = resetHistory.filter(entry => entry.type === 'delete');
    const autoResetHistory = resetHistory.filter(entry => entry.type === 'auto-reset-batch');
    const resetAllHistory = resetHistory.filter(entry => entry.type === 'reset-all-batch');

    console.log(`
📋 Pilih Kategori Riwayat untuk Undo:
===================================
1. 👤 Riwayat Hapus Pemain (${deleteHistory.length} entri)
2. 🧹 Riwayat Reset Semua Leaderboard (${resetAllHistory.length} entri)
3. ⏰ Riwayat Reset Berdasarkan Waktu (${autoResetHistory.length} entri)
4. 🔄 Kembalikan SEMUA data yang pernah dihapus
0. ⬅️ Kembali ke menu utama
`);

    readline.question("➡️ Pilih kategori (1/2/3/4/0 untuk menu utama): ", (category) => {
        if (category.trim() === '0') {
            clearScreen();
            console.log("⬅️ Kembali ke menu utama.\n");
            mainMenu();
            return;
        }
        
        let selectedHistory = [];
        let categoryName = '';

        switch (category.trim()) {
            case '1':
                selectedHistory = deleteHistory;
                categoryName = 'Hapus Pemain';
                break;
            case '2':
                selectedHistory = resetAllHistory;
                categoryName = 'Reset Semua Leaderboard';
                break;
            case '3':
                selectedHistory = autoResetHistory;
                categoryName = 'Reset Berdasarkan Waktu';
                break;
            case '4':
                undoAllEntries();
                return;
            default:
                console.log("❌ Pilihan tidak valid, silakan coba lagi.");
                mainMenu();
                return;
        }

        if (selectedHistory.length === 0) {
            console.log(`📭 Tidak ada riwayat untuk kategori ${categoryName}.`);
            mainMenu();
            return;
        }

        showCategoryHistory(selectedHistory, categoryName);
    });
}

function showCategoryHistory(historyList, categoryName) {
    console.log(`\n📋 Riwayat ${categoryName}:`);
    console.log("=============================");
    historyList.forEach((entry, i) => {
        const date = new Date(entry.timestamp).toLocaleString('id-ID');
        
        if (entry.type === 'delete') {
            console.log(`${i + 1}. ${entry.description} — ${date}`);
        } else if (entry.type === 'auto-reset-batch') {
            console.log(`${i + 1}. ${entry.description} (${entry.cutoffDate.split('T')[0]}) — ${date}`);
        } else if (entry.type === 'reset-all-batch') {
            console.log(`${i + 1}. ${entry.description} — ${date}`);
        }
    });

    console.log(`\n0. ⬅️ Kembali ke menu kategori`);

    readline.question("\n➡️ Masukkan nomor entri untuk undo, 0 untuk kembali ke kategori, atau 'menu' untuk menu utama: ", (input) => {
        if (input.toLowerCase() === 'menu') {
            clearScreen();
            console.log("⬅️ Kembali ke menu utama.\n");
            mainMenu();
            return;
        }
        
        if (input.toLowerCase() === 'batal') {
            console.log("❌ Undo dibatalkan.");
            mainMenu();
            return;
        }

        if (input === '0') {
            showResetHistoryAndPromptUndo();
            return;
        }

        const index = parseInt(input) - 1;
        if (isNaN(index) || index < 0 || index >= historyList.length) {
            console.log("❌ Nomor entri tidak valid, silakan coba lagi.");
            showCategoryHistory(historyList, categoryName);
            return;
        }

        const entryToUndo = historyList[index];
        undoSpecificEntry(entryToUndo);
    });
}

function undoSpecificEntry(entryToUndo) {
    const currentLeaderboard = loadLeaderboard();

    if (entryToUndo.entries) {
        // Batch undo (auto-reset atau reset-all)
        console.log(`\n⚠️ Anda akan mengembalikan ${entryToUndo.entries.length} pemain ke leaderboard:`);
        entryToUndo.entries.forEach((entry, i) => {
            console.log(`${i + 1}. ${entry.name} — Skor: ${entry.score}`);
        });
        
        readline.question("\n🔄 Lanjutkan? Ketik 'YA' untuk konfirmasi (0 untuk menu utama): ", (confirmation) => {
            if (confirmation.trim() === '0') {
                clearScreen();
                console.log("⬅️ Kembali ke menu utama.\n");
                mainMenu();
                return;
            }
            
            if (confirmation === 'YA') {
                // Tambahkan kembali semua entri
                entryToUndo.entries.forEach(entry => {
                    currentLeaderboard.push(entry);
                });
                
                // Urutkan dan hapus duplikat
                const uniqueLeaderboard = currentLeaderboard.filter((entry, index, self) => 
                    index === self.findIndex(e => e.name === entry.name && e.score === entry.score)
                );
                uniqueLeaderboard.sort((a, b) => b.score - a.score);
                
                saveLeaderboard(uniqueLeaderboard);
                
                // Hapus dari riwayat
                const originalIndex = resetHistory.findIndex(h => h.timestamp === entryToUndo.timestamp);
                if (originalIndex !== -1) {
                    resetHistory.splice(originalIndex, 1);
                    saveHistory();
                }
                
                console.log(`✅ Berhasil mengembalikan ${entryToUndo.entries.length} pemain ke leaderboard!`);
            } else {
                console.log("❌ Undo dibatalkan.");
            }
            mainMenu();
        });
    } else if (entryToUndo.entry) {
        // Single undo (delete)
        currentLeaderboard.push(entryToUndo.entry);
        currentLeaderboard.sort((a, b) => b.score - a.score);
        
        saveLeaderboard(currentLeaderboard);
        
        // Hapus dari riwayat
        const originalIndex = resetHistory.findIndex(h => h.timestamp === entryToUndo.timestamp);
        if (originalIndex !== -1) {
            resetHistory.splice(originalIndex, 1);
            saveHistory();
        }
        
        console.log(`✅ Berhasil mengembalikan "${entryToUndo.entry.name}" dengan skor ${entryToUndo.entry.score}`);
        mainMenu();
    }
}

function undoAllEntries() {
    const totalEntries = resetHistory.reduce((total, historyEntry) => {
        if (historyEntry.entries) {
            return total + historyEntry.entries.length;
        } else if (historyEntry.entry) {
            return total + 1;
        }
        return total;
    }, 0);

    console.log(`\n⚠️ PERINGATAN: Anda akan mengembalikan ${totalEntries} pemain ke leaderboard dari semua kategori.`);
    readline.question("🔄 Yakin ingin mengembalikan SEMUA data yang pernah dihapus? Ketik 'YA' untuk konfirmasi (0 untuk menu utama): ", (confirmation) => {
        if (confirmation.trim() === '0') {
            clearScreen();
            console.log("⬅️ Kembali ke menu utama.\n");
            mainMenu();
            return;
        }
        
        if (confirmation === 'YA') {
            const currentLeaderboard = loadLeaderboard();
            
            // Tambahkan semua entri dari riwayat
            resetHistory.forEach(historyEntry => {
                if (historyEntry.entries) {
                    // Batch entries (auto-reset atau reset-all)
                    historyEntry.entries.forEach(entry => {
                        currentLeaderboard.push(entry);
                    });
                } else if (historyEntry.entry) {
                    // Single entry (delete)
                    currentLeaderboard.push(historyEntry.entry);
                }
            });
            
            // Urutkan berdasarkan skor dan hapus duplikat
            const uniqueLeaderboard = currentLeaderboard.filter((entry, index, self) => 
                index === self.findIndex(e => e.name === entry.name && e.score === entry.score)
            );
            uniqueLeaderboard.sort((a, b) => b.score - a.score);
            
            // Simpan leaderboard
            saveLeaderboard(uniqueLeaderboard);
            
            // Kosongkan riwayat
            resetHistory = [];
            saveHistory();
            
            console.log(`✅ Berhasil mengembalikan ${totalEntries} data ke leaderboard!`);
        } else {
            console.log("❌ Undo semua dibatalkan.");
        }
        mainMenu();
    });
}

function loadResetHistory() {
    if (fs.existsSync(HISTORY_FILE)) {
        try {
            const data = fs.readFileSync(HISTORY_FILE, 'utf8');
            resetHistory = JSON.parse(data);
        } catch (e) {
            console.error("⚠️ Gagal memuat riwayat:", e.message);
            resetHistory = [];
        }
    } else {
        resetHistory = [];
    }
}

function mainMenu() {
    console.log(`
🎯 Tool Pengelola Leaderboard Tetris
===================================
1. 👤 Hapus pemain tertentu dari leaderboard
2. ⏰ Reset otomatis berdasarkan waktu
3. 🧹 Hapus semua data leaderboard  
4. 🔄 Kembalikan data yang pernah dihapus (Undo)
0. 🚪 Keluar dari program
`);

    readline.question("➡️ Pilih menu (1/2/3/4/0 untuk keluar): ", (choice) => {
        if (choice.trim() === '0') {
            clearScreen();
            console.log("👋 Terima kasih telah menggunakan Tool Pengelola Leaderboard!\n");
            readline.close();
            process.exit(0);
        }
        
        const leaderboard = loadLeaderboard();

        switch (choice.trim()) {
            case '1':
                promptUserForDeletion(leaderboard);
                break;
            case '2':
                promptAutoResetType(leaderboard);
                break;
            case '3':
                resetAllLeaderboard(leaderboard);
                break;
            case '4':
                showResetHistoryAndPromptUndo();
                break;
            default:
                console.log("❌ Pilihan tidak valid, silakan pilih angka 1-4.");
                mainMenu();
        }
    });
}

function main() {
    clearScreen();
    console.log("\n🚀 Memulai Tool Pengelola Leaderboard...\n");
    loadResetHistory();
    mainMenu();
}

main();