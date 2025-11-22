import React from 'react';

export default function Sidebar({ activeView, onNavigate }) {
    const navItems = [
        { id: 'builder', label: 'Encounter Builder', icon: '⚔️' },
        { id: 'creator', label: 'Monster Creator', icon: '🐉' },
    ];

    return (
        <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col h-full">
            <div className="p-6 border-b border-gray-700">
                <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                    Encounter Prep
                </h1>
                <p className="text-xs text-gray-500 mt-1">Personal Dashboard</p>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${activeView === item.id
                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20'
                                : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                            }`}
                    >
                        <span className="text-xl">{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t border-gray-700 text-center text-xs text-gray-600">
                Draw Steel Encounter Builder
            </div>
        </div>
    );
}
