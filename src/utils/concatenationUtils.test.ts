import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateFileHeader,
  generateFileFooter,
  concatenateFiles,
  getDefaultConcatenationOptions,
  calculateTotalSize,
  getConcatenationStats,
  copyToClipboard,
  downloadAsFile
} from './concatenationUtils';
import type { ProcessedFile, ConcatenationOptions } from '../types';

describe('concatenationUtils', () => {
  const mockFile: ProcessedFile = {
    id: '1',
    name: 'test.js',
    path: 'src/test.js',
    content: 'console.log("test");',
    size: 100,
    type: 'text/javascript',
    lastModified: new Date('2024-01-01T12:00:00.000Z'),
    isTextFile: true
  };

  describe('generateFileHeader', () => {
    it('should generate comment format header', () => {
      const header = generateFileHeader(mockFile, 'comment');
      expect(header).toContain('File: src/test.js');
      expect(header).toContain('Size: 100 bytes');
      expect(header).toContain('/*');
      expect(header).toContain('*/');
    });

    it('should generate markdown format header', () => {
      const header = generateFileHeader(mockFile, 'markdown');
      expect(header).toContain('## src/test.js');
      expect(header).toContain('**Size:** 100 bytes');
      expect(header).toContain('```');
    });

    it('should generate custom format header with template', () => {
      const template = 'File: {path} | Name: {name} | Size: {size}';
      const header = generateFileHeader(mockFile, 'custom', template);
      expect(header).toBe('File: src/test.js | Name: test.js | Size: 100\n');
    });

    it('should replace all template variables in custom format', () => {
      const template = '{path}-{name}-{size}-{modified}';
      const header = generateFileHeader(mockFile, 'custom', template);
      expect(header).toContain('src/test.js');
      expect(header).toContain('test.js');
      expect(header).toContain('100');
      expect(header).toContain('2024-01-01');
    });

    it('should fallback to comment format when custom template is not provided', () => {
      const header = generateFileHeader(mockFile, 'custom');
      expect(header).toContain('/*');
      expect(header).toContain('File: src/test.js');
    });

    it('should return empty string for none format', () => {
      const header = generateFileHeader(mockFile, 'none');
      expect(header).toBe('');
    });
  });

  describe('generateFileFooter', () => {
    it('should generate markdown footer', () => {
      const footer = generateFileFooter('markdown');
      expect(footer).toBe('\n```\n');
    });

    it('should return empty string for comment format', () => {
      const footer = generateFileFooter('comment');
      expect(footer).toBe('');
    });

    it('should return empty string for none format', () => {
      const footer = generateFileFooter('none');
      expect(footer).toBe('');
    });
  });

  describe('concatenateFiles', () => {
    const file1: ProcessedFile = {
      id: '1',
      name: 'file1.js',
      path: 'file1.js',
      content: 'const a = 1;',
      size: 12,
      type: 'text/javascript',
      lastModified: new Date('2024-01-01'),
      isTextFile: true
    };

    const file2: ProcessedFile = {
      id: '2',
      name: 'file2.js',
      path: 'file2.js',
      content: 'const b = 2;',
      size: 12,
      type: 'text/javascript',
      lastModified: new Date('2024-01-02'),
      isTextFile: true
    };

    it('should concatenate files with headers', () => {
      const options: ConcatenationOptions = {
        includeHeaders: true,
        headerFormat: 'comment',
        separator: '\n\n'
      };

      const result = concatenateFiles([file1, file2], options);

      expect(result).toContain('File Concatenation Report');
      expect(result).toContain('file1.js');
      expect(result).toContain('file2.js');
      expect(result).toContain('const a = 1;');
      expect(result).toContain('const b = 2;');
    });

    it('should concatenate files without headers', () => {
      const options: ConcatenationOptions = {
        includeHeaders: false,
        headerFormat: 'none',
        separator: '\n---\n'
      };

      const result = concatenateFiles([file1, file2], options);

      expect(result).not.toContain('File Concatenation Report');
      expect(result).toContain('const a = 1;');
      expect(result).toContain('const b = 2;');
      expect(result).toContain('\n---\n');
    });

    it('should use custom separator', () => {
      const options: ConcatenationOptions = {
        includeHeaders: false,
        headerFormat: 'none',
        separator: '\n===SEPARATOR===\n'
      };

      const result = concatenateFiles([file1, file2], options);

      expect(result).toContain('===SEPARATOR===');
    });

    it('should not add separator after last file', () => {
      const options: ConcatenationOptions = {
        includeHeaders: false,
        headerFormat: 'none',
        separator: '\n---END---\n'
      };

      const result = concatenateFiles([file1, file2], options);
      const parts = result.split('\n---END---\n');

      // Should only have one separator between two files
      expect(parts.length).toBe(2);
    });

    it('should handle empty file array', () => {
      const options: ConcatenationOptions = {
        includeHeaders: true,
        headerFormat: 'comment',
        separator: '\n\n'
      };

      const result = concatenateFiles([], options);

      expect(result).toBe('');
    });

    it('should handle single file', () => {
      const options: ConcatenationOptions = {
        includeHeaders: true,
        headerFormat: 'comment',
        separator: '\n\n'
      };

      const result = concatenateFiles([file1], options);

      expect(result).toContain('const a = 1;');
      expect(result).not.toContain('\n\n\n'); // No separator for single file
    });

    it('should use markdown format correctly', () => {
      const options: ConcatenationOptions = {
        includeHeaders: true,
        headerFormat: 'markdown',
        separator: '\n\n'
      };

      const result = concatenateFiles([file1], options);

      expect(result).toContain('# File Concatenation Report');
      expect(result).toContain('## file1.js');
      expect(result).toContain('```');
    });

    it('should include custom header template', () => {
      const options: ConcatenationOptions = {
        includeHeaders: true,
        headerFormat: 'custom',
        customHeaderTemplate: '=== {name} ===',
        separator: '\n\n'
      };

      const result = concatenateFiles([file1, file2], options);

      expect(result).toContain('=== file1.js ===');
      expect(result).toContain('=== file2.js ===');
    });
  });

  describe('getDefaultConcatenationOptions', () => {
    it('should return default options', () => {
      const options = getDefaultConcatenationOptions();

      expect(options.includeHeaders).toBe(true);
      expect(options.headerFormat).toBe('comment');
      expect(options.separator).toBe('\n\n');
    });

    it('should return a new object each time', () => {
      const options1 = getDefaultConcatenationOptions();
      const options2 = getDefaultConcatenationOptions();

      expect(options1).not.toBe(options2);
      expect(options1).toEqual(options2);
    });
  });

  describe('calculateTotalSize', () => {
    it('should calculate total size of files', () => {
      const files: ProcessedFile[] = [
        { ...mockFile, size: 100 },
        { ...mockFile, size: 200 },
        { ...mockFile, size: 300 }
      ];

      const total = calculateTotalSize(files);

      expect(total).toBe(600);
    });

    it('should return 0 for empty array', () => {
      const total = calculateTotalSize([]);
      expect(total).toBe(0);
    });

    it('should handle single file', () => {
      const total = calculateTotalSize([mockFile]);
      expect(total).toBe(100);
    });
  });

  describe('getConcatenationStats', () => {
    const file1: ProcessedFile = {
      id: '1',
      name: 'test1.js',
      path: 'test1.js',
      content: 'line1\nline2\nline3',
      size: 100,
      type: 'text/javascript',
      lastModified: new Date(),
      isTextFile: true
    };

    const file2: ProcessedFile = {
      id: '2',
      name: 'test2.ts',
      path: 'test2.ts',
      content: 'line1\nline2',
      size: 200,
      type: 'text/typescript',
      lastModified: new Date(),
      isTextFile: true
    };

    const file3: ProcessedFile = {
      id: '3',
      name: 'test3.js',
      path: 'test3.js',
      content: 'single line',
      size: 50,
      type: 'text/javascript',
      lastModified: new Date(),
      isTextFile: true
    };

    it('should calculate correct statistics', () => {
      const stats = getConcatenationStats([file1, file2, file3]);

      expect(stats.fileCount).toBe(3);
      expect(stats.totalSize).toBe(350);
      expect(stats.totalLines).toBe(6); // 3 + 2 + 1
      expect(stats.averageFileSize).toBe(117); // 350 / 3 rounded
    });

    it('should group files by type', () => {
      const stats = getConcatenationStats([file1, file2, file3]);

      expect(stats.fileTypes).toEqual({
        js: 2,
        ts: 1
      });
    });

    it('should handle empty array', () => {
      const stats = getConcatenationStats([]);

      expect(stats.fileCount).toBe(0);
      expect(stats.totalSize).toBe(0);
      expect(stats.totalLines).toBe(0);
      expect(stats.averageFileSize).toBe(0);
      expect(stats.fileTypes).toEqual({});
    });

    it('should handle files without extensions', () => {
      const fileNoExt: ProcessedFile = {
        ...mockFile,
        name: 'README'
      };

      const stats = getConcatenationStats([fileNoExt]);

      expect(stats.fileTypes).toEqual({
        readme: 1
      });
    });

    it('should count lines correctly including empty last line', () => {
      const fileWithNewline: ProcessedFile = {
        ...mockFile,
        content: 'line1\nline2\n'
      };

      const stats = getConcatenationStats([fileWithNewline]);

      // split('\n') on 'line1\nline2\n' gives ['line1', 'line2', '']
      expect(stats.totalLines).toBe(3);
    });
  });

  describe('copyToClipboard', () => {
    beforeEach(() => {
      // Reset DOM
      document.body.innerHTML = '';
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should copy text using modern clipboard API', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock
        }
      });

      // Mock secure context
      Object.defineProperty(window, 'isSecureContext', {
        value: true,
        writable: true
      });

      const result = await copyToClipboard('test text');

      expect(result).toBe(true);
      expect(writeTextMock).toHaveBeenCalledWith('test text');
    });

    it('should use fallback method when clipboard API is not available', async () => {
      Object.assign(navigator, {
        clipboard: undefined
      });

      const execCommandMock = vi.fn().mockReturnValue(true);
      document.execCommand = execCommandMock;

      const result = await copyToClipboard('test text');

      expect(result).toBe(true);
      expect(execCommandMock).toHaveBeenCalledWith('copy');
    });

    it('should return false on clipboard API error', async () => {
      const writeTextMock = vi.fn().mockRejectedValue(new Error('Clipboard error'));
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock
        }
      });

      Object.defineProperty(window, 'isSecureContext', {
        value: true,
        writable: true
      });

      const result = await copyToClipboard('test text');

      expect(result).toBe(false);
    });

    it('should return false when fallback method fails', async () => {
      Object.assign(navigator, {
        clipboard: undefined
      });

      const execCommandMock = vi.fn().mockReturnValue(false);
      document.execCommand = execCommandMock;

      const result = await copyToClipboard('test text');

      expect(result).toBe(false);
    });
  });

  describe('downloadAsFile', () => {
    beforeEach(() => {
      document.body.innerHTML = '';
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should create and trigger download', () => {
      const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url');
      const revokeObjectURLMock = vi.fn();
      global.URL.createObjectURL = createObjectURLMock;
      global.URL.revokeObjectURL = revokeObjectURLMock;

      const clickMock = vi.fn();
      const createElementSpy = vi.spyOn(document, 'createElement');

      downloadAsFile('test content', 'test.txt');

      const link = document.querySelector('a');
      expect(link).toBeNull(); // Should be removed after click

      expect(createObjectURLMock).toHaveBeenCalled();
      expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should use default filename when not provided', () => {
      const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url');
      const revokeObjectURLMock = vi.fn();
      global.URL.createObjectURL = createObjectURLMock;
      global.URL.revokeObjectURL = revokeObjectURLMock;

      // We can't easily test the download attribute without proper DOM manipulation
      // Just verify the function runs without errors
      downloadAsFile('test content');

      expect(createObjectURLMock).toHaveBeenCalled();
      expect(revokeObjectURLMock).toHaveBeenCalled();
    });

    it('should create blob with correct type', () => {
      const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url');
      global.URL.createObjectURL = createObjectURLMock;
      global.URL.revokeObjectURL = vi.fn();

      downloadAsFile('test content', 'test.txt');

      expect(createObjectURLMock).toHaveBeenCalled();
      const blob = createObjectURLMock.mock.calls[0][0];
      expect(blob.type).toBe('text/plain;charset=utf-8');
    });
  });
});
