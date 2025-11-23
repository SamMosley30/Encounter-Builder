import React, { useState, useMemo, useEffect } from 'react';
import { getAbilityLibrary, calculateStats, saveCustomMonster } from '../lib/monster-utils';
import { generateMonster } from '../lib/gemini-service';

// Helper to format description text (bolding **text**)
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

export default function MonsterCreator({ onSave, initialMonster, apiKey, onOpenSettings }) {
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

    // Ability Editor State
    const [editingAbility, setEditingAbility] = useState(null);
    const [isNewAbility, setIsNewAbility] = useState(false);

    // AI Generation State
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiError, setAiError] = useState(null);

    useEffect(() => {
        if (initialMonster) {
            setMonster(initialMonster);
        } else {
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
            return getAbilityLibrary();
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
        ).slice(0, 20);
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
        // When adding from library, open in editor first? Or just add?
        // User requested: "When I pull an ability... I should be able to edit it"
        // Let's add it, then user can click edit.
        setMonster(prev => ({
            ...prev,
            abilities: [...prev.abilities, { ...ability, id: Date.now() }]
        }));
    };

    const removeAbility = (index) => {
        setMonster(prev => ({
            ...prev,
            abilities: prev.abilities.filter((_, i) => i !== index)
        }));
    };

    const startCreateAbility = () => {
        setEditingAbility({
            id: Date.now(),
            name: 'New Ability',
            icon: '⚔️',
            type: 'Action',
            keywords: [],
            distance: '',
            target: '',
            description: ''
        });
        setIsNewAbility(true);
    };

    const startEditAbility = (ability, index) => {
        setEditingAbility({ ...ability, _index: index });
        setIsNewAbility(false);
    };

    const saveAbility = () => {
        if (!editingAbility.name) return alert("Ability name is required");

        setMonster(prev => {
            const newAbilities = [...prev.abilities];
            if (isNewAbility) {
                newAbilities.push({ ...editingAbility, id: Date.now() });
            } else {
                newAbilities[editingAbility._index] = { ...editingAbility };
                delete newAbilities[editingAbility._index]._index; // Clean up temp index
            }
            return { ...prev, abilities: newAbilities };
        });
        setEditingAbility(null);
    };

    const handleSave = () => {
        if (!monster.name) return alert("Please give your monster a name!");
        saveCustomMonster(monster);
        if (onSave) onSave(monster);
        alert("Monster Saved!");
    };

    const handleAiGenerate = async () => {
        if (!apiKey) {
            alert("Please enter your Gemini API Key in Settings first.");
            onOpenSettings();
            return;
        }
        if (!aiPrompt.trim()) return;

        setIsGenerating(true);
        setAiError(null);

        try {
            const generatedData = await generateMonster(apiKey, aiPrompt);

            // Merge with default structure to ensure safety
            const newMonster = {
                ...monster,
                ...generatedData,
                id: Date.now(),
                stats: { ...monster.stats, ...generatedData.stats },
                abilities: generatedData.abilities.map(a => ({ ...a, id: Date.now() + Math.random() }))
            };

            setMonster(newMonster);
            setShowAiModal(false);
            setAiPrompt('');
        } catch (err) {
            console.error("Generation failed:", err);
            setAiError(err.message || "Failed to generate monster. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="h-full flex flex-col gap-6 relative">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white">Monster Creator</h2>
                    <p className="text-gray-400 text-sm">Forge new threats for your heroes.</p>
                </div>
                <button
                    onClick={() => setShowAiModal(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 transition-all"
                >
                    <span>✨</span> Generate with AI
                </button>
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
                        <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                            <h3 className="text-lg font-bold text-purple-400">Abilities</h3>
                            <button
                                onClick={startCreateAbility}
                                className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-2 py-1 rounded transition-colors"
                            >
                                + New Ability
                            </button>
                        </div>

                        {monster.abilities.length === 0 ? (
                            <p className="text-gray-500 italic text-sm">No abilities added yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {monster.abilities.map((ability, idx) => (
                                    <div key={idx} className="bg-gray-700/50 border border-gray-600 p-3 rounded-lg group relative hover:bg-gray-700 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2 font-bold text-purple-300">
                                                <span>{ability.icon}</span>
                                                <span>{ability.name}</span>
                                                {ability.type && <span className="text-xs text-gray-500 uppercase tracking-wider">[{ability.type}]</span>}
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => startEditAbility(ability, idx)}
                                                    className="text-gray-400 hover:text-blue-400"
                                                    title="Edit"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => removeAbility(idx)}
                                                    className="text-gray-400 hover:text-red-400"
                                                    title="Remove"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>

                                        {/* Ability Details */}
                                        <div className="text-xs text-gray-300 space-y-1">
                                            {(ability.keywords?.length > 0 || ability.distance || ability.target) && (
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-400 mb-1">
                                                    {ability.keywords?.length > 0 && (
                                                        <span><span className="text-gray-500">Keywords:</span> {Array.isArray(ability.keywords) ? ability.keywords.join(', ') : ability.keywords}</span>
                                                    )}
                                                    {ability.distance && (
                                                        <span><span className="text-gray-500">Dist:</span> {ability.distance}</span>
                                                    )}
                                                    {ability.target && (
                                                        <span><span className="text-gray-500">Tgt:</span> {ability.target}</span>
                                                    )}
                                                </div>
                                            )}
                                            <div className="text-gray-300 leading-relaxed">
                                                {formatDescription(ability.description)}
                                            </div>
                                        </div>
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

            {/* Ability Editor Modal */}
            {editingAbility && (
                <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-2xl w-full max-w-2xl flex flex-col max-h-full">
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">
                                {isNewAbility ? 'Create Ability' : 'Edit Ability'}
                            </h3>
                            <button
                                onClick={() => setEditingAbility(null)}
                                className="text-gray-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={editingAbility.name}
                                        onChange={(e) => setEditingAbility({ ...editingAbility, name: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-purple-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Icon (Emoji)</label>
                                    <input
                                        type="text"
                                        value={editingAbility.icon || ''}
                                        onChange={(e) => setEditingAbility({ ...editingAbility, icon: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-purple-500 outline-none"
                                        placeholder="⚔️"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Type</label>
                                    <select
                                        value={editingAbility.type || 'Action'}
                                        onChange={(e) => setEditingAbility({ ...editingAbility, type: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-purple-500 outline-none"
                                    >
                                        <option value="Action">Action</option>
                                        <option value="Maneuver">Maneuver</option>
                                        <option value="Triggered">Triggered</option>
                                        <option value="Trait">Trait</option>
                                        <option value="Signature">Signature</option>
                                        <option value="Villain">Villain</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Keywords (comma separated)</label>
                                    <input
                                        type="text"
                                        value={Array.isArray(editingAbility.keywords) ? editingAbility.keywords.join(', ') : editingAbility.keywords || ''}
                                        onChange={(e) => setEditingAbility({ ...editingAbility, keywords: e.target.value.split(',').map(s => s.trim()) })}
                                        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-purple-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Distance</label>
                                    <input
                                        type="text"
                                        value={editingAbility.distance || ''}
                                        onChange={(e) => setEditingAbility({ ...editingAbility, distance: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-purple-500 outline-none"
                                        placeholder="e.g. Melee 1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Target</label>
                                    <input
                                        type="text"
                                        value={editingAbility.target || ''}
                                        onChange={(e) => setEditingAbility({ ...editingAbility, target: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-purple-500 outline-none"
                                        placeholder="e.g. One creature"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Description (Supports **bold**)</label>
                                <textarea
                                    value={editingAbility.description || ''}
                                    onChange={(e) => setEditingAbility({ ...editingAbility, description: e.target.value })}
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-purple-500 outline-none h-32 resize-none"
                                    placeholder="Describe the ability..."
                                />
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-700 flex justify-end gap-2">
                            <button
                                onClick={() => setEditingAbility(null)}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveAbility}
                                className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-medium transition-colors"
                            >
                                {isNewAbility ? 'Create Ability' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Generation Modal */}
            {showAiModal && (
                <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-2xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                                Generate with Gemini AI
                            </h3>
                            <button
                                onClick={() => setShowAiModal(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm text-gray-400 mb-2">Describe your monster:</label>
                            <textarea
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-purple-500 outline-none h-32 resize-none"
                                placeholder="e.g. A cybernetic zombie dragon breathing neon fire..."
                            />
                            {aiError && (
                                <p className="text-red-400 text-xs mt-2">{aiError}</p>
                            )}
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowAiModal(false)}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                disabled={isGenerating}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAiGenerate}
                                disabled={isGenerating || !aiPrompt.trim()}
                                className={`px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded font-medium transition-all flex items-center gap-2 ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:from-blue-500 hover:to-purple-500'}`}
                            >
                                {isGenerating ? (
                                    <>
                                        <span className="animate-spin">✨</span> Generating...
                                    </>
                                ) : (
                                    <>
                                        <span>✨</span> Generate
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
