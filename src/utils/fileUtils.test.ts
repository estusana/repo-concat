import { describe, it, expect, vi } from 'vitest';
import {
  generateId,
  hasTextExtension,
  isTextFile,
  processFile,
  processFiles,
  formatFileSize,
  getFileExtension,
  isValidFileName
} from './fileUtils';

describe('fileUtils', () => {
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it('should generate non-empty strings', () => {
      const id = generateId();
      expect(id.length).toBeGreaterThan(0);
    });
  });

  describe('hasTextExtension', () => {
    it('should return true for text file extensions', () => {
      expect(hasTextExtension('file.txt')).toBe(true);
      expect(hasTextExtension('file.js')).toBe(true);
      expect(hasTextExtension('file.ts')).toBe(true);
      expect(hasTextExtension('file.md')).toBe(true);
      expect(hasTextExtension('file.json')).toBe(true);
    });

    it('should return false for binary file extensions', () => {
      expect(hasTextExtension('file.exe')).toBe(false);
      expect(hasTextExtension('file.png')).toBe(false);
      expect(hasTextExtension('file.jpg')).toBe(false);
      expect(hasTextExtension('file.pdf')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(hasTextExtension('file.JS')).toBe(true);
      expect(hasTextExtension('file.TXT')).toBe(true);
    });

    it('should handle files without extensions', () => {
      expect(hasTextExtension('README')).toBe(false);
      expect(hasTextExtension('Makefile')).toBe(false);
    });

    it('should handle multiple dots in filename', () => {
      expect(hasTextExtension('file.test.js')).toBe(true);
      expect(hasTextExtension('archive.tar.gz')).toBe(false);
    });
  });

  describe('isTextFile', () => {
    it('should return true for files with text extensions', async () => {
      const file = new File(['content'], 'test.js', { type: 'text/javascript' });
      const result = await isTextFile(file);
      expect(result).toBe(true);
    });

    it('should return true for files with text MIME types', async () => {
      const file = new File(['content'], 'unknown.xyz', { type: 'text/plain' });
      const result = await isTextFile(file);
      expect(result).toBe(true);
    });

    it('should return true for JSON files', async () => {
      const file = new File(['{}'], 'data.json', { type: 'application/json' });
      const result = await isTextFile(file);
      expect(result).toBe(true);
    });

    it('should return true for XML files', async () => {
      const file = new File(['<xml></xml>'], 'data.xml', { type: 'application/xml' });
      const result = await isTextFile(file);
      expect(result).toBe(true);
    });

    it('should return true for JavaScript files', async () => {
      const file = new File(['var x = 1;'], 'app.js', { type: 'application/javascript' });
      const result = await isTextFile(file);
      expect(result).toBe(true);
    });

    it('should detect text content in files with unknown extension', async () => {
      // Create a mock file with text content
      const mockFile = new File(['This is plain text content'], 'unknown.xyz', { type: '' });

      // Mock the slice and text methods
      vi.spyOn(mockFile, 'slice').mockReturnValue({
        text: vi.fn().mockResolvedValue('This is plain text content')
      } as any);

      const result = await isTextFile(mockFile);
      expect(result).toBe(true);
    });

    it('should detect binary content in files', async () => {
      // Create a mock file with binary content (null bytes)
      const mockFile = new File(['binary'], 'unknown.bin', { type: '' });

      // Mock the slice and text methods to return content with null bytes
      vi.spyOn(mockFile, 'slice').mockReturnValue({
        text: vi.fn().mockResolvedValue('binary\x00\x01\x02content')
      } as any);

      const result = await isTextFile(mockFile);
      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      const mockFile = new File(['content'], 'test.xyz', { type: '' });

      vi.spyOn(mockFile, 'slice').mockReturnValue({
        text: vi.fn().mockRejectedValue(new Error('Read error'))
      } as any);

      const result = await isTextFile(mockFile);
      expect(result).toBe(false);
    });
  });

  describe('processFile', () => {
    it('should process a text file successfully', async () => {
      const content = 'console.log("hello");';
      const mockFile = new File([content], 'test.js', {
        type: 'text/javascript',
        lastModified: 1234567890
      });

      // Mock the text() method to return the content
      vi.spyOn(mockFile, 'text').mockResolvedValue(content);

      const result = await processFile(mockFile);

      expect(result.success).toBe(true);
      expect(result.file).toBeDefined();
      expect(result.file?.name).toBe('test.js');
      expect(result.file?.content).toBe('console.log("hello");');
      expect(result.file?.isTextFile).toBe(true);
    });

    it('should skip binary files', async () => {
      const mockFile = new File(['binary'], 'image.xyz', { type: '' });

      vi.spyOn(mockFile, 'slice').mockReturnValue({
        text: vi.fn().mockResolvedValue('\x00\x01\x02binary')
      } as any);

      const result = await processFile(mockFile);

      expect(result.success).toBe(false);
      expect(result.error).toContain('binary file');
    });

    it('should include file metadata', async () => {
      const lastModified = Date.now();
      const file = new File(['content'], 'test.txt', {
        type: 'text/plain',
        lastModified
      });

      const result = await processFile(file);

      expect(result.success).toBe(true);
      expect(result.file?.size).toBe(7); // 'content' is 7 characters
      expect(result.file?.type).toBe('text/plain');
      expect(result.file?.lastModified.getTime()).toBe(lastModified);
    });

    it('should handle webkitRelativePath', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      Object.defineProperty(file, 'webkitRelativePath', {
        value: 'folder/subfolder/test.txt'
      });

      const result = await processFile(file);

      expect(result.success).toBe(true);
      expect(result.file?.path).toBe('folder/subfolder/test.txt');
    });

    it('should use filename as path when webkitRelativePath is empty', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      const result = await processFile(file);

      expect(result.success).toBe(true);
      expect(result.file?.path).toBe('test.txt');
    });

    it('should handle file read errors', async () => {
      const mockFile = new File(['content'], 'test.js', { type: 'text/javascript' });

      vi.spyOn(mockFile, 'text').mockRejectedValue(new Error('Read failed'));

      const result = await processFile(mockFile);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Error processing');
    });
  });

  describe('processFiles', () => {
    it('should process multiple files', async () => {
      const files = [
        new File(['content1'], 'file1.js', { type: 'text/javascript' }),
        new File(['content2'], 'file2.ts', { type: 'text/typescript' })
      ];

      const results = await processFiles(files);

      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('file1.js');
      expect(results[1].name).toBe('file2.ts');
    });

    it('should filter out failed files', async () => {
      const files = [
        new File(['content'], 'file1.js', { type: 'text/javascript' }),
        new File(['binary'], 'file2.xyz', { type: '' })
      ];

      // Mock the second file as binary
      vi.spyOn(files[1], 'slice').mockReturnValue({
        text: vi.fn().mockResolvedValue('\x00\x01binary')
      } as any);

      const results = await processFiles(files);

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('file1.js');
    });

    it('should handle empty file array', async () => {
      const results = await processFiles([]);
      expect(results).toHaveLength(0);
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(100)).toBe('100 Bytes');
      expect(formatFileSize(999)).toBe('999 Bytes');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(10240)).toBe('10 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1572864)).toBe('1.5 MB');
      expect(formatFileSize(10485760)).toBe('10 MB');
    });

    it('should format gigabytes', () => {
      expect(formatFileSize(1073741824)).toBe('1 GB');
      expect(formatFileSize(1610612736)).toBe('1.5 GB');
    });

    it('should round to 2 decimal places', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1234567)).toBe('1.18 MB');
    });
  });

  describe('getFileExtension', () => {
    it('should extract file extensions', () => {
      expect(getFileExtension('file.js')).toBe('js');
      expect(getFileExtension('file.txt')).toBe('txt');
      expect(getFileExtension('archive.tar.gz')).toBe('gz');
    });

    it('should return empty string or filename for files without extension', () => {
      // getFileExtension returns the part after the last dot, lowercased
      // For files without dots, it returns the entire filename lowercased
      expect(getFileExtension('README')).toBe('readme');
      expect(getFileExtension('Makefile')).toBe('makefile');
    });

    it('should handle filenames with multiple dots', () => {
      expect(getFileExtension('file.test.js')).toBe('js');
      expect(getFileExtension('my.long.file.name.txt')).toBe('txt');
    });

    it('should be case insensitive', () => {
      expect(getFileExtension('file.JS')).toBe('js');
      expect(getFileExtension('FILE.TXT')).toBe('txt');
    });

    it('should handle edge cases', () => {
      expect(getFileExtension('.')).toBe('');
      expect(getFileExtension('..')).toBe('');
      expect(getFileExtension('.hidden')).toBe('hidden');
    });
  });

  describe('isValidFileName', () => {
    it('should accept valid filenames', () => {
      expect(isValidFileName('file.txt')).toBe(true);
      expect(isValidFileName('my-file_123.js')).toBe(true);
      expect(isValidFileName('folder/subfolder/file.txt')).toBe(true);
    });

    it('should reject directory traversal patterns', () => {
      expect(isValidFileName('../secret.txt')).toBe(false);
      expect(isValidFileName('folder/../../../etc/passwd')).toBe(false);
    });

    it('should reject invalid filename characters', () => {
      expect(isValidFileName('file<script>.txt')).toBe(false);
      expect(isValidFileName('file>output.txt')).toBe(false);
      expect(isValidFileName('file:colon.txt')).toBe(false);
      expect(isValidFileName('file"quote.txt')).toBe(false);
      expect(isValidFileName('file|pipe.txt')).toBe(false);
      expect(isValidFileName('file?question.txt')).toBe(false);
      expect(isValidFileName('file*star.txt')).toBe(false);
    });

    it('should reject Windows reserved names', () => {
      expect(isValidFileName('CON')).toBe(false);
      expect(isValidFileName('PRN')).toBe(false);
      expect(isValidFileName('AUX')).toBe(false);
      expect(isValidFileName('NUL')).toBe(false);
      expect(isValidFileName('COM1')).toBe(false);
      expect(isValidFileName('LPT1')).toBe(false);
    });

    it('should be case insensitive for reserved names', () => {
      expect(isValidFileName('con')).toBe(false);
      expect(isValidFileName('Con')).toBe(false);
      expect(isValidFileName('CON')).toBe(false);
    });

    it('should allow reserved names in paths', () => {
      // Only reject if the entire filename is reserved, not if it's part of path
      expect(isValidFileName('folder/con/file.txt')).toBe(true);
    });
  });
});
