import type { ProcessedFile, FileProcessingResult } from '../types';

// Text file extensions (based on the original bash script)
const TEXT_EXTENSIONS = [
    'txt', 'md', 'mdx', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'scss', 'sass',
    'json', 'xml', 'yaml', 'yml', 'sh', 'bash', 'py', 'rb', 'java', 'c', 'cpp',
    'h', 'hpp', 'cs', 'go', 'rs', 'php', 'pl', 'swift', 'kt', 'config', 'conf',
    'ini', 'csv', 'tsv', 'sql', 'graphql', 'env', 'gitignore', 'dockerignore',
    'vue', 'svelte', 'lua', 'r', 'ps1', 'bat', 'cmd', 'asm', 's', 'groovy',
    'gradle', 'tf', 'toml', 'properties', 'plist'
];

/**
 * Generate a unique ID for files
 */
export const generateId = (): string => {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

/**
 * Check if a file has a text extension
 */
export const hasTextExtension = (filename: string): boolean => {
    const extension = filename.split('.').pop()?.toLowerCase();
    return extension ? TEXT_EXTENSIONS.includes(extension) : false;
};

/**
 * Check if a file is a text file based on MIME type and content analysis
 */
export const isTextFile = async (file: File): Promise<boolean> => {
    // 1. Check extension first (fastest)
    if (hasTextExtension(file.name)) {
        return true;
    }

    // 2. Check MIME type
    if (file.type.startsWith('text/') ||
        file.type === 'application/json' ||
        file.type === 'application/xml' ||
        file.type === 'application/javascript') {
        return true;
    }

    // 3. For unknown types, sample the content
    try {
        const sample = await file.slice(0, 1024).text();
        // Check for binary characters (null bytes and control characters)
        // eslint-disable-next-line no-control-regex
        return !/[\x00-\x08\x0E-\x1F\x7F]/.test(sample);
    } catch {
        return false;
    }
};

/**
 * Process a single file into a ProcessedFile object
 */
export const processFile = async (file: File): Promise<FileProcessingResult> => {
    try {
        const isText = await isTextFile(file);

        if (!isText) {
            return {
                success: false,
                error: `Skipping binary file: ${file.name}`
            };
        }

        const content = await file.text();

        const processedFile: ProcessedFile = {
            id: generateId(),
            name: file.name,
            path: file.webkitRelativePath || file.name,
            content,
            size: file.size,
            type: file.type,
            lastModified: new Date(file.lastModified),
            isTextFile: true
        };

        return {
            success: true,
            file: processedFile
        };
    } catch (error) {
        return {
            success: false,
            error: `Error processing ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
};

/**
 * Process multiple files
 */
export const processFiles = async (files: File[]): Promise<ProcessedFile[]> => {
    const results = await Promise.all(files.map(processFile));
    return results
        .filter(result => result.success && result.file)
        .map(result => result.file!);
};

/**
 * Format file size in human readable format
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || '';
};

/**
 * Validate file name for safety
 */
export const isValidFileName = (filename: string): boolean => {
    // Check for dangerous characters and patterns
    const dangerousPatterns = [
        /\.\./,  // Directory traversal
        /[<>:"|?*]/,  // Invalid filename characters
        /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i  // Windows reserved names
    ];

    return !dangerousPatterns.some(pattern => pattern.test(filename));
};