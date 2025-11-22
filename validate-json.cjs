
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'data', 'monsters.json');

try {
    const data = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(data);
    console.log("monsters.json is valid.");
    console.log("Count:", json.length);
    console.log("First item:", json[0].name);
} catch (e) {
    console.error("Error parsing monsters.json:", e.message);
}
