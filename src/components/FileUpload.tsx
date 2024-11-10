import React, { useCallback, useState } from 'react';
import { CloudArrowUpIcon, DocumentIcon, FolderIcon } from '@heroicons/react/24/outline';
import { useAppStore } from '../stores/useAppStore';
import { processFiles } from '../utils/fileUtils';
import { DirectoryPicker } from './DirectoryPicker';

interface FileUploadProps {
    className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ className = '' }) => {
    const [activeTab, setActiveTab] = useState<'files' | 'directory'>('files');
    const [isDragOver, setIsDragOver] = useState(false);
    const [isDragActive, setIsDragActive] = useState(false);

    const {
        addFiles,
        setProcessing,
        setProcessingProgress,
        setProcessingError,
        isProcessing
    } = useAppStore();

    const handleFiles = useCallback(async (files: FileList) => {
        if (files.length === 0) return;

        setProcessing(true);
        setProcessingError(undefined);
        setProcessingProgress(0);

        try {
            const fileArray = Array.from(files);
            const processedFiles = await processFiles(fileArray);

            if (processedFiles.length > 0) {
                addFiles(processedFiles);
                setProcessingProgress(100);
            } else {
                setProcessingError('No text files found to process');
            }
        } catch (error) {
            setProcessingError(error instanceof Error ? error.message : 'Failed to process files');
        } finally {
            setProcessing(false);
            setTimeout(() => setProcessingProgress(0), 1000);
        }
    }, [addFiles, setProcessing, setProcessingProgress, setProcessingError]);

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Only set drag over to false if we're leaving the drop zone entirely
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragOver(false);
            setIsDragActive(false);
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(true);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setIsDragOver(false);
        setIsDragActive(false);

        const files = e.dataTransfer.files;
        handleFiles(files);
    }, [handleFiles]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            handleFiles(files);
        }
        // Reset the input so the same files can be selected again
        e.target.value = '';
    }, [handleFiles]);

    const dropZoneClasses = [
        'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200',
        isDragActive ? 'border-blue-600 bg-blue-100' :
            isDragOver ? 'border-blue-500 bg-blue-50' :
                'border-gray-300 hover:border-gray-400',
        isProcessing ? 'pointer-events-none opacity-50' : 'cursor-pointer',
        className
    ].join(' ');

    return (
        <div className={className}>
            {/* Tab navigation */}
            <div className="border-b border-gray-200 mb-4">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('files')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'files'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <DocumentIcon className="h-4 w-4 inline mr-2" />
                        Upload Files
                    </button>
                    <button
                        onClick={() => setActiveTab('directory')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'directory'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <FolderIcon className="h-4 w-4 inline mr-2" />
                        Select Directory
                    </button>
                </nav>
            </div>

            {/* Tab content */}
            {activeTab === 'files' ? (
                <div
                    className={dropZoneClasses}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('file-input')?.click()}
                >
                    <input
                        id="file-input"
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileInput}
                        disabled={isProcessing}
                    />

                    <div className="flex flex-col items-center space-y-4">
                        {isProcessing ? (
                            <>
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                <p className="text-sm text-gray-600">Processing files...</p>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center space-x-2">
                                    <CloudArrowUpIcon className="h-12 w-12 text-gray-400" />
                                    <DocumentIcon className="h-8 w-8 text-gray-300" />
                                </div>

                                <div className="space-y-2">
                                    <p className="text-lg font-medium text-gray-900">
                                        {isDragActive ? 'Drop files here' : 'Drop files to upload'}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        or <span className="text-blue-600 font-medium">browse</span> to choose files
                                    </p>
                                </div>

                                <div className="text-xs text-gray-400 space-y-1">
                                    <p>Supports text files: .js, .ts, .py, .md, .txt, .json, .css, .html and more</p>
                                    <p>Binary files will be automatically filtered out</p>
                                </div>
                            </>
                        )}
                    </div>

                    {isDragOver && (
                        <div className="absolute inset-0 bg-blue-50 bg-opacity-50 rounded-lg pointer-events-none" />
                    )}
                </div>
            ) : (
                <DirectoryPicker />
            )}
        </div>
    );
};