import React, { useState } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAppStore } from '../stores/useAppStore';
import { createPattern, validatePattern, getPatternDescription } from '../utils/patternUtils';
import type { ExcludePattern } from '../types';

export const ExcludePatterns: React.FC = () => {
    const [newPattern, setNewPattern] = useState('');
    const [patternType, setPatternType] = useState<ExcludePattern['type']>('path');
    const [validationError, setValidationError] = useState<string>();

    const {
        excludePatterns,
        addExcludePattern,
        removeExcludePattern,
        toggleExcludePattern
    } = useAppStore();

    const handleAddPattern = () => {
        if (!newPattern.trim()) return;

        const validation = validatePattern(newPattern, patternType);
        if (!validation.valid) {
            setValidationError(validation.error);
            return;
        }

        const pattern = createPattern(newPattern.trim(), patternType);
        addExcludePattern(pattern);
        setNewPattern('');
        setValidationError(undefined);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleAddPattern();
        }
    };

    const handlePatternChange = (value: string) => {
        setNewPattern(value);
        if (validationError) {
            setValidationError(undefined);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Exclude Patterns</h3>
                <span className="text-sm text-gray-500">
                    {excludePatterns.filter(p => p.enabled).length} active
                </span>
            </div>

            {/* Add new pattern */}
            <div className="space-y-3">
                <div className="flex space-x-2">
                    <select
                        value={patternType}
                        onChange={(e) => setPatternType(e.target.value as ExcludePattern['type'])}
                        className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                        <option value="path">Path</option>
                        <option value="extension">Extension</option>
                        <option value="glob">Glob</option>
                    </select>

                    <div className="flex-1">
                        <input
                            type="text"
                            value={newPattern}
                            onChange={(e) => handlePatternChange(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={
                                patternType === 'extension' ? 'js, css, log' :
                                    patternType === 'glob' ? '*.test.js, node_modules/*' :
                                        'node_modules, dist, .git'
                            }
                            className={`block w-full rounded-md shadow-sm sm:text-sm pattern-input ${validationError
                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                }`}
                        />
                        {validationError && (
                            <p className="mt-1 text-sm text-red-600">{validationError}</p>
                        )}
                    </div>

                    <button
                        onClick={handleAddPattern}
                        disabled={!newPattern.trim()}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <PlusIcon className="h-4 w-4" />
                    </button>
                </div>

                {/* Pattern type help */}
                <div className="text-xs text-gray-500">
                    {patternType === 'extension' && 'Match files by extension (e.g., "js" matches .js files)'}
                    {patternType === 'glob' && 'Use * for wildcards (e.g., "*.test.js" matches test files)'}
                    {patternType === 'path' && 'Match files containing this text in their path'}
                </div>
            </div>

            {/* Pattern list */}
            {excludePatterns.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Active Patterns</h4>
                    <div className="space-y-1">
                        {excludePatterns.map((pattern) => (
                            <div
                                key={pattern.id}
                                className={`flex items-center justify-between p-2 rounded-md border ${pattern.enabled
                                        ? 'bg-white border-gray-200'
                                        : 'bg-gray-50 border-gray-100'
                                    }`}
                            >
                                <div className="flex items-center space-x-3 flex-1">
                                    <input
                                        type="checkbox"
                                        checked={pattern.enabled}
                                        onChange={() => toggleExcludePattern(pattern.id)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2">
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${pattern.type === 'extension' ? 'bg-green-100 text-green-800' :
                                                    pattern.type === 'glob' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-gray-100 text-gray-800'
                                                }`}>
                                                {pattern.type}
                                            </span>
                                            <code className={`text-sm font-mono ${pattern.enabled ? 'text-gray-900' : 'text-gray-500'
                                                }`}>
                                                {pattern.pattern}
                                            </code>
                                        </div>
                                        <p className={`text-xs mt-1 ${pattern.enabled ? 'text-gray-500' : 'text-gray-400'
                                            }`}>
                                            {getPatternDescription(pattern)}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => removeExcludePattern(pattern.id)}
                                    className="ml-2 p-1 text-gray-400 hover:text-red-500 focus:outline-none focus:text-red-500"
                                >
                                    <XMarkIcon className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {excludePatterns.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                    <p className="text-sm">No exclude patterns defined</p>
                    <p className="text-xs mt-1">Add patterns above to filter out unwanted files</p>
                </div>
            )}
        </div>
    );
};