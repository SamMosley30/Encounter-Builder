import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');
const BESTIARY_DIR = path.join(PROJECT_ROOT, 'Bestiary', 'Monsters');
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'src', 'data', 'monsters.json');

// Ensure output directory exists
const outputDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

function normalizeEV(evStr) {
    if (!evStr) return 0;
    const match = evStr.toString().match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
}

function parseMarkdownTableFormat(content, filePath) {
    const monsters = [];
    const sections = content.split(/^###### /m);

    for (let i = 1; i < sections.length; i++) {
        const section = sections[i];
        const lines = section.split('\n');
        const name = lines[0].trim();

        const tableLines = lines.filter(line => line.trim().startsWith('|'));
        if (tableLines.length < 4) continue;

        const row1 = tableLines[0].split('|').map(s => s.trim()).filter(s => s);
        const type = row1[0] || '';
        const levelStr = row1[2] || '';
        const roleStr = row1[3] || '';
        const evStr = row1[4] || '';

        const row2 = tableLines[2].split('|').map(s => s.trim()).filter(s => s);
        const size = row2[0] ? row2[0].split('<br')[0].replace(/\*\*/g, '') : '';
        const speed = row2[1] ? row2[1].split('<br')[0].replace(/\*\*/g, '') : '';
        const stamina = row2[2] ? row2[2].split('<br')[0].replace(/\*\*/g, '') : '';
        const stability = row2[3] ? row2[3].split('<br')[0].replace(/\*\*/g, '') : '';
        const freeStrike = row2[4] ? row2[4].split('<br')[0].replace(/\*\*/g, '') : '';

        const abilities = [];
        const abilityStartRegex = /^>\s*(?:[🗡🏹⚔️👤🔳❇️🌀❗️☠️⭐️])?\s*\*\*/;

        let currentAbility = null;
        let capturingTable = false;

        for (const line of lines) {
            if (abilityStartRegex.test(line)) {
                if (currentAbility) {
                    abilities.push(currentAbility);
                }

                const headerMatch = line.match(/>\s*([🗡🏹⚔️👤🔳❇️🌀❗️☠️⭐️])?\s*\*\*([^(]+)(?:\(([^)]+)\))?\*\*/);
                if (headerMatch) {
                    currentAbility = {
                        icon: headerMatch[1] || '',
                        name: headerMatch[2].trim(),
                        type: headerMatch[3] || '',
                        description: '',
                        keywords: [],
                        distance: '',
                        target: ''
                    };
                }
                capturingTable = false;
            } else if (currentAbility && line.trim().startsWith('>')) {
                const content = line.replace(/^>\s?/, '').trim();

                // Detect nested table rows for keywords/distance/target
                if (content.startsWith('|')) {
                    capturingTable = true;
                    const cols = content.split('|').map(c => c.trim()).filter(c => c);
                    // Heuristic: Row 1 usually has keywords | usage
                    // Row 2 is separator
                    // Row 3 has distance | target

                    // We can't easily track row index here without more state, so we'll use regex on content
                    if (cols.length >= 1 && !content.includes('---')) {
                        const col1 = cols[0];
                        const col2 = cols[1];

                        if (col1.includes('📏') || col1.includes('Melee') || col1.includes('Ranged') || col1.includes('Burst')) {
                            currentAbility.distance = col1.replace('📏', '').trim();
                            if (col2) currentAbility.target = col2.replace('🎯', '').trim();
                        } else if (!currentAbility.keywords.length) {
                            // Assume first row is keywords if we haven't found them yet
                            currentAbility.keywords = col1.split(',').map(k => k.trim());
                        }
                    }
                } else if (!capturingTable && content) {
                    currentAbility.description += (currentAbility.description ? '\n' : '') + content;
                }
            }
        }
        if (currentAbility) {
            abilities.push(currentAbility);
        }

        monsters.push({
            name,
            type,
            level: levelStr.replace('Level ', ''),
            role: roleStr,
            ev: normalizeEV(evStr),
            stats: {
                size,
                speed,
                stamina,
                stability,
                freeStrike
            },
            abilities,
            sourceFile: path.relative(PROJECT_ROOT, filePath),
            format: 'markdown'
        });
    }
    return monsters;
}

function parseYamlStatblockFormat(content, filePath) {
    const monsters = [];
    const blockRegex = /~~~ds-statblock\s*([\s\S]*?)\s*~~~/g;
    let match;

    while ((match = blockRegex.exec(content)) !== null) {
        try {
            const yamlContent = match[1];
            const data = yaml.load(yamlContent);

            const abilities = (data.features || []).map(f => {
                let description = '';
                if (f.effects) {
                    description = f.effects.map(e => {
                        if (typeof e === 'string') return e;
                        if (e.name && e.effect) return `**${e.name}:** ${e.effect}`;
                        if (!e.name && e.effect) return e.effect; // Handle traits with just effect
                        if (e.cost && e.effect) return `**${e.cost}:** ${e.effect}`;
                        if (e.roll) {
                            let rollDesc = `**${e.roll}**`;
                            if (e.tier1) rollDesc += `\n• **≤11:** ${e.tier1}`;
                            if (e.tier2) rollDesc += `\n• **12-16:** ${e.tier2}`;
                            if (e.tier3) rollDesc += `\n• **17+:** ${e.tier3}`;
                            return rollDesc;
                        }
                        return '';
                    }).join('\n\n');
                }

                return {
                    icon: f.icon || '',
                    name: f.name,
                    type: f.ability_type || f.feature_type || '',
                    keywords: f.keywords || [],
                    distance: f.distance || '',
                    target: f.target || '',
                    description: description
                };
            });

            monsters.push({
                name: data.name,
                type: (data.ancestry || []).join(', '),
                level: String(data.level),
                role: (data.roles || []).join(' '),
                ev: normalizeEV(data.ev),
                stats: {
                    size: String(data.size),
                    speed: String(data.speed),
                    stamina: String(data.stamina),
                    stability: String(data.stability),
                    freeStrike: String(data.free_strike)
                },
                abilities,
                sourceFile: path.relative(PROJECT_ROOT, filePath),
                format: 'yaml'
            });
        } catch (e) {
            console.error(`Error parsing YAML block in ${filePath}:`, e);
        }
    }
    return monsters;
}

function parseMonsterFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');

    if (content.includes('~~~ds-statblock')) {
        return parseYamlStatblockFormat(content, filePath);
    } else {
        return parseMarkdownTableFormat(content, filePath);
    }
}

function main() {
    console.log('Scanning for monsters...');
    const allMonsters = [];

    function walkDir(dir) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                walkDir(fullPath);
            } else if (file.endsWith('.md') && !file.startsWith('_')) {
                try {
                    const monsters = parseMonsterFile(fullPath);
                    allMonsters.push(...monsters);
                } catch (e) {
                    console.error(`Error parsing ${file}:`, e);
                }
            }
        }
    }

    walkDir(BESTIARY_DIR);

    const uniqueMonsters = new Map();

    for (const monster of allMonsters) {
        const existing = uniqueMonsters.get(monster.name);
        if (!existing) {
            uniqueMonsters.set(monster.name, monster);
        } else {
            if (monster.format === 'yaml' && existing.format !== 'yaml') {
                uniqueMonsters.set(monster.name, monster);
            }
        }
    }

    const finalMonsters = Array.from(uniqueMonsters.values());

    console.log(`Found ${allMonsters.length} entries. Deduplicated to ${finalMonsters.length} monsters.`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalMonsters, null, 2));
    console.log(`Wrote data to ${OUTPUT_FILE}`);
}

main();
