import { create } from 'zustand';
import type { ProcessedFile, ExcludePattern, FileCollection, CollectionSettings } from '../types';
import { collectionService } from '../services/collectionService';

interface AppState {
    // Current working data
    currentFiles: ProcessedFile[];
    excludePatterns: ExcludePattern[];

    // Collections
    collections: FileCollection[];
    activeCollectionId?: number;

    // UI state
    isProcessing: boolean;
    selectedFiles: string[];
    previewFile?: ProcessedFile;

    // Processing state
    processingProgress: number;
    processingError?: string;

    // Settings
    settings: CollectionSettings;

    // Actions
    setCurrentFiles: (files: ProcessedFile[]) => void;
    addFiles: (files: ProcessedFile[]) => void;
    removeFile: (id: string) => void;
    clearFiles: () => void;

    setExcludePatterns: (patterns: ExcludePattern[]) => void;
    addExcludePattern: (pattern: ExcludePattern) => void;
    removeExcludePattern: (id: string) => void;
    toggleExcludePattern: (id: string) => void;

    setSelectedFiles: (ids: string[]) => void;
    toggleFileSelection: (id: string) => void;
    selectAllFiles: () => void;
    clearSelection: () => void;

    setPreviewFile: (file?: ProcessedFile) => void;

    setProcessing: (isProcessing: boolean) => void;
    setProcessingProgress: (progress: number) => void;
    setProcessingError: (error?: string) => void;

    updateSettings: (settings: Partial<CollectionSettings>) => void;

    // Collection management
    setCollections: (collections: FileCollection[]) => void;
    setActiveCollection: (id?: number) => void;
    saveCurrentAsCollection: (name: string) => Promise<void>;
    loadCollection: (id: number) => Promise<void>;
    deleteCollection: (id: number) => Promise<void>;
    loadAllCollections: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
    // Initial state
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
    },

    // File actions
    setCurrentFiles: (files) => set({ currentFiles: files }),

    addFiles: (files) => set((state) => ({
        currentFiles: [...state.currentFiles, ...files]
    })),

    removeFile: (id) => set((state) => ({
        currentFiles: state.currentFiles.filter(file => file.id !== id),
        selectedFiles: state.selectedFiles.filter(fileId => fileId !== id),
        previewFile: state.previewFile?.id === id ? undefined : state.previewFile
    })),

    clearFiles: () => set({
        currentFiles: [],
        selectedFiles: [],
        previewFile: undefined
    }),

    // Exclude pattern actions
    setExcludePatterns: (patterns) => set({ excludePatterns: patterns }),

    addExcludePattern: (pattern) => set((state) => ({
        excludePatterns: [...state.excludePatterns, pattern]
    })),

    removeExcludePattern: (id) => set((state) => ({
        excludePatterns: state.excludePatterns.filter(pattern => pattern.id !== id)
    })),

    toggleExcludePattern: (id) => set((state) => ({
        excludePatterns: state.excludePatterns.map(pattern =>
            pattern.id === id ? { ...pattern, enabled: !pattern.enabled } : pattern
        )
    })),

    // Selection actions
    setSelectedFiles: (ids) => set({ selectedFiles: ids }),

    toggleFileSelection: (id) => set((state) => {
        const isSelected = state.selectedFiles.includes(id);
        return {
            selectedFiles: isSelected
                ? state.selectedFiles.filter(fileId => fileId !== id)
                : [...state.selectedFiles, id]
        };
    }),

    selectAllFiles: () => set((state) => ({
        selectedFiles: state.currentFiles.map(file => file.id)
    })),

    clearSelection: () => set({ selectedFiles: [] }),

    // UI actions
    setPreviewFile: (file) => set({ previewFile: file }),

    setProcessing: (isProcessing) => set({ isProcessing }),

    setProcessingProgress: (progress) => set({ processingProgress: progress }),

    setProcessingError: (error) => set({ processingError: error }),

    // Settings actions
    updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
    })),

    // Collection actions
    setCollections: (collections) => set({ collections }),

    setActiveCollection: (id) => set({ activeCollectionId: id }),

    saveCurrentAsCollection: async (name) => {
        const { currentFiles, excludePatterns, settings } = get();
        try {
            const id = await collectionService.saveCollection(name, currentFiles, excludePatterns, settings);
            const collections = await collectionService.getAllCollections();
            set({ collections, activeCollectionId: id });
        } catch (error) {
            console.error('Failed to save collection:', error);
        }
    },

    loadCollection: async (id) => {
        try {
            const collection = await collectionService.loadCollection(id);
            if (collection) {
                set({
                    currentFiles: collection.files,
                    excludePatterns: collection.excludePatterns,
                    settings: collection.settings,
                    activeCollectionId: id,
                    selectedFiles: [],
                    previewFile: undefined
                });
            }
        } catch (error) {
            console.error('Failed to load collection:', error);
        }
    },

    deleteCollection: async (id) => {
        try {
            await collectionService.deleteCollection(id);
            const collections = await collectionService.getAllCollections();
            const { activeCollectionId } = get();
            set({
                collections,
                activeCollectionId: activeCollectionId === id ? undefined : activeCollectionId
            });
        } catch (error) {
            console.error('Failed to delete collection:', error);
        }
    },

    loadAllCollections: async () => {
        try {
            const collections = await collectionService.getAllCollections();
            set({ collections });
        } catch (error) {
            console.error('Failed to load collections:', error);
        }
    }
}));