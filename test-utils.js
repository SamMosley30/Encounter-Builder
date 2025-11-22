
const { getCustomMonsters, saveCustomMonster, deleteCustomMonster, getAbilityLibrary, calculateStats } = require('./src/lib/monster-utils.js');

console.log("Testing monster-utils.js...");

try {
    const library = getAbilityLibrary();
    console.log("Ability Library size:", library.length);

    const stats = calculateStats(5, 'Brute');
    console.log("Calculated Stats:", stats);

    console.log("Utils loaded successfully.");
} catch (e) {
    console.error("Error testing utils:", e);
}
