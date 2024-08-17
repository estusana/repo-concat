import React, { useState, useMemo } from 'react';
import {
    ClipboardDocumentIcon,
    ArrowDownTrayIcon,
    EyeIcon,
    EyeSlashIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline';
import { useAppStore } from '../stores/useAppStore';
import { shouldExclude } from '../utils/patternUtils';
import {
    concatenateFiles,
    getDefaultConcatenationOptions,
    getConcatenationStats,
    copyToClipboard,
    downloadAsFile
} from '../utils/concatenationUtils';
import { formatFileSize } from '../utils/fileUtils';

export const OutputPanel: React.FC = () => {
    const [showPreview, setShowPreview] = useState(true);
    const [copySuccess, setCopySuccess] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const { currentFiles, excludePatterns, settings } = useAppStore();

    // Filter files based on exclude patterns
    const filteredFiles = useMemo(() => {
        return currentFiles.filter(file => {
            const result = shouldExclude(file.path, excludePatterns);
            return !result.shouldExclude;
        });
    }, [currentFiles, excludePatterns]);

    // Generate concatenated output
    const concatenatedOutput = useMemo(() => {
        if (filteredFiles.length === 0) return '';

        const options = {
            ...getDefaultConcatenationOptions(),
            includeHeaders: settings.includeHeaders,
            headerFormat: settings.headerFormat,
            customHeaderTemplate: settings.customHeaderTemplate
        };

        return concatenateFiles(filteredFiles, options);
    }, [filteredFiles, settings]);

    // Get statistics
    const stats = useMemo(() => {
        return getConcatenationStats(filteredFiles);
    }, [filteredFiles]);

    const handleCopy = async () => {
        if (!concatenatedOutput) return;

        const success = await copyToClipboard(concatenatedOutput);
        if (success) {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        }
    };

    const handleDownload = () => {
        if (!concatenatedOutput) return;

        setIsDownloading(true);
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `concatenated-files-${timestamp}.txt`;

        downloadAsFile(concatenatedOutput, filename);

        setTimeout(() => setIsDownloading(false), 1000);
    };

    if (filteredFiles.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No files to concatenate</h3>
                <p className="mt-1 text-sm text-gray-500">
                    Upload files and adjust exclude patterns to see the output
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header with stats and controls */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h3 className="text-lg font-medium text-gray-900">Output</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{stats.fileCount} files</span>
                        <span>{stats.totalLines.toLocaleString()} lines</span>
                        <span>{formatFileSize(concatenatedOutput.length)}</span>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setShowPreview(!showPreview)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        {showPreview ? (
                            <>
                                <EyeSlashIcon className="h-4 w-4 mr-1" />
                                Hide Preview
                            </>
                        ) : (
                            <>
                                <EyeIcon className="h-4 w-4 mr-1" />
                                Show Preview
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleCopy}
                        disabled={!concatenatedOutput}
                        className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${copySuccess
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-blue-600 hover:bg-blue-700'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        <ClipboardDocumentIcon className="h-4 w-4 mr-1" />
                        {copySuccess ? 'Copied!' : 'Copy'}
                    </button>

                    <button
                        onClick={handleDownload}
                        disabled={!concatenatedOutput || isDownloading}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                        {isDownloading ? 'Downloading...' : 'Download'}
                    </button>
                </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{stats.fileCount}</div>
                    <div className="text-sm text-gray-500">Files</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{stats.totalLines.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">Lines</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{formatFileSize(stats.totalSize)}</div>
                    <div className="text-sm text-gray-500">Original Size</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{formatFileSize(concatenatedOutput.length)}</div>
                    <div className="text-sm text-gray-500">Output Size</div>
                </div>
            </div>

            {/* File types breakdown */}
            {Object.keys(stats.fileTypes).length > 1 && (
                <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">File Types</h4>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(stats.fileTypes).map(([type, count]) => (
                            <span
                                key={type}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                                .{type}: {count}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Preview */}
            {showPreview && (
                <div className="border rounded-lg">
                    <div className="px-4 py-2 bg-gray-50 border-b rounded-t-lg">
                        <h4 className="text-sm font-medium text-gray-900">Preview</h4>
                    </div>
                    <div className="p-4">
                        <pre className="output-preview text-xs text-gray-800 max-h-96 overflow-auto whitespace-pre-wrap">
                            {concatenatedOutput.slice(0, 5000)}
                            {concatenatedOutput.length > 5000 && (
                                <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                                    ... (showing first 5000 characters of {concatenatedOutput.length} total)
                                </div>
                            )}
                        </pre>
                    </div>
                </div>
            )}

            {/* Settings hint */}
            <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded-lg">
                <p>
                    💡 <strong>Tip:</strong> The output includes file headers by default.
                    You can customize the header format and other settings in the configuration panel.
                </p>
            </div>
        </div>
    );
};