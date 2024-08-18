import type { ExcludePattern } from '../types';
import { createPattern } from './patternUtils';

export interface PatternPreset {
    id: string;
    name: string;
    description: string;
    patterns: Omit<ExcludePattern, 'id' | 'enabled'>[];
}

export const PATTERN_PRESETS: PatternPreset[] = [
    {
        id: 'web-development',
        name: 'Web Development',
        description: 'Common files to exclude in web projects',
        patterns: [
            { type: 'path', pattern: 'node_modules', description: 'Node.js dependencies' },
            { type: 'path', pattern: 'dist', description: 'Build output' },
            { type: 'path', pattern: 'build', description: 'Build directory' },
            { type: 'extension', pattern: 'map', description: 'Source maps' },
            { type: 'glob', pattern: '*.min.*', description: 'Minified files' }
        ]
    },
    {
        id: 'testing',
        name: 'Test Files',
        description: 'Exclude test and spec files',
        patterns: [
            { type: 'glob', pattern: '*.test.*', description: 'Test files' },
            { type: 'glob', pattern: '*.spec.*', description: 'Spec files' },
            { type: 'path', pattern: '__tests__', description: 'Test directories' },
            { type: 'path', pattern: 'coverage', description: 'Coverage reports' }
        ]
    },
    {
        id: 'version-control',
        name: 'Version Control',
        description: 'Git and other VCS files',
        patterns: [
            { type: 'path', pattern: '.git', description: 'Git repository' },
            { type: 'extension', pattern: 'gitignore', description: 'Git ignore files' },
            { type: 'path', pattern: '.svn', description: 'SVN files' },
            { type: 'path', pattern: '.hg', description: 'Mercurial files' }
        ]
    },
    {
        id: 'logs-temp',
        name: 'Logs & Temporary',
        description: 'Log files and temporary data',
        patterns: [
            { type: 'extension', pattern: 'log', description: 'Log files' },
            { type: 'extension', pattern: 'tmp', description: 'Temporary files' },
            { type: 'extension', pattern: 'temp', description: 'Temp files' },
            { type: 'glob', pattern: '*.cache', description: 'Cache files' }
        ]
    },
    {
        id: 'config-env',
        name: 'Config & Environment',
        description: 'Configuration and environment files',
        patterns: [
            { type: 'extension', pattern: 'env', description: 'Environment files' },
            { type: 'glob', pattern: '.env.*', description: 'Environment variants' },
            { type: 'extension', pattern: 'config', description: 'Config files' },
            { type: 'extension', pattern: 'ini', description: 'INI files' }
        ]
    },
    {
        id: 'documentation',
        name: 'Documentation',
        description: 'Documentation and readme files',
        patterns: [
            { type: 'extension', pattern: 'md', description: 'Markdown files' },
            { type: 'extension', pattern: 'txt', description: 'Text files' },
            { type: 'glob', pattern: 'README*', description: 'README files' },
            { type: 'glob', pattern: 'CHANGELOG*', description: 'Changelog files' }
        ]
    }
];

/**
 * Apply a preset to create exclude patterns
 */
export const applyPreset = (preset: PatternPreset): ExcludePattern[] => {
    return preset.patterns.map(pattern =>
        createPattern(pattern.pattern, pattern.type, pattern.description)
    );
};

/**
 * Get patterns for common file types found in the file list
 */
export const suggestPatternsForFiles = (filePaths: string[]): ExcludePattern[] => {
    const suggestions: ExcludePattern[] = [];
    const extensions = new Set<string>();
    const paths = new Set<string>();

    // Analyze file paths
    filePaths.forEach(path => {
        const parts = path.split('/');
        const filename = parts[parts.length - 1];
        const ext = filename.split('.').pop()?.toLowerCase();

        if (ext) {
            extensions.add(ext);
        }

        // Check for common directory patterns
        parts.forEach(part => {
            if (['node_modules', 'dist', 'build', '__tests__', '.git', 'coverage'].includes(part)) {
                paths.add(part);
            }
        });
    });

    // Suggest based on found extensions
    if (extensions.has('test') || extensions.has('spec')) {
        suggestions.push(createPattern('*.test.*', 'glob', 'Test files'));
        suggestions.push(createPattern('*.spec.*', 'glob', 'Spec files'));
    }

    if (extensions.has('min')) {
        suggestions.push(createPattern('*.min.*', 'glob', 'Minified files'));
    }

    if (extensions.has('map')) {
        suggestions.push(createPattern('map', 'extension', 'Source maps'));
    }

    if (extensions.has('log')) {
        suggestions.push(createPattern('log', 'extension', 'Log files'));
    }

    // Suggest based on found paths
    paths.forEach(path => {
        const descriptions: Record<string, string> = {
            'node_modules': 'Node.js dependencies',
            'dist': 'Distribution files',
            'build': 'Build output',
            '__tests__': 'Test directories',
            '.git': 'Git repository',
            'coverage': 'Coverage reports'
        };

        suggestions.push(createPattern(path, 'path', descriptions[path]));
    });

    return suggestions;
};