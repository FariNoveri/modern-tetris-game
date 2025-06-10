const fs = require('fs');
const crypto = require('crypto');

const data = fs.readFileSync('script.js');
const hash = crypto.createHash('sha256').update(data).digest('hex');
console.log(hash);