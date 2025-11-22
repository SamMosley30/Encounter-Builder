import React, { useState } from 'react';
import PartyConfig from './PartyConfig';
import MonsterBrowser from './MonsterBrowser';
import PrintView from './PrintView';
import { calculatePartyES, getEncounterDifficulty, getBudgetRange, DIFFICULTY_LEVELS } from '../lib/encounter-math';

const MonsterCard = ({ monster, onRemove }) => {
    const [expandedAbility, setExpandedAbility] = useState(null);

    const toggleAbility = (index) => {
        setExpandedAbility(expandedAbility === index ? null : index);
    };

    const formatDescription = (text) => {
        if (!text) return null;
        return text.split('\n').map((line, i) => (
            <div key={i} className="mb-1 last:mb-0">
                {line.split(/(\*\*.*?\*\*)/).map((part, j) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={j} className="text-purple-300 font-bold">{part.slice(2, -2)}</strong>;
                    }
                    return part;
                })}
            </div>
        ));
    };

    return (
        <div className="bg-gray-700/50 border border-gray-600 p-4 rounded-lg flex flex-col gap-2 group hover:bg-gray-700 transition-colors">
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-white">{monster.name}</h3>
                        <span className="text-xs bg-gray-600 px-2 py-0.5 rounded text-gray-300">{monster.role}</span>
                        <span className="text-xs bg-gray-600 px-2 py-0.5 rounded text-gray-300">Lvl {monster.level}</span>
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                        EV: {monster.ev} • {monster.stats.size} • HP {monster.stats.stamina} • AC {monster.stats.stability}
                    </div>
                </div>
                <button
                    onClick={() => onRemove(monster.id)}
                    className="text-gray-500 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>

            {/* Abilities Preview */}
            <div className="mt-2 space-y-1 border-t border-gray-600 pt-2">
                {monster.abilities.map((ability, i) => (
                    <div key={i} className="text-sm text-gray-300">
                        <div
                            className="flex items-center gap-2 font-semibold text-purple-300 cursor-pointer hover:text-purple-200 select-none"
                            onClick={() => toggleAbility(i)}
                        >
                            <span>{ability.icon}</span>
                            <span>{ability.name}</span>
                            {ability.type && <span className="text-xs text-gray-500 uppercase tracking-wider">[{ability.type}]</span>}
                            <span className="text-xs text-gray-600 ml-auto transform transition-transform duration-200" style={{ transform: expandedAbility === i ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                        </div>

                        {/* Expanded Description */}
                        {expandedAbility === i && (
                            <div className="mt-1 pl-6 text-gray-400 text-xs leading-relaxed border-l-2 border-gray-600 ml-1">
                                {/* Ability Details Header */}
                                {(ability.keywords?.length > 0 || ability.distance || ability.target) && (
                                    <div className="mb-2 p-2 bg-gray-800/50 rounded text-xs space-y-1">
                                        {ability.keywords?.length > 0 && (
                                            <div className="flex gap-1">
                                                <span className="text-gray-500 font-semibold">Keywords:</span>
                                                <span className="text-gray-300">{ability.keywords.join(', ')}</span>
                                            </div>
                                        )}
                                        {ability.distance && (
                                            <div className="flex gap-1">
                                                <span className="text-gray-500 font-semibold">Distance:</span>
                                                <span className="text-gray-300">{ability.distance}</span>
                                            </div>
                                        )}
                                        {ability.target && (
                                            <div className="flex gap-1">
                                                <span className="text-gray-500 font-semibold">Target:</span>
                                                <span className="text-gray-300">{ability.target}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Description Text */}
                                {ability.description ? formatDescription(ability.description) : <span className="italic text-gray-600">No description available.</span>}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default function EncounterBuilder({ customMonsters, onClone, onEdit }) {
    const [partyConfig, setPartyConfig] = useState({
        level: 1,
        count: 4,
        victories: 0
    });

    const [encounterMonsters, setEncounterMonsters] = useState([]);
    const [showPrintView, setShowPrintView] = useState(false);

    const partyES = calculatePartyES(partyConfig.level, partyConfig.count, partyConfig.victories);

    const totalEV = encounterMonsters.reduce((sum, m) => sum + (parseInt(m.ev) || 0), 0);

    const difficulty = getEncounterDifficulty(partyES, totalEV, partyConfig.count, partyConfig.level);
    const budgetRange = getBudgetRange(difficulty, partyES, partyConfig.level);

    const addMonster = (monster) => {
        setEncounterMonsters([...encounterMonsters, { ...monster, id: Date.now() }]);
    };

    const removeMonster = (id) => {
        setEncounterMonsters(encounterMonsters.filter(m => m.id !== id));
    };

    const getDifficultyColor = (diff) => {
        switch (diff) {
            case DIFFICULTY_LEVELS.TRIVIAL: return 'text-gray-400';
            case DIFFICULTY_LEVELS.EASY: return 'text-green-400';
            case DIFFICULTY_LEVELS.STANDARD: return 'text-blue-400';
            case DIFFICULTY_LEVELS.HARD: return 'text-orange-400';
            case DIFFICULTY_LEVELS.EXTREME: return 'text-red-500';
            default: return 'text-white';
        }
    };

    if (showPrintView) {
        return (
            <PrintView
                encounterMonsters={encounterMonsters}
                partyES={partyES}
                totalEV={totalEV}
                difficulty={difficulty}
                partyCount={partyConfig.count}
                onBack={() => setShowPrintView(false)}
            />
        );
    }

    return (
        <div className="h-full flex flex-col">
            <header className="mb-6 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white">Encounter Builder</h2>
                    <p className="text-gray-400 text-sm">Build balanced encounters for your heroes.</p>
                </div>
                <div className="text-right">
                    <div className="text-sm text-gray-500">Party Encounter Strength</div>
                    <div className="text-2xl font-bold text-purple-400">{partyES}</div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
                {/* Left Column: Config & Browser */}
                <div className="lg:col-span-5 flex flex-col gap-6 h-full overflow-hidden">
                    <PartyConfig config={partyConfig} onChange={setPartyConfig} />
                    <MonsterBrowser
                        onAddMonster={addMonster}
                        customMonsters={customMonsters}
                        onClone={onClone}
                        onEdit={onEdit}
                    />
                </div>

                {/* Right Column: Active Encounter */}
                <div className="lg:col-span-7 bg-gray-800 rounded-lg shadow-lg border border-gray-700 flex flex-col h-full overflow-hidden">
                    <div className="p-6 border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-purple-400">Active Encounter</h2>
                                <button
                                    onClick={() => setShowPrintView(true)}
                                    className="mt-2 text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded flex items-center gap-1 transition-colors"
                                    disabled={encounterMonsters.length === 0}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                    Print / Export
                                </button>
                            </div>
                            <div className="text-right">
                                <div className={`text-3xl font-black ${getDifficultyColor(difficulty)}`}>
                                    {difficulty.toUpperCase()}
                                </div>
                                <div className="text-sm text-gray-400">
                                    Total EV: <span className="text-white font-bold">{totalEV}</span>
                                    <span className="mx-2">|</span>
                                    Budget: {budgetRange.min} - {budgetRange.max}
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-700 rounded-full h-2.5 mb-2">
                            <div
                                className={`h-2.5 rounded-full transition-all duration-500 ${difficulty === DIFFICULTY_LEVELS.EXTREME ? 'bg-red-600' :
                                    difficulty === DIFFICULTY_LEVELS.HARD ? 'bg-orange-500' :
                                        difficulty === DIFFICULTY_LEVELS.STANDARD ? 'bg-blue-500' :
                                            'bg-green-500'
                                    }`}
                                style={{ width: `${Math.min((totalEV / (partyES * 2)) * 100, 100)}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                        {encounterMonsters.length === 0 ? (
                            <div className="text-center text-gray-500 mt-20">
                                <p className="text-xl">No monsters added yet.</p>
                                <p className="text-sm">Select monsters from the browser to build your encounter.</p>
                            </div>
                        ) : (
                            encounterMonsters.map((monster) => (
                                <MonsterCard key={monster.id} monster={monster} onRemove={removeMonster} />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
