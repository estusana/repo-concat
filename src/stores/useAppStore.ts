import { create } from 'zustand';
import type { ProcessedFile, ExcludePattern, FileCollection, CollectionSettings } from '../types';

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

    setActiveCollection: (id) => set({ activeCollectionId: id })
}));