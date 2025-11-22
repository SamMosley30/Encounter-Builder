import React, { useState, useMemo } from 'react';
import monstersData from '../data/monsters.json';
import { deleteCustomMonster } from '../lib/monster-utils';

export default function MonsterBrowser({ onAddMonster, customMonsters = [], onClone, onEdit }) {
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [levelFilter, setLevelFilter] = useState('');
    const [sourceFilter, setSourceFilter] = useState('all'); // 'all', 'standard', 'custom'

    // Combine standard and custom monsters
    const allMonsters = useMemo(() => {
        if (!Array.isArray(monstersData)) {
            console.error("MonsterBrowser: monstersData is not an array!", monstersData);
            return [];
        }

        // Add a 'source' property to distinguish
        const standard = monstersData.map(m => ({ ...m, source: 'standard' }));
        const custom = customMonsters.map(m => ({ ...m, source: 'custom' }));
        return [...custom, ...standard];
    }, [customMonsters]);

    const filteredMonsters = useMemo(() => {
        return allMonsters.filter(monster => {
            const matchesSearch = monster.name.toLowerCase().includes(search.toLowerCase()) ||
                monster.type.toLowerCase().includes(search.toLowerCase());
            const matchesRole = roleFilter ? monster.role.includes(roleFilter) : true;
            const matchesLevel = levelFilter ? monster.level == levelFilter : true; // Loose equality for string/number mix

            let matchesSource = true;
            if (sourceFilter === 'custom') matchesSource = monster.source === 'custom';
            if (sourceFilter === 'standard') matchesSource = monster.source === 'standard';

            return matchesSearch && matchesRole && matchesLevel && matchesSource;
        });
    }, [search, roleFilter, levelFilter, sourceFilter, allMonsters]);

    const roles = useMemo(() => {
        if (!Array.isArray(monstersData)) return [];
        return [...new Set(monstersData.map(m => m.role.split(' ')[1] || m.role))].sort();
    }, []);
    const levels = useMemo(() => {
        if (!Array.isArray(monstersData)) return [];
        return [...new Set(monstersData.map(m => m.level))].sort((a, b) => parseInt(a) - parseInt(b));
    }, []);

    const handleDelete = (e, monsterId) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this custom monster?')) {
            deleteCustomMonster(monsterId);
            window.location.reload();
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 h-full flex flex-col">
            <h2 className="text-xl font-bold mb-4 text-purple-400">Monster Browser</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                <input
                    type="text"
                    placeholder="Search monsters..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-purple-500 w-full"
                />
                <div className="flex gap-2">
                    <select
                        value={sourceFilter}
                        onChange={(e) => setSourceFilter(e.target.value)}
                        className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-purple-500 flex-1"
                    >
                        <option value="all">All Sources</option>
                        <option value="standard">Standard</option>
                        <option value="custom">Custom</option>
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                    <option value="">All Roles</option>
                    {roles.map(role => <option key={role} value={role}>{role}</option>)}
                </select>
                <select
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value)}
                    className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                    <option value="">All Levels</option>
                    {levels.map(level => <option key={level} value={level}>Level {level}</option>)}
                </select>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                {filteredMonsters.map((monster, idx) => (
                    <div key={`${monster.id || monster.name}-${idx}`} className="bg-gray-700 p-3 rounded flex justify-between items-center hover:bg-gray-600 transition-colors group relative">
                        <div>
                            <div className="font-bold text-white flex items-center gap-2">
                                {monster.name}
                                {monster.source === 'custom' && (
                                    <span className="text-[10px] bg-purple-900 text-purple-300 px-1.5 py-0.5 rounded border border-purple-700">CUSTOM</span>
                                )}
                            </div>
                            <div className="text-xs text-gray-400">
                                Lvl {monster.level} {monster.role} • EV {monster.ev} • {monster.type}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Edit Button (Custom Only) */}
                            {monster.source === 'custom' && onEdit && (
                                <button
                                    onClick={() => onEdit(monster)}
                                    className="text-gray-400 hover:text-blue-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Edit Monster"
                                >
                                    ✏️
                                </button>
                            )}

                            {/* Clone Button (All) */}
                            {onClone && (
                                <button
                                    onClick={() => onClone(monster)}
                                    className="text-gray-400 hover:text-green-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Clone Monster"
                                >
                                    📋
                                </button>
                            )}

                            {/* Delete Button (Custom Only) */}
                            {monster.source === 'custom' && (
                                <button
                                    onClick={(e) => handleDelete(e, monster.id)}
                                    className="text-gray-500 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Delete Custom Monster"
                                >
                                    🗑️
                                </button>
                            )}

                            <button
                                onClick={() => onAddMonster(monster)}
                                className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded text-sm font-medium transition-colors ml-2"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
