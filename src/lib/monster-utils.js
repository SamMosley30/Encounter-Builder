import monstersData from '../data/monsters.json';

// --- Local Storage Helpers ---

const STORAGE_KEY = 'draw_steel_custom_monsters';

export function getCustomMonsters() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Failed to load custom monsters", e);
        return [];
    }
}

export function saveCustomMonster(monster) {
    const current = getCustomMonsters();
    const existingIndex = current.findIndex(m => m.id === monster.id);

    let updated;
    if (existingIndex >= 0) {
        updated = [...current];
        updated[existingIndex] = monster;
    } else {
        updated = [...current, monster];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
}

export function deleteCustomMonster(monsterId) {
    const current = getCustomMonsters();
    const updated = current.filter(m => m.id !== monsterId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
}

// --- Ability Library ---

export function getAbilityLibrary() {
    const abilities = [];
    const seen = new Set();

    if (!Array.isArray(monstersData)) {
        console.error("monster-utils: monstersData is not an array", monstersData);
        return [];
    }

    monstersData.forEach(monster => {
        if (!monster || !Array.isArray(monster.abilities)) return;

        monster.abilities.forEach(ability => {
            // Create a unique key for the ability to avoid duplicates
            // Using name + type as a rough unique key
            const key = `${ability.name}|${ability.type}`;
            if (!seen.has(key)) {
                seen.add(key);
                abilities.push({
                    ...ability,
                    sourceMonster: monster.name,
                    sourceRole: monster.role
                });
            }
        });
    });

    return abilities.sort((a, b) => a.name.localeCompare(b.name));
}

// --- Auto Math ---

// Averages derived from analysis of the monster data (simplified for this implementation)
// In a real scenario, we might calculate this dynamically or have a lookup table.
// For now, we'll use a heuristic based on the Draw Steel rules/patterns.

const ROLE_MULTIPLIERS = {
    'Minion': { hp: 4, ev: 0.25 }, // Very rough approximation
    'Standard': { hp: 10, ev: 1 },
    'Elite': { hp: 20, ev: 2 },
    'Solo': { hp: 40, ev: 4 },
    'Leader': { hp: 15, ev: 1.5 }, // Leaders vary wildly
    'Artillery': { hp: 0.8, ev: 1 },
    'Controller': { hp: 0.9, ev: 1 },
    'Brute': { hp: 1.2, ev: 1 },
    'Hexer': { hp: 0.8, ev: 1 },
    'Ambusher': { hp: 0.9, ev: 1 },
    'Defender': { hp: 1.3, ev: 1 },
    'Support': { hp: 1.0, ev: 1 },
    'Skirmisher': { hp: 1.0, ev: 1 },
};

export function calculateStats(level, roleString) {
    const lvl = parseInt(level) || 1;

    // Parse role string (e.g., "Minion Artillery" -> ["Minion", "Artillery"])
    const roles = roleString.split(' ');
    let hpMult = 10; // Base

    // Apply multipliers
    roles.forEach(r => {
        if (ROLE_MULTIPLIERS[r]) {
            // If it's a primary rank (Minion, Elite, Solo), it overrides the base
            if (['Minion', 'Elite', 'Solo'].includes(r)) {
                hpMult = ROLE_MULTIPLIERS[r].hp;
            } else if (ROLE_MULTIPLIERS[r]) {
                // Otherwise it modifies it slightly (simplified logic)
                hpMult *= (ROLE_MULTIPLIERS[r].hp / 10); // Normalize
            }
        }
    });

    // EV Calculation (Simplified Table Logic)
    // Level 1 Standard = 3 EV. +1 EV per level roughly? 
    // Actually let's use the table logic from the rules if possible, or a linear approximation.
    // Looking at monsters.json:
    // Lvl 1 Minion: 3 EV (Wait, Minions are grouped. 5 minions = 1 standard usually?)
    // Let's look at the data:
    // Angulotl Cleaver (Minion, Lvl 1) -> EV 3. 
    // Goblin Prowler (Minion, Lvl 1) -> EV 3.
    // Orc (Standard, Lvl 1) -> EV 12? (Need to check data)

    // Let's just use a lookup based on the provided `monsters.json` data if we can, 
    // or just some reasonable defaults.

    // Heuristic:
    // Standard Monster EV ≈ Level * 3 (Very rough)
    // Minion EV ≈ Standard / 4

    // Better approach: Find a monster with similar level/role and copy stats?
    // No, let's just return "Suggested" values.

    const suggestedStamina = Math.floor(lvl * hpMult) + 10;
    const suggestedStability = Math.floor(lvl / 3);
    const suggestedFreeStrike = Math.floor(lvl / 2) + 2;
    const suggestedSpeed = 6; // Standard speed

    // EV is tricky without the table. 
    // Lvl 1 Standard = 12 EV (Based on Daybringer Lvl 1 Leader = 12 EV)
    // Lvl 1 Minion = 3 EV
    let ev = 12 + ((lvl - 1) * 4); // +4 EV per level for standard?

    if (roleString.includes('Minion')) ev = Math.ceil(ev / 4);
    if (roleString.includes('Elite')) ev = ev * 2;
    if (roleString.includes('Solo')) ev = ev * 4;

    return {
        stamina: suggestedStamina,
        stability: suggestedStability,
        freeStrike: suggestedFreeStrike,
        speed: suggestedSpeed,
        ev: ev,
        size: '1M'
    };
}
