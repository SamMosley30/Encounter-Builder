import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import EncounterBuilder from './components/EncounterBuilder';
import MonsterCreator from './components/MonsterCreator';
import { getCustomMonsters } from './lib/monster-utils';

function App() {
    const [activeView, setActiveView] = useState('builder');
    const [customMonsters, setCustomMonsters] = useState([]);
    const [monsterToEdit, setMonsterToEdit] = useState(null);

    // Load custom monsters on mount
    useEffect(() => {
        setCustomMonsters(getCustomMonsters());
    }, []);

    const handleMonsterSave = (newMonster) => {
        // Refresh the list
        setCustomMonsters(getCustomMonsters());
        // Reset edit state
        setMonsterToEdit(null);
        // Optional: Switch back to builder or stay? Let's stay for now or maybe switch to builder to see it?
        // User might want to create another. Let's just alert (handled in Creator) and stay.
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
        <div className="flex h-screen bg-gray-900 text-white font-sans overflow-hidden">
            <Sidebar activeView={activeView} onNavigate={handleNavigate} />

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
                    />
                )}
            </main>
        </div>
    );
}

export default App;
