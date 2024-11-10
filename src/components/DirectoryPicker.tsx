import React, { useState } from 'react';
import { FolderOpenIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useAppStore } from '../stores/useAppStore';
import { processFile } from '../utils/fileUtils';

interface DirectoryPickerProps {
    onDirectorySelected?: (files: File[]) => void;
}

export const DirectoryPicker: React.FC<DirectoryPickerProps> = ({ onDirectorySelected }) => {
    const [isSupported, setIsSupported] = useState(() => 'showDirectoryPicker' in window);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });

    const { addFiles } = useAppStore();

    const handleDirectoryPick = async () => {
        if (!isSupported) {
            alert('Directory selection is not supported in this browser. Please use Chrome 86+ or Edge 86+.');
            return;
        }

        try {
            setIsProcessing(true);
            setProgress({ current: 0, total: 0 });

            // Request directory access
            const directoryHandle = await (window as any).showDirectoryPicker({
                mode: 'read'
            });

            // Collect all files recursively
            const files: File[] = [];
            await collectFiles(directoryHandle, files, '');

            setProgress({ current: 0, total: files.length });

            // Process files
            const processedFiles = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                setProgress({ current: i + 1, total: files.length });

                try {
                    const processed = await processFile(file);
                    if (processed.success && processed.file) {
                        processedFiles.push(processed.file);
                    }
                } catch (error) {
                    console.warn(`Failed to process file ${file.name}:`, error);
                }
            }

            // Add to store
            addFiles(processedFiles);

            if (onDirectorySelected) {
                onDirectorySelected(files);
            }

        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error('Directory selection failed:', error);
                alert('Failed to access directory. Please try again.');
            }
        } finally {
            setIsProcessing(false);
            setProgress({ current: 0, total: 0 });
        }
    };

    const collectFiles = async (
        directoryHandle: any,
        files: File[],
        path: string
    ): Promise<void> => {
        for await (const entry of directoryHandle.values()) {
            const entryPath = path ? `${path}/${entry.name}` : entry.name;

            if (entry.kind === 'file') {
                try {
                    const file = await entry.getFile();
                    // Add path information to the file
                    Object.defineProperty(file, 'webkitRelativePath', {
                        value: entryPath,
                        writable: false
                    });
                    files.push(file);
                } catch (error) {
                    console.warn(`Failed to access file ${entryPath}:`, error);
                }
            } else if (entry.kind === 'directory') {
                // Recursively process subdirectories
                await collectFiles(entry, files, entryPath);
            }
        }
    };

    if (!isSupported) {
        return (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-yellow-50">
                <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-yellow-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Directory Selection Not Supported</h3>
                <p className="mt-1 text-sm text-gray-500">
                    Your browser doesn't support directory selection. Please use Chrome 86+ or Edge 86+.
                </p>
                <p className="mt-2 text-xs text-gray-400">
                    You can still drag and drop individual files above.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <button
                onClick={handleDirectoryPick}
                disabled={isProcessing}
                className="w-full flex flex-col items-center justify-center px-6 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <FolderOpenIcon className="h-12 w-12 text-gray-400 mb-4" />
                <span className="text-lg font-medium text-gray-900">
                    {isProcessing ? 'Processing Directory...' : 'Select Directory'}
                </span>
                <span className="text-sm text-gray-500 mt-1">
                    {isProcessing
                        ? `Processing ${progress.current} of ${progress.total} files`
                        : 'Choose a folder to process all files recursively'
                    }
                </span>
            </button>

            {isProcessing && (
                <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Processing files...</span>
                        <span>{progress.current} / {progress.total}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{
                                width: progress.total > 0
                                    ? `${(progress.current / progress.total) * 100}%`
                                    : '0%'
                            }}
                        />
                    </div>
                </div>
            )}

            <div className="text-xs text-gray-500 space-y-1">
                <p>• Recursively processes all files in the selected directory</p>
                <p>• Only text files will be included in concatenation</p>
                <p>• Large directories may take some time to process</p>
            </div>
        </div>
    );
};