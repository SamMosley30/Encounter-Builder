import React from 'react';

export default function PartyConfig({ config, onChange }) {
    const handleChange = (field, value) => {
        onChange({ ...config, [field]: parseInt(value) || 0 });
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-purple-400">Party Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Hero Level</label>
                    <input
                        type="number"
                        min="1"
                        max="10"
                        value={config.level}
                        onChange={(e) => handleChange('level', e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Party Size</label>
                    <input
                        type="number"
                        min="1"
                        value={config.count}
                        onChange={(e) => handleChange('count', e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Avg. Victories</label>
                    <input
                        type="number"
                        min="0"
                        value={config.victories}
                        onChange={(e) => handleChange('victories', e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                    />
                </div>
            </div>
        </div>
    );
}
