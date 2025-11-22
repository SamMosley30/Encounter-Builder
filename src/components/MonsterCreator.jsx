import React, { useState, useMemo, useEffect } from 'react';
import { getAbilityLibrary, calculateStats, saveCustomMonster } from '../lib/monster-utils';

export default function MonsterCreator({ onSave, initialMonster }) {
    const [monster, setMonster] = useState({
        id: Date.now(),
        name: '',
        level: 1,
        role: 'Standard',
        type: 'Humanoid',
        ev: 3,
        stats: {
            size: '1M',
            speed: 6,
            stamina: 10,
            stability: 0,
            freeStrike: 2
        },
        abilities: []
    });

    useEffect(() => {
        if (initialMonster) {
            setMonster(initialMonster);
        } else {
            // Reset if no initial monster (e.g. switching from edit to create new)
            setMonster({
                id: Date.now(),
                name: '',
                level: 1,
                role: 'Standard',
                type: 'Humanoid',
                ev: 3,
                stats: {
                    size: '1M',
                    speed: 6,
                    stamina: 10,
                    stability: 0,
                    freeStrike: 2
                },
                abilities: []
            });
        }
    }, [initialMonster]);

    const [searchAbility, setSearchAbility] = useState('');

    const abilityLibrary = useMemo(() => {
        try {
            console.log("MonsterCreator: Loading ability library...");
            const lib = getAbilityLibrary();
            console.log("MonsterCreator: Ability library loaded, count:", lib.length);
            return lib;
        } catch (e) {
            console.error("MonsterCreator: Failed to load ability library", e);
            return [];
        }
    }, []);

    const filteredAbilities = useMemo(() => {
        if (!searchAbility) return [];
        return abilityLibrary.filter(a =>
            a.name.toLowerCase().includes(searchAbility.toLowerCase()) ||
            a.type.toLowerCase().includes(searchAbility.toLowerCase())
        ).slice(0, 20); // Limit results for performance
    }, [searchAbility, abilityLibrary]);

    const handleBasicChange = (field, value) => {
        setMonster(prev => ({ ...prev, [field]: value }));
    };

    const handleStatChange = (field, value) => {
        setMonster(prev => ({
            ...prev,
            stats: { ...prev.stats, [field]: value }
        }));
    };

    const autoCalculate = () => {
        const stats = calculateStats(monster.level, monster.role);
        setMonster(prev => ({
            ...prev,
            ev: stats.ev,
            stats: {
                size: stats.size,
                speed: stats.speed,
                stamina: stats.stamina,
                stability: stats.stability,
                freeStrike: stats.freeStrike
            }
        }));
    };

    const addAbility = (ability) => {
        setMonster(prev => ({
            ...prev,
            abilities: [...prev.abilities, { ...ability, id: Date.now() }] // Add unique ID
        }));
    };

    const removeAbility = (index) => {
        setMonster(prev => ({
            ...prev,
            abilities: prev.abilities.filter((_, i) => i !== index)
        }));
    };

    const handleSave = () => {
        if (!monster.name) return alert("Please give your monster a name!");
        saveCustomMonster(monster);
        if (onSave) onSave(monster);
        alert("Monster Saved!");
    };

    return (
        <div className="h-full flex flex-col gap-6">
            <header>
                <h2 className="text-2xl font-bold text-white">Monster Creator</h2>
                <p className="text-gray-400 text-sm">Forge new threats for your heroes.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
                {/* Left Column: Editor */}
                <div className="lg:col-span-7 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
                    {/* Basic Info */}
                    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-4">
                        <h3 className="text-lg font-bold text-purple-400 border-b border-gray-700 pb-2">Basic Info</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={monster.name}
                                    onChange={(e) => handleBasicChange('name', e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-purple-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Type</label>
                                <input
                                    type="text"
                                    value={monster.type}
                                    onChange={(e) => handleBasicChange('type', e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-purple-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Level</label>
                                <input
                                    type="number"
                                    value={monster.level}
                                    onChange={(e) => handleBasicChange('level', parseInt(e.target.value) || 1)}
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-purple-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Role</label>
                                <select
                                    value={monster.role}
                                    onChange={(e) => handleBasicChange('role', e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-purple-500 outline-none"
                                >
                                    <option value="Minion">Minion</option>
                                    <option value="Standard">Standard</option>
                                    <option value="Elite">Elite</option>
                                    <option value="Solo">Solo</option>
                                    <option value="Leader">Leader</option>
                                    <option value="Artillery">Artillery</option>
                                    <option value="Controller">Controller</option>
                                    <option value="Brute">Brute</option>
                                    <option value="Hexer">Hexer</option>
                                    <option value="Ambusher">Ambusher</option>
                                </select>
                            </div>
                        </div>
                        <button
                            onClick={autoCalculate}
                            className="w-full bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 py-2 rounded border border-purple-500/50 transition-colors text-sm font-semibold"
                        >
                            🪄 Auto-Calculate Stats
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-4">
                        <h3 className="text-lg font-bold text-purple-400 border-b border-gray-700 pb-2">Statistics</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">EV</label>
                                <input
                                    type="number"
                                    value={monster.ev}
                                    onChange={(e) => handleBasicChange('ev', parseInt(e.target.value) || 0)}
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-purple-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Stamina (HP)</label>
                                <input
                                    type="number"
                                    value={monster.stats.stamina}
                                    onChange={(e) => handleStatChange('stamina', parseInt(e.target.value) || 0)}
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-purple-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Speed</label>
                                <input
                                    type="number"
                                    value={monster.stats.speed}
                                    onChange={(e) => handleStatChange('speed', parseInt(e.target.value) || 0)}
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-purple-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Stability</label>
                                <input
                                    type="number"
                                    value={monster.stats.stability}
                                    onChange={(e) => handleStatChange('stability', parseInt(e.target.value) || 0)}
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-purple-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Free Strike</label>
                                <input
                                    type="number"
                                    value={monster.stats.freeStrike}
                                    onChange={(e) => handleStatChange('freeStrike', parseInt(e.target.value) || 0)}
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-purple-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Size</label>
                                <input
                                    type="text"
                                    value={monster.stats.size}
                                    onChange={(e) => handleStatChange('size', e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-purple-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Current Abilities */}
                    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-4">
                        <h3 className="text-lg font-bold text-purple-400 border-b border-gray-700 pb-2">Abilities</h3>
                        {monster.abilities.length === 0 ? (
                            <p className="text-gray-500 italic text-sm">No abilities added yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {monster.abilities.map((ability, idx) => (
                                    <div key={idx} className="bg-gray-700 p-3 rounded flex justify-between items-start group">
                                        <div>
                                            <div className="font-bold text-white flex items-center gap-2">
                                                <span>{ability.icon}</span>
                                                {ability.name}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1 line-clamp-2">{ability.description}</div>
                                        </div>
                                        <button
                                            onClick={() => removeAbility(idx)}
                                            className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleSave}
                        className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded font-bold text-lg shadow-lg transition-colors"
                    >
                        Save Monster
                    </button>
                </div>

                {/* Right Column: Ability Library */}
                <div className="lg:col-span-5 bg-gray-800 rounded-lg border border-gray-700 flex flex-col h-full overflow-hidden">
                    <div className="p-4 border-b border-gray-700 bg-gray-800/50">
                        <h3 className="font-bold text-white mb-2">Ability Library</h3>
                        <input
                            type="text"
                            placeholder="Search abilities..."
                            value={searchAbility}
                            onChange={(e) => setSearchAbility(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:border-purple-500 outline-none"
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                        {filteredAbilities.length === 0 ? (
                            <p className="text-gray-500 text-center text-sm mt-10">
                                {searchAbility ? "No abilities found." : "Search to find abilities."}
                            </p>
                        ) : (
                            filteredAbilities.map((ability, idx) => (
                                <div
                                    key={idx}
                                    className="bg-gray-700 p-3 rounded cursor-pointer hover:bg-gray-600 transition-colors border border-transparent hover:border-purple-500/50"
                                    onClick={() => addAbility(ability)}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="font-bold text-purple-300 text-sm flex items-center gap-2">
                                            <span>{ability.icon}</span>
                                            {ability.name}
                                        </div>
                                        <span className="text-[10px] bg-gray-800 px-1.5 py-0.5 rounded text-gray-400 uppercase">{ability.type}</span>
                                    </div>
                                    <div className="text-xs text-gray-400 mb-1">
                                        Source: {ability.sourceMonster}
                                    </div>
                                    <div className="text-xs text-gray-300 line-clamp-3">
                                        {ability.description}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
