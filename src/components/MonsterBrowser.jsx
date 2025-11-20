import React, { useState, useMemo } from 'react';
import monstersData from '../data/monsters.json';

export default function MonsterBrowser({ onAddMonster }) {
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [levelFilter, setLevelFilter] = useState('');

    const filteredMonsters = useMemo(() => {
        return monstersData.filter(monster => {
            const matchesSearch = monster.name.toLowerCase().includes(search.toLowerCase()) ||
                monster.type.toLowerCase().includes(search.toLowerCase());
            const matchesRole = roleFilter ? monster.role.includes(roleFilter) : true;
            const matchesLevel = levelFilter ? monster.level === levelFilter : true;
            return matchesSearch && matchesRole && matchesLevel;
        });
    }, [search, roleFilter, levelFilter]);

    const roles = [...new Set(monstersData.map(m => m.role.split(' ')[1] || m.role))].sort();
    const levels = [...new Set(monstersData.map(m => m.level))].sort((a, b) => parseInt(a) - parseInt(b));

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 h-full flex flex-col">
            <h2 className="text-xl font-bold mb-4 text-purple-400">Monster Browser</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                <input
                    type="text"
                    placeholder="Search monsters..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
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
                    <div key={`${monster.name}-${idx}`} className="bg-gray-700 p-3 rounded flex justify-between items-center hover:bg-gray-600 transition-colors">
                        <div>
                            <div className="font-bold text-white">{monster.name}</div>
                            <div className="text-xs text-gray-400">
                                Lvl {monster.level} {monster.role} • EV {monster.ev} • {monster.type}
                            </div>
                        </div>
                        <button
                            onClick={() => onAddMonster(monster)}
                            className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                        >
                            Add
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
