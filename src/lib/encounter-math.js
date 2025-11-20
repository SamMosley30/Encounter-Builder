
export const DIFFICULTY_LEVELS = {
    TRIVIAL: 'Trivial',
    EASY: 'Easy',
    STANDARD: 'Standard',
    HARD: 'Hard',
    EXTREME: 'Extreme'
};

// Base Encounter Strength per Hero Level (Level 1-10)
// From "Encounter Strength Table" in rules
const BASE_ES_PER_LEVEL = {
    1: 6,
    2: 8,
    3: 10,
    4: 12,
    5: 14,
    6: 16,
    7: 18,
    8: 20,
    9: 22,
    10: 24
};

export function calculatePartyES(level, heroCount, victories = 0) {
    // "For every 2 Victories the heroes have earned on average, increase the party's encounter strength as if there were another hero in the party."
    const effectiveHeroCount = heroCount + Math.floor(victories / 2);
    const esPerHero = BASE_ES_PER_LEVEL[level] || 0;

    return effectiveHeroCount * esPerHero;
}

export function getEncounterDifficulty(partyES, totalMonsterEV, heroCount, level) {
    // "Encounter Budget" rules
    // Trivial: < ES - (1 Hero ES)
    // Easy: < ES
    // Standard: ES to ES + (1 Hero ES)
    // Hard: > Standard but <= ES + (3 Hero ES)
    // Extreme: > Hard

    const oneHeroES = BASE_ES_PER_LEVEL[level] || 0;

    if (totalMonsterEV < partyES - oneHeroES) return DIFFICULTY_LEVELS.TRIVIAL;
    if (totalMonsterEV < partyES) return DIFFICULTY_LEVELS.EASY;
    if (totalMonsterEV <= partyES + oneHeroES) return DIFFICULTY_LEVELS.STANDARD;
    if (totalMonsterEV <= partyES + (3 * oneHeroES)) return DIFFICULTY_LEVELS.HARD;

    return DIFFICULTY_LEVELS.EXTREME;
}

export function getBudgetRange(difficulty, partyES, level) {
    const oneHeroES = BASE_ES_PER_LEVEL[level] || 0;

    switch (difficulty) {
        case DIFFICULTY_LEVELS.TRIVIAL:
            return { min: 0, max: partyES - oneHeroES - 1 };
        case DIFFICULTY_LEVELS.EASY:
            return { min: partyES - oneHeroES, max: partyES - 1 };
        case DIFFICULTY_LEVELS.STANDARD:
            return { min: partyES, max: partyES + oneHeroES };
        case DIFFICULTY_LEVELS.HARD:
            return { min: partyES + oneHeroES + 1, max: partyES + (3 * oneHeroES) };
        case DIFFICULTY_LEVELS.EXTREME:
            return { min: partyES + (3 * oneHeroES) + 1, max: 9999 };
        default:
            return { min: 0, max: 0 };
    }
}
