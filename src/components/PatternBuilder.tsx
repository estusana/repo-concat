import React, { useState } from 'react';
import { PlusIcon, XMarkIcon, BeakerIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useAppStore } from '../stores/useAppStore';
import { createPattern, validatePattern, matchesPattern } from '../utils/patternUtils';
import type { ExcludePattern } from '../types';

interface PatternRule {
    id: string;
    type: ExcludePattern['type'];
    pattern: string;
    enabled: boolean;
}

interface PatternBuilderProps {
    onClose: () => void;
    onSave: (patterns: ExcludePattern[]) => void;
}

export const PatternBuilder: React.FC<PatternBuilderProps> = ({ onClose, onSave }) => {
    const [rules, setRules] = useState<PatternRule[]>([
        { id: '1', type: 'path', pattern: '', enabled: true }
    ]);
    const [testPath, setTestPath] = useState('src/components/Button.test.tsx');
    const { currentFiles } = useAppStore();

    const addRule = () => {
        const newRule: PatternRule = {
            id: Date.now().toString(),
            type: 'path',
            pattern: '',
            enabled: true
        };
        setRules([...rules, newRule]);
    };

    const updateRule = (id: string, updates: Partial<PatternRule>) => {
        setRules(rules.map(rule =>
            rule.id === id ? { ...rule, ...updates } : rule
        ));
    };

    const removeRule = (id: string) => {
        setRules(rules.filter(rule => rule.id !== id));
    };

    const testPattern = (rule: PatternRule): boolean => {
        if (!rule.pattern || !rule.enabled) return false;

        const pattern: ExcludePattern = {
            id: rule.id,
            type: rule.type,
            pattern: rule.pattern,
            enabled: rule.enabled
        };

        return matchesPattern(testPath, pattern);
    };

    const validateRule = (rule: PatternRule): { valid: boolean; error?: string } => {
        if (!rule.pattern.trim()) {
            return { valid: true }; // Empty patterns are valid but inactive
        }
        return validatePattern(rule.pattern, rule.type);
    };

    const handleSave = () => {
        const validRules = rules.filter(rule =>
            rule.pattern.trim() && validateRule(rule).valid
        );

        const patterns = validRules.map(rule =>
            createPattern(rule.pattern, rule.type)
        );

        onSave(patterns);
        onClose();
    };

    const getExampleFiles = () => {
        if (currentFiles.length > 0) {
            return currentFiles.slice(0, 5).map(f => f.path);
        }

        return [
            'src/components/Button.tsx',
            'src/components/Button.test.tsx',
            'src/utils/helpers.js',
            'node_modules/react/index.js',
            'dist/bundle.js',
            '.git/config',
            'README.md'
        ];
    };

    const testAgainstExamples = (rule: PatternRule) => {
        const examples = getExampleFiles();
        return examples.map(path => ({
            path,
            matches: rule.pattern && rule.enabled ? matchesPattern(path, {
                id: rule.id,
                type: rule.type,
                pattern: rule.pattern,
                enabled: rule.enabled
            }) : false
        }));
    };

    return (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">Visual Pattern Builder</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                        Build complex exclude patterns with real-time testing
                    </p>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Pattern Rules */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-md font-medium text-gray-900">Pattern Rules</h4>
                                <button
                                    onClick={addRule}
                                    className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800"
                                >
                                    <PlusIcon className="h-4 w-4 mr-1" />
                                    Add Rule
                                </button>
                            </div>

                            <div className="space-y-3">
                                {rules.map((rule, index) => {
                                    const validation = validateRule(rule);
                                    const isMatching = testPattern(rule);

                                    return (
                                        <div key={rule.id} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-sm font-medium text-gray-700">
                                                    Rule {index + 1}
                                                </span>
                                                <div className="flex items-center space-x-2">
                                                    {rule.pattern && (
                                                        <div className={`flex items-center text-xs px-2 py-1 rounded ${isMatching ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                                            }`}>
                                                            {isMatching ? (
                                                                <>
                                                                    <CheckIcon className="h-3 w-3 mr-1" />
                                                                    Matches
                                                                </>
                                                            ) : (
                                                                'No match'
                                                            )}
                                                        </div>
                                                    )}
                                                    <button
                                                        onClick={() => removeRule(rule.id)}
                                                        className="text-gray-400 hover:text-red-500"
                                                        disabled={rules.length === 1}
                                                    >
                                                        <XMarkIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={rule.enabled}
                                                        onChange={(e) => updateRule(rule.id, { enabled: e.target.checked })}
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                    />
                                                    <select
                                                        value={rule.type}
                                                        onChange={(e) => updateRule(rule.id, { type: e.target.value as ExcludePattern['type'] })}
                                                        className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                                    >
                                                        <option value="path">Path</option>
                                                        <option value="extension">Ext</option>
                                                        <option value="glob">Glob</option>
                                                        <option value="regex">Regex</option>
                                                    </select>
                                                </div>

                                                <input
                                                    type="text"
                                                    value={rule.pattern}
                                                    onChange={(e) => updateRule(rule.id, { pattern: e.target.value })}
                                                    placeholder={
                                                        rule.type === 'extension' ? 'js, css, log' :
                                                            rule.type === 'glob' ? '*.test.js' :
                                                                rule.type === 'regex' ? '\\.(test|spec)\\.' :
                                                                    'node_modules'
                                                    }
                                                    className={`block w-full rounded-md shadow-sm text-sm ${!validation.valid
                                                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                                        }`}
                                                />

                                                {!validation.valid && validation.error && (
                                                    <p className="text-xs text-red-600">{validation.error}</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Testing Panel */}
                        <div className="space-y-4">
                            <h4 className="text-md font-medium text-gray-900">Pattern Testing</h4>

                            {/* Test Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Test File Path
                                </label>
                                <div className="flex items-center space-x-2">
                                    <BeakerIcon className="h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={testPath}
                                        onChange={(e) => setTestPath(e.target.value)}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                        placeholder="Enter a file path to test..."
                                    />
                                </div>
                            </div>

                            {/* Example Files */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Example Files
                                </label>
                                <div className="space-y-1 max-h-64 overflow-y-auto">
                                    {getExampleFiles().map((path, index) => {
                                        const matchingRules = rules.filter(rule =>
                                            rule.pattern && rule.enabled && matchesPattern(path, {
                                                id: rule.id,
                                                type: rule.type,
                                                pattern: rule.pattern,
                                                enabled: rule.enabled
                                            })
                                        );

                                        return (
                                            <div
                                                key={index}
                                                className={`p-2 rounded text-sm cursor-pointer hover:bg-gray-50 ${matchingRules.length > 0
                                                        ? 'bg-red-50 border border-red-200'
                                                        : 'bg-green-50 border border-green-200'
                                                    }`}
                                                onClick={() => setTestPath(path)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <code className="text-xs">{path}</code>
                                                    <span className={`text-xs px-2 py-1 rounded ${matchingRules.length > 0
                                                            ? 'bg-red-100 text-red-800'
                                                            : 'bg-green-100 text-green-800'
                                                        }`}>
                                                        {matchingRules.length > 0 ? 'Excluded' : 'Included'}
                                                    </span>
                                                </div>
                                                {matchingRules.length > 0 && (
                                                    <div className="text-xs text-red-600 mt-1">
                                                        Matched by: {matchingRules.map(r => `${r.type}:${r.pattern}`).join(', ')}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                    >
                        Add Patterns
                    </button>
                </div>
            </div>
        </div>
    );
};