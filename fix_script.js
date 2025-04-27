const fs = require('fs');

// Read the file
const content = fs.readFileSync('scripts.js', 'utf8');

// Find all instances of <n> tags
let fixed = content;
fixed = fixed.replace(/<n>'/g, "<name>'");
fixed = fixed.replace(/'<\/n>/g, "'</name>");

// Write the fixed content back
fs.writeFileSync('scripts.js', fixed);

console.log('File fixed'); 