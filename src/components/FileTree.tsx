import React, { useState, useMemo } from 'react';
import {
    FolderIcon,
    FolderOpenIcon,
    DocumentIcon,
    EyeIcon,
    EyeSlashIcon,
    ChevronRightIcon,
    ChevronDownIcon
} from '@heroicons/react/24/outline';
import { useAppStore } from '../stores/useAppStore';
import { shouldExclude } from '../utils/patternUtils';
import { formatFileSize } from '../utils/fileUtils';
import type { ProcessedFile } from '../types';

interface TreeNode {
    name: string;
    path: string;
    type: 'file' | 'folder';
    children: TreeNode[];
    file?: ProcessedFile;
    size: number;
    isExcluded: boolean;
}

interface FileTreeProps {
    showExcluded?: boolean;
}

export const FileTree: React.FC<FileTreeProps> = ({ showExcluded = false }) => {
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [showFileContent, setShowFileContent] = useState(false);

    const { currentFiles, excludePatterns } = useAppStore();

    // Build tree structure from files
    const fileTree = useMemo(() => {
        const root: TreeNode = {
            name: 'root',
            path: '',
            type: 'folder',
            children: [],
            size: 0,
            isExcluded: false
        };

        currentFiles.forEach(file => {
            const pathParts = file.path.split('/').filter(part => part.length > 0);
            let currentNode = root;

            // Navigate/create folder structure
            for (let i = 0; i < pathParts.length - 1; i++) {
                const folderName = pathParts[i];
                const folderPath = pathParts.slice(0, i + 1).join('/');

                let folderNode = currentNode.children.find(
                    child => child.name === folderName && child.type === 'folder'
                );

                if (!folderNode) {
                    folderNode = {
                        name: folderName,
                        path: folderPath,
                        type: 'folder',
                        children: [],
                        size: 0,
                        isExcluded: false
                    };
                    currentNode.children.push(folderNode);
                }

                currentNode = folderNode;
            }

            // Add file node
            const fileName = pathParts[pathParts.length - 1] || file.name;
            const exclusionResult = shouldExclude(file.path, excludePatterns);

            const fileNode: TreeNode = {
                name: fileName,
                path: file.path,
                type: 'file',
                children: [],
                file,
                size: file.size,
                isExcluded: exclusionResult.shouldExclude
            };

            currentNode.children.push(fileNode);
        });

        // Sort children: folders first, then files, both alphabetically
        const sortChildren = (node: TreeNode) => {
            node.children.sort((a, b) => {
                if (a.type !== b.type) {
                    return a.type === 'folder' ? -1 : 1;
                }
                return a.name.localeCompare(b.name);
            });

            // Calculate folder sizes and exclusion status
            if (node.type === 'folder') {
                node.size = node.children.reduce((sum, child) => {
                    sortChildren(child);
                    return sum + child.size;
                }, 0);

                // Folder is excluded if all its files are excluded
                const fileChildren = node.children.filter(child => child.type === 'file');
                node.isExcluded = fileChildren.length > 0 && fileChildren.every(child => child.isExcluded);
            }
        };

        sortChildren(root);
        return root;
    }, [currentFiles, excludePatterns]);

    const toggleFolder = (path: string) => {
        const newExpanded = new Set(expandedFolders);
        if (newExpanded.has(path)) {
            newExpanded.delete(path);
        } else {
            newExpanded.add(path);
        }
        setExpandedFolders(newExpanded);
    };

    const selectFile = (file: ProcessedFile) => {
        setSelectedFile(selectedFile === file.path ? null : file.path);
    };

    const getFileIcon = (file: ProcessedFile) => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        const iconClass = "h-4 w-4";

        // You could extend this with more specific icons
        return <DocumentIcon className={iconClass} />;
    };

    const renderTreeNode = (node: TreeNode, depth: number = 0): React.ReactNode => {
        if (!showExcluded && node.isExcluded && node.type === 'file') {
            return null;
        }

        const isExpanded = expandedFolders.has(node.path);
        const isSelected = selectedFile === node.path;
        const paddingLeft = depth * 20;

        if (node.type === 'folder') {
            const visibleChildren = showExcluded
                ? node.children
                : node.children.filter(child =>
                    child.type === 'folder' || !child.isExcluded
                );

            if (visibleChildren.length === 0 && !showExcluded) {
                return null;
            }

            return (
                <div key={node.path}>
                    <div
                        className={`flex items-center py-1 px-2 hover:bg-gray-50 cursor-pointer ${node.isExcluded ? 'opacity-50' : ''
                            }`}
                        style={{ paddingLeft: `${paddingLeft + 8}px` }}
                        onClick={() => toggleFolder(node.path)}
                    >
                        <div className="flex items-center flex-1 min-w-0">
                            {isExpanded ? (
                                <ChevronDownIcon className="h-4 w-4 text-gray-400 mr-1 flex-shrink-0" />
                            ) : (
                                <ChevronRightIcon className="h-4 w-4 text-gray-400 mr-1 flex-shrink-0" />
                            )}
                            {isExpanded ? (
                                <FolderOpenIcon className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                            ) : (
                                <FolderIcon className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                            )}
                            <span className="text-sm font-medium text-gray-900 truncate">
                                {node.name}
                            </span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span>{visibleChildren.length} items</span>
                            <span>{formatFileSize(node.size)}</span>
                        </div>
                    </div>
                    {isExpanded && (
                        <div>
                            {visibleChildren.map(child => renderTreeNode(child, depth + 1))}
                        </div>
                    )}
                </div>
            );
        } else {
            // File node
            return (
                <div key={node.path}>
                    <div
                        className={`flex items-center py-1 px-2 hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                            } ${node.isExcluded ? 'opacity-50 line-through' : ''}`}
                        style={{ paddingLeft: `${paddingLeft + 28}px` }}
                        onClick={() => node.file && selectFile(node.file)}
                    >
                        <div className="flex items-center flex-1 min-w-0">
                            {node.file && getFileIcon(node.file)}
                            <span className={`text-sm ml-2 truncate ${node.isExcluded ? 'text-gray-400' : 'text-gray-700'
                                }`}>
                                {node.name}
                            </span>
                            {node.isExcluded && (
                                <span className="ml-2 text-xs text-red-500 bg-red-100 px-1 rounded">
                                    excluded
                                </span>
                            )}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span>{formatFileSize(node.size)}</span>
                            {node.file && !node.file.isTextFile && (
                                <span className="text-orange-500">binary</span>
                            )}
                        </div>
                    </div>

                    {/* File content preview */}
                    {isSelected && node.file && showFileContent && (
                        <div className="mx-4 mb-2 border border-gray-200 rounded-md">
                            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">
                                    {node.file.name}
                                </span>
                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                    <span>{node.file.type}</span>
                                    <span>{formatFileSize(node.file.size)}</span>
                                    <span>{new Date(node.file.lastModified).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="p-3 max-h-64 overflow-auto">
                                {node.file.isTextFile ? (
                                    <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                                        {node.file.content.slice(0, 1000)}
                                        {node.file.content.length > 1000 && (
                                            <div className="text-gray-500 mt-2">
                                                ... (showing first 1000 characters)
                                            </div>
                                        )}
                                    </pre>
                                ) : (
                                    <div className="text-gray-500 text-sm">
                                        Binary file - content not displayed
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            );
        }
    };

    const stats = useMemo(() => {
        const totalFiles = currentFiles.length;
        const excludedFiles = currentFiles.filter(file =>
            shouldExclude(file.path, excludePatterns).shouldExclude
        ).length;
        const includedFiles = totalFiles - excludedFiles;

        return { totalFiles, excludedFiles, includedFiles };
    }, [currentFiles, excludePatterns]);

    if (currentFiles.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <FolderIcon className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No files uploaded</h3>
                <p className="mt-1 text-sm text-gray-500">
                    Upload files to see the file tree structure
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header with controls */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium text-gray-900">File Tree</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{stats.includedFiles} included</span>
                        <span>{stats.excludedFiles} excluded</span>
                        <span>{stats.totalFiles} total</span>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setShowFileContent(!showFileContent)}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-blue-600 hover:text-blue-800"
                    >
                        {showFileContent ? (
                            <>
                                <EyeSlashIcon className="h-3 w-3 mr-1" />
                                Hide Content
                            </>
                        ) : (
                            <>
                                <EyeIcon className="h-3 w-3 mr-1" />
                                Show Content
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Tree view */}
            <div className="border border-gray-200 rounded-lg bg-white">
                <div className="max-h-96 overflow-auto">
                    {fileTree.children.map(child => renderTreeNode(child, 0))}
                </div>
            </div>

            {/* Legend */}
            <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                        <FolderIcon className="h-3 w-3 text-blue-500 mr-1" />
                        <span>Folder</span>
                    </div>
                    <div className="flex items-center">
                        <DocumentIcon className="h-3 w-3 text-gray-500 mr-1" />
                        <span>File</span>
                    </div>
                    <div className="flex items-center">
                        <span className="text-red-500 bg-red-100 px-1 rounded mr-1">excluded</span>
                        <span>Excluded by patterns</span>
                    </div>
                </div>
            </div>
        </div>
    );
};