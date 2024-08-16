import React from 'react';
import { DocumentTextIcon, EyeIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useAppStore } from '../stores/useAppStore';
import { formatFileSize } from '../utils/fileUtils';
import { shouldExclude } from '../utils/patternUtils';

export const FileList: React.FC = () => {
    const {
        currentFiles,
        excludePatterns,
        selectedFiles,
        toggleFileSelection,
        selectAllFiles,
        clearSelection,
        removeFile,
        setPreviewFile,
        previewFile
    } = useAppStore();

    // Filter files based on exclude patterns
    const filteredFiles = currentFiles.filter(file => {
        const result = shouldExclude(file.path, excludePatterns);
        return !result.shouldExclude;
    });

    const excludedFiles = currentFiles.filter(file => {
        const result = shouldExclude(file.path, excludePatterns);
        return result.shouldExclude;
    });

    const handleSelectAll = () => {
        if (selectedFiles.length === filteredFiles.length) {
            clearSelection();
        } else {
            selectAllFiles();
        }
    };

    const handlePreview = (file: typeof currentFiles[0]) => {
        setPreviewFile(previewFile?.id === file.id ? undefined : file);
    };

    if (currentFiles.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No files uploaded</h3>
                <p className="mt-1 text-sm text-gray-500">
                    Upload some files to get started with concatenation
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header with stats and controls */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-medium text-gray-900">Files</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>{filteredFiles.length} included</span>
                        {excludedFiles.length > 0 && (
                            <span className="text-orange-600">• {excludedFiles.length} excluded</span>
                        )}
                    </div>
                </div>

                {filteredFiles.length > 0 && (
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleSelectAll}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                            {selectedFiles.length === filteredFiles.length ? 'Deselect All' : 'Select All'}
                        </button>
                    </div>
                )}
            </div>

            {/* File list */}
            <div className="space-y-1">
                {filteredFiles.map((file) => {
                    const isSelected = selectedFiles.includes(file.id);
                    const isPreview = previewFile?.id === file.id;

                    return (
                        <div key={file.id} className="space-y-0">
                            <div
                                className={`file-item flex items-center p-3 rounded-md border ${isSelected
                                        ? 'bg-blue-50 border-blue-200'
                                        : 'bg-white border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleFileSelection(file.id)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />

                                <div className="ml-3 flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <DocumentTextIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {file.name}
                                                </p>
                                                {file.path !== file.name && (
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {file.path}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <span className="text-xs text-gray-500">
                                                {formatFileSize(file.size)}
                                            </span>

                                            <div className="flex items-center space-x-1">
                                                <button
                                                    onClick={() => handlePreview(file)}
                                                    className={`p-1 rounded hover:bg-gray-100 ${isPreview ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                                                        }`}
                                                    title="Preview file content"
                                                >
                                                    <EyeIcon className="h-4 w-4" />
                                                </button>

                                                <button
                                                    onClick={() => removeFile(file.id)}
                                                    className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"
                                                    title="Remove file"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* File preview */}
                            {isPreview && (
                                <div className="ml-7 mr-3 mb-2">
                                    <div className="bg-gray-50 rounded-md p-3 border-l-4 border-blue-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-medium text-gray-700">Preview</span>
                                            <span className="text-xs text-gray-500">
                                                {file.content.split('\n').length} lines
                                            </span>
                                        </div>
                                        <pre className="output-preview text-xs text-gray-800 max-h-40 overflow-y-auto">
                                            {file.content.slice(0, 1000)}
                                            {file.content.length > 1000 && '\n... (truncated)'}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Excluded files section */}
            {excludedFiles.length > 0 && (
                <div className="border-t pt-4">
                    <details className="group">
                        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                            <span>Excluded Files ({excludedFiles.length})</span>
                            <span className="text-gray-400 group-open:rotate-180 transition-transform">
                                ▼
                            </span>
                        </summary>

                        <div className="mt-2 space-y-1">
                            {excludedFiles.map((file) => {
                                const exclusionResult = shouldExclude(file.path, excludePatterns);

                                return (
                                    <div
                                        key={file.id}
                                        className="flex items-center p-2 rounded-md bg-orange-50 border border-orange-200"
                                    >
                                        <DocumentTextIcon className="h-4 w-4 text-orange-400 flex-shrink-0" />
                                        <div className="ml-2 flex-1 min-w-0">
                                            <p className="text-sm text-gray-700 truncate">{file.name}</p>
                                            {exclusionResult.matchedPattern && (
                                                <p className="text-xs text-orange-600">
                                                    Excluded by: {exclusionResult.matchedPattern.pattern} ({exclusionResult.matchedPattern.type})
                                                </p>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500 ml-2">
                                            {formatFileSize(file.size)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </details>
                </div>
            )}
        </div>
    );
};