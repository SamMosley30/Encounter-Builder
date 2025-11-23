import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import EncounterBuilder from './components/EncounterBuilder';
import MonsterCreator from './components/MonsterCreator';
import { getCustomMonsters } from './lib/monster-utils';

function App() {
    const [activeView, setActiveView] = useState('builder');
    const [customMonsters, setCustomMonsters] = useState([]);
    const [monsterToEdit, setMonsterToEdit] = useState(null);
    const [apiKey, setApiKey] = useState('');
    const [showSettings, setShowSettings] = useState(false);

    // Load custom monsters and API key on mount
    useEffect(() => {
        setCustomMonsters(getCustomMonsters());
        const storedKey = localStorage.getItem('gemini_api_key');
        if (storedKey) setApiKey(storedKey);
    }, []);

    const saveApiKey = (key) => {
        setApiKey(key);
        localStorage.setItem('gemini_api_key', key);
        setShowSettings(false);
    };

    const handleMonsterSave = (newMonster) => {
        // Refresh the list
        setCustomMonsters(getCustomMonsters());
        // Reset edit state
        setMonsterToEdit(null);
    };

    const handleClone = (monster) => {
        // Create a copy with a new ID
        const clone = {
            ...monster,
            id: Date.now(),
            name: `${monster.name} (Copy)`,
            source: 'custom' // Ensure it's custom
        };
        setMonsterToEdit(clone);
        setActiveView('creator');
    };

    const handleEdit = (monster) => {
        setMonsterToEdit(monster);
        setActiveView('creator');
    };

    const handleNavigate = (view) => {
        if (view === 'creator') {
            setMonsterToEdit(null); // Reset if manually navigating to creator
        }
        setActiveView(view);
    };

    return (
        <div className="flex h-screen bg-gray-900 text-white font-sans overflow-hidden relative">
            <Sidebar
                activeView={activeView}
                onNavigate={handleNavigate}
                onOpenSettings={() => setShowSettings(true)}
            />

            <main className="flex-1 h-full overflow-hidden p-6">
                {activeView === 'builder' && (
                    <EncounterBuilder
                        customMonsters={customMonsters}
                        onClone={handleClone}
                        onEdit={handleEdit}
                    />
                )}
                {activeView === 'creator' && (
                    <MonsterCreator
                        onSave={handleMonsterSave}
                        initialMonster={monsterToEdit}
                        apiKey={apiKey}
                        onOpenSettings={() => setShowSettings(true)}
                    />
                )}
            </main>

            {/* Settings Modal */}
            {showSettings && (
                <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-2xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold text-white mb-4">Settings</h3>
                        <div className="mb-4">
                            <label className="block text-sm text-gray-400 mb-1">Gemini API Key</label>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Enter your API Key"
                                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-purple-500 outline-none"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Your key is stored locally in your browser.
                                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-purple-400 hover:underline ml-1">Get a key here.</a>
                            </p>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowSettings(false)}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => saveApiKey(apiKey)}
                                className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-medium transition-colors"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
