import type { ExcludePattern, PatternMatchResult } from '../types';

/**
 * Convert a glob pattern to a regular expression
 * Supports * (any characters) and ? (single character)
 */
export const globToRegex = (pattern: string): RegExp => {
    // Escape special regex characters except * and ?
    const escaped = pattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');

    return new RegExp(`^${escaped}$`, 'i');
};

/**
 * Check if a file path should be excluded based on a single pattern
 */
export const matchesPattern = (filepath: string, pattern: ExcludePattern): boolean => {
    if (!pattern.enabled) {
        return false;
    }

    const normalizedPath = filepath.toLowerCase();
    const normalizedPattern = pattern.pattern.toLowerCase();

    switch (pattern.type) {
        case 'extension': {
            // Match file extension (e.g., ".js", "js")
            const ext = normalizedPattern.startsWith('.') ? normalizedPattern : `.${normalizedPattern}`;
            return normalizedPath.endsWith(ext);
        }

        case 'glob':
            // Match glob patterns (e.g., "*.test.js", "node_modules/*")
            try {
                return globToRegex(normalizedPattern).test(normalizedPath);
            } catch {
                return false;
            }

        case 'regex':
            // Match regular expressions
            try {
                return new RegExp(pattern.pattern, 'i').test(filepath);
            } catch {
                return false;
            }

        case 'path':
            // Match path substring (e.g., "node_modules", "test")
            return normalizedPath.includes(normalizedPattern);

        default:
            return false;
    }
};

/**
 * Check if a file path should be excluded based on all patterns
 */
export const shouldExclude = (filepath: string, patterns: ExcludePattern[]): PatternMatchResult => {
    for (const pattern of patterns) {
        if (matchesPattern(filepath, pattern)) {
            return {
                shouldExclude: true,
                matchedPattern: pattern
            };
        }
    }

    return {
        shouldExclude: false
    };
};

/**
 * Validate a pattern string for the given type
 */
export const validatePattern = (pattern: string, type: ExcludePattern['type']): { valid: boolean; error?: string } => {
    if (!pattern.trim()) {
        return { valid: false, error: 'Pattern cannot be empty' };
    }

    switch (type) {
        case 'extension':
            // Allow extensions with or without leading dot
            if (!/^\.?[a-zA-Z0-9]+$/.test(pattern)) {
                return { valid: false, error: 'Extension must contain only letters and numbers' };
            }
            break;

        case 'glob':
            // Basic validation for glob patterns
            try {
                globToRegex(pattern);
            } catch {
                return { valid: false, error: 'Invalid glob pattern' };
            }
            break;

        case 'regex':
            // Validate regex syntax
            try {
                new RegExp(pattern);
            } catch (error) {
                return { valid: false, error: `Invalid regex: ${error instanceof Error ? error.message : 'Unknown error'}` };
            }
            break;

        case 'path':
            // Path patterns are generally permissive
            if (pattern.includes('..')) {
                return { valid: false, error: 'Path traversal patterns are not allowed' };
            }
            break;
    }

    return { valid: true };
};

/**
 * Generate common exclude patterns based on file extensions found
 */
export const suggestPatterns = (filePaths: string[]): ExcludePattern[] => {
    const suggestions: ExcludePattern[] = [];
    const extensions = new Set<string>();

    // Collect unique extensions
    filePaths.forEach(path => {
        const ext = path.split('.').pop()?.toLowerCase();
        if (ext) {
            extensions.add(ext);
        }
    });

    // Common patterns to suggest
    const commonPatterns = [
        { pattern: 'node_modules', type: 'path' as const, description: 'Node.js dependencies' },
        { pattern: '.git', type: 'path' as const, description: 'Git repository files' },
        { pattern: '*.test.*', type: 'glob' as const, description: 'Test files' },
        { pattern: '*.spec.*', type: 'glob' as const, description: 'Spec files' },
        { pattern: 'dist', type: 'path' as const, description: 'Distribution/build files' },
        { pattern: 'build', type: 'path' as const, description: 'Build output' },
        { pattern: '.env', type: 'extension' as const, description: 'Environment files' },
        { pattern: 'log', type: 'extension' as const, description: 'Log files' }
    ];

    commonPatterns.forEach((pattern, index) => {
        suggestions.push({
            id: `suggestion-${index}`,
            type: pattern.type,
            pattern: pattern.pattern,
            enabled: false,
            description: pattern.description
        });
    });

    return suggestions;
};

/**
 * Create a new exclude pattern with default values
 */
export const createPattern = (
    pattern: string,
    type: ExcludePattern['type'] = 'path',
    description?: string
): ExcludePattern => {
    return {
        id: `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        type,
        pattern,
        enabled: true,
        description
    };
};

/**
 * Get a human-readable description of what a pattern matches
 */
export const getPatternDescription = (pattern: ExcludePattern): string => {
    if (pattern.description) {
        return pattern.description;
    }

    switch (pattern.type) {
        case 'extension':
            return `Files with .${pattern.pattern.replace(/^\./, '')} extension`;
        case 'glob':
            return `Files matching pattern: ${pattern.pattern}`;
        case 'regex':
            return `Files matching regex: ${pattern.pattern}`;
        case 'path':
            return `Files containing: ${pattern.pattern}`;
        default:
            return pattern.pattern;
    }
};