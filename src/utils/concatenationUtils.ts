import type { ProcessedFile, ConcatenationOptions } from '../types';

/**
 * Generate a file header based on the format specified
 */
export const generateFileHeader = (
    file: ProcessedFile,
    format: ConcatenationOptions['headerFormat'],
    customTemplate?: string
): string => {
    const separator = '*'.repeat(50);

    switch (format) {
        case 'comment':
            return [
                `/*${separator}`,
                ` * File: ${file.path}`,
                ` * Size: ${file.size} bytes`,
                ` * Modified: ${file.lastModified.toISOString()}`,
                ` ${separator}*/`,
                ''
            ].join('\n');

        case 'markdown':
            return [
                `## ${file.path}`,
                '',
                `- **Size:** ${file.size} bytes`,
                `- **Modified:** ${file.lastModified.toLocaleString()}`,
                '',
                '```',
                ''
            ].join('\n');

        case 'custom':
            if (customTemplate) {
                return customTemplate
                    .replace(/\{path\}/g, file.path)
                    .replace(/\{name\}/g, file.name)
                    .replace(/\{size\}/g, file.size.toString())
                    .replace(/\{modified\}/g, file.lastModified.toISOString())
                    + '\n';
            }
            // Fallback to comment format if no custom template
            return generateFileHeader(file, 'comment');

        default:
            return '';
    }
};

/**
 * Generate a file footer for markdown format
 */
export const generateFileFooter = (format: ConcatenationOptions['headerFormat']): string => {
    switch (format) {
        case 'markdown':
            return '\n```\n';
        default:
            return '';
    }
};

/**
 * Concatenate multiple files into a single string
 */
export const concatenateFiles = (
    files: ProcessedFile[],
    options: ConcatenationOptions
): string => {
    if (files.length === 0) {
        return '';
    }

    const parts: string[] = [];

    // Add main header
    if (options.includeHeaders) {
        const mainHeader = [
            `/*${options.headerFormat === 'markdown' ? '' : '*'.repeat(50)}`,
            options.headerFormat === 'markdown' ? '# File Concatenation Report' : ` * File Concatenation Report`,
            options.headerFormat === 'markdown' ? '' : ` * Generated: ${new Date().toISOString()}`,
            options.headerFormat === 'markdown' ? `Generated: ${new Date().toLocaleString()}` : ` * Total Files: ${files.length}`,
            options.headerFormat === 'markdown' ? `Total Files: ${files.length}` : ` ${'*'.repeat(50)}*/`,
            ''
        ].filter(line => line !== '').join('\n');

        parts.push(mainHeader);
    }

    // Process each file
    files.forEach((file, index) => {
        // Add file header
        if (options.includeHeaders) {
            const header = generateFileHeader(file, options.headerFormat, options.customHeaderTemplate);
            parts.push(header);
        }

        // Add file content
        parts.push(file.content);

        // Add file footer
        if (options.includeHeaders) {
            const footer = generateFileFooter(options.headerFormat);
            if (footer) {
                parts.push(footer);
            }
        }

        // Add separator between files (except for the last file)
        if (index < files.length - 1) {
            parts.push(options.separator);
        }
    });

    return parts.join('\n');
};

/**
 * Get default concatenation options
 */
export const getDefaultConcatenationOptions = (): ConcatenationOptions => ({
    includeHeaders: true,
    headerFormat: 'comment',
    separator: '\n\n'
});

/**
 * Calculate total size of files to be concatenated
 */
export const calculateTotalSize = (files: ProcessedFile[]): number => {
    return files.reduce((total, file) => total + file.size, 0);
};

/**
 * Get concatenation statistics
 */
export const getConcatenationStats = (files: ProcessedFile[]) => {
    const totalSize = calculateTotalSize(files);
    const totalLines = files.reduce((total, file) => {
        return total + file.content.split('\n').length;
    }, 0);

    const fileTypes = files.reduce((types, file) => {
        const ext = file.name.split('.').pop()?.toLowerCase() || 'unknown';
        types[ext] = (types[ext] || 0) + 1;
        return types;
    }, {} as Record<string, number>);

    return {
        fileCount: files.length,
        totalSize,
        totalLines,
        fileTypes,
        averageFileSize: files.length > 0 ? Math.round(totalSize / files.length) : 0
    };
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            // Fallback for older browsers or non-secure contexts
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            const success = document.execCommand('copy');
            document.body.removeChild(textArea);
            return success;
        }
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        return false;
    }
};

/**
 * Download text as a file
 */
export const downloadAsFile = (content: string, filename: string = 'concatenated-files.txt'): void => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL object
    URL.revokeObjectURL(url);
};