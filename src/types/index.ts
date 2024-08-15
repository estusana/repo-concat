// Core data types for the file concatenator

export interface ProcessedFile {
    id: string;
    name: string;
    path: string;
    content: string;
    size: number;
    type: string;
    lastModified: Date;
    isTextFile: boolean;
}

export interface ExcludePattern {
    id: string;
    type: PatternType;
    pattern: string;
    enabled: boolean;
    description?: string;
}

export type PatternType = 'extension' | 'glob' | 'regex' | 'path';

export interface FileCollection {
    id?: number;
    name: string;
    files: ProcessedFile[];
    excludePatterns: ExcludePattern[];
    settings: CollectionSettings;
    createdAt: Date;
    updatedAt: Date;
}

export interface CollectionSettings {
    includeHeaders: boolean;
    headerFormat: 'comment' | 'markdown' | 'custom';
    customHeaderTemplate?: string;
    sortBy: 'name' | 'path' | 'size' | 'modified';
    sortOrder: 'asc' | 'desc';
}

export interface ConcatenationOptions {
    includeHeaders: boolean;
    headerFormat: 'comment' | 'markdown' | 'custom';
    customHeaderTemplate?: string;
    separator: string;
}

export interface AppSettings {
    id?: number;
    key: string;
    value: string | number | boolean | object;
}

// UI State types
export interface FileUploadState {
    isDragOver: boolean;
    isUploading: boolean;
    uploadProgress: number;
}

export interface ProcessingState {
    isProcessing: boolean;
    currentFile?: string;
    progress: number;
    error?: string;
}

// Utility types
export type FileProcessingResult = {
    success: boolean;
    file?: ProcessedFile;
    error?: string;
};

export type PatternMatchResult = {
    shouldExclude: boolean;
    matchedPattern?: ExcludePattern;
};