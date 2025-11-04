import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStore } from './useAppStore';
import type { ProcessedFile, ExcludePattern } from '../types';

// Mock the collection service
vi.mock('../services/collectionService', () => ({
  collectionService: {
    saveCollection: vi.fn().mockResolvedValue(1),
    getAllCollections: vi.fn().mockResolvedValue([]),
    loadCollection: vi.fn(),
    deleteCollection: vi.fn()
  }
}));

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.setState({
      currentFiles: [],
      excludePatterns: [],
      collections: [],
      activeCollectionId: undefined,
      isProcessing: false,
      selectedFiles: [],
      previewFile: undefined,
      processingProgress: 0,
      processingError: undefined,
      settings: {
        includeHeaders: true,
        headerFormat: 'comment',
        sortBy: 'name',
        sortOrder: 'asc'
      }
    });
  });

  describe('initial state', () => {
    it('should have empty arrays for files and patterns', () => {
      const state = useAppStore.getState();
      expect(state.currentFiles).toEqual([]);
      expect(state.excludePatterns).toEqual([]);
    });

    it('should not be processing initially', () => {
      const state = useAppStore.getState();
      expect(state.isProcessing).toBe(false);
      expect(state.processingProgress).toBe(0);
    });

    it('should have default settings', () => {
      const state = useAppStore.getState();
      expect(state.settings.includeHeaders).toBe(true);
      expect(state.settings.headerFormat).toBe('comment');
      expect(state.settings.sortBy).toBe('name');
      expect(state.settings.sortOrder).toBe('asc');
    });
  });

  describe('file operations', () => {
    const mockFile: ProcessedFile = {
      id: '1',
      name: 'test.js',
      path: 'test.js',
      content: 'code',
      size: 100,
      type: 'text/javascript',
      lastModified: new Date(),
      isTextFile: true
    };

    it('should set current files', () => {
      useAppStore.getState().setCurrentFiles([mockFile]);
      const state = useAppStore.getState();
      expect(state.currentFiles).toHaveLength(1);
      expect(state.currentFiles[0]).toEqual(mockFile);
    });

    it('should add files', () => {
      const file2: ProcessedFile = { ...mockFile, id: '2', name: 'test2.js' };

      useAppStore.getState().setCurrentFiles([mockFile]);
      useAppStore.getState().addFiles([file2]);

      const state = useAppStore.getState();
      expect(state.currentFiles).toHaveLength(2);
    });

    it('should remove file', () => {
      useAppStore.getState().setCurrentFiles([mockFile]);
      useAppStore.getState().removeFile('1');

      const state = useAppStore.getState();
      expect(state.currentFiles).toHaveLength(0);
    });

    it('should remove file from selection when removed', () => {
      useAppStore.getState().setCurrentFiles([mockFile]);
      useAppStore.getState().setSelectedFiles(['1']);
      useAppStore.getState().removeFile('1');

      const state = useAppStore.getState();
      expect(state.selectedFiles).not.toContain('1');
    });

    it('should clear preview when preview file is removed', () => {
      useAppStore.getState().setCurrentFiles([mockFile]);
      useAppStore.getState().setPreviewFile(mockFile);
      useAppStore.getState().removeFile('1');

      const state = useAppStore.getState();
      expect(state.previewFile).toBeUndefined();
    });

    it('should clear all files', () => {
      useAppStore.getState().setCurrentFiles([mockFile]);
      useAppStore.getState().setSelectedFiles(['1']);
      useAppStore.getState().setPreviewFile(mockFile);
      useAppStore.getState().clearFiles();

      const state = useAppStore.getState();
      expect(state.currentFiles).toHaveLength(0);
      expect(state.selectedFiles).toHaveLength(0);
      expect(state.previewFile).toBeUndefined();
    });
  });

  describe('exclude pattern operations', () => {
    const mockPattern: ExcludePattern = {
      id: '1',
      type: 'extension',
      pattern: 'js',
      enabled: true
    };

    it('should set exclude patterns', () => {
      useAppStore.getState().setExcludePatterns([mockPattern]);
      const state = useAppStore.getState();
      expect(state.excludePatterns).toHaveLength(1);
      expect(state.excludePatterns[0]).toEqual(mockPattern);
    });

    it('should add exclude pattern', () => {
      const pattern2: ExcludePattern = { ...mockPattern, id: '2', pattern: 'ts' };

      useAppStore.getState().setExcludePatterns([mockPattern]);
      useAppStore.getState().addExcludePattern(pattern2);

      const state = useAppStore.getState();
      expect(state.excludePatterns).toHaveLength(2);
    });

    it('should remove exclude pattern', () => {
      useAppStore.getState().setExcludePatterns([mockPattern]);
      useAppStore.getState().removeExcludePattern('1');

      const state = useAppStore.getState();
      expect(state.excludePatterns).toHaveLength(0);
    });

    it('should toggle exclude pattern', () => {
      useAppStore.getState().setExcludePatterns([mockPattern]);
      useAppStore.getState().toggleExcludePattern('1');

      let state = useAppStore.getState();
      expect(state.excludePatterns[0].enabled).toBe(false);

      useAppStore.getState().toggleExcludePattern('1');
      state = useAppStore.getState();
      expect(state.excludePatterns[0].enabled).toBe(true);
    });
  });

  describe('selection operations', () => {
    beforeEach(() => {
      const files: ProcessedFile[] = [
        { id: '1', name: 'file1.js', path: 'file1.js', content: '', size: 0, type: '', lastModified: new Date(), isTextFile: true },
        { id: '2', name: 'file2.js', path: 'file2.js', content: '', size: 0, type: '', lastModified: new Date(), isTextFile: true },
        { id: '3', name: 'file3.js', path: 'file3.js', content: '', size: 0, type: '', lastModified: new Date(), isTextFile: true }
      ];
      useAppStore.getState().setCurrentFiles(files);
    });

    it('should set selected files', () => {
      useAppStore.getState().setSelectedFiles(['1', '2']);
      const state = useAppStore.getState();
      expect(state.selectedFiles).toEqual(['1', '2']);
    });

    it('should toggle file selection on', () => {
      useAppStore.getState().toggleFileSelection('1');
      const state = useAppStore.getState();
      expect(state.selectedFiles).toContain('1');
    });

    it('should toggle file selection off', () => {
      useAppStore.getState().setSelectedFiles(['1', '2']);
      useAppStore.getState().toggleFileSelection('1');

      const state = useAppStore.getState();
      expect(state.selectedFiles).not.toContain('1');
      expect(state.selectedFiles).toContain('2');
    });

    it('should select all files', () => {
      useAppStore.getState().selectAllFiles();
      const state = useAppStore.getState();
      expect(state.selectedFiles).toEqual(['1', '2', '3']);
    });

    it('should clear selection', () => {
      useAppStore.getState().setSelectedFiles(['1', '2']);
      useAppStore.getState().clearSelection();

      const state = useAppStore.getState();
      expect(state.selectedFiles).toHaveLength(0);
    });
  });

  describe('UI state operations', () => {
    const mockFile: ProcessedFile = {
      id: '1',
      name: 'test.js',
      path: 'test.js',
      content: 'code',
      size: 100,
      type: 'text/javascript',
      lastModified: new Date(),
      isTextFile: true
    };

    it('should set preview file', () => {
      useAppStore.getState().setPreviewFile(mockFile);
      const state = useAppStore.getState();
      expect(state.previewFile).toEqual(mockFile);
    });

    it('should clear preview file', () => {
      useAppStore.getState().setPreviewFile(mockFile);
      useAppStore.getState().setPreviewFile(undefined);

      const state = useAppStore.getState();
      expect(state.previewFile).toBeUndefined();
    });

    it('should set processing state', () => {
      useAppStore.getState().setProcessing(true);
      let state = useAppStore.getState();
      expect(state.isProcessing).toBe(true);

      useAppStore.getState().setProcessing(false);
      state = useAppStore.getState();
      expect(state.isProcessing).toBe(false);
    });

    it('should set processing progress', () => {
      useAppStore.getState().setProcessingProgress(50);
      const state = useAppStore.getState();
      expect(state.processingProgress).toBe(50);
    });

    it('should set processing error', () => {
      useAppStore.getState().setProcessingError('Test error');
      let state = useAppStore.getState();
      expect(state.processingError).toBe('Test error');

      useAppStore.getState().setProcessingError(undefined);
      state = useAppStore.getState();
      expect(state.processingError).toBeUndefined();
    });
  });

  describe('settings operations', () => {
    it('should update settings', () => {
      useAppStore.getState().updateSettings({
        includeHeaders: false,
        headerFormat: 'markdown'
      });

      const state = useAppStore.getState();
      expect(state.settings.includeHeaders).toBe(false);
      expect(state.settings.headerFormat).toBe('markdown');
      // Other settings should remain unchanged
      expect(state.settings.sortBy).toBe('name');
    });

    it('should partially update settings', () => {
      useAppStore.getState().updateSettings({ includeHeaders: false });

      const state = useAppStore.getState();
      expect(state.settings.includeHeaders).toBe(false);
      expect(state.settings.headerFormat).toBe('comment'); // unchanged
    });
  });

  describe('collection operations', () => {
    it('should set collections', () => {
      const collections = [
        { id: 1, name: 'Collection 1', files: [], excludePatterns: [], settings: {} as any, createdAt: new Date(), updatedAt: new Date() }
      ];

      useAppStore.getState().setCollections(collections);
      const state = useAppStore.getState();
      expect(state.collections).toEqual(collections);
    });

    it('should set active collection', () => {
      useAppStore.getState().setActiveCollection(1);
      let state = useAppStore.getState();
      expect(state.activeCollectionId).toBe(1);

      useAppStore.getState().setActiveCollection(undefined);
      state = useAppStore.getState();
      expect(state.activeCollectionId).toBeUndefined();
    });

    it('should save current as collection', async () => {
      const mockFile: ProcessedFile = {
        id: '1',
        name: 'test.js',
        path: 'test.js',
        content: 'code',
        size: 100,
        type: 'text/javascript',
        lastModified: new Date(),
        isTextFile: true
      };

      useAppStore.getState().setCurrentFiles([mockFile]);

      await useAppStore.getState().saveCurrentAsCollection('Test Collection');

      const state = useAppStore.getState();
      expect(state.activeCollectionId).toBe(1);
    });

    it('should handle save collection error gracefully', async () => {
      const { collectionService } = await import('../services/collectionService');
      vi.mocked(collectionService.saveCollection).mockRejectedValueOnce(new Error('Save failed'));

      // Should not throw
      await expect(
        useAppStore.getState().saveCurrentAsCollection('Test')
      ).resolves.toBeUndefined();
    });
  });
});
