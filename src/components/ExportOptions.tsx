import React, { useState } from 'react';
import { DocumentArrowDownIcon, ClipboardDocumentIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useAppStore } from '../stores/useAppStore';
import { concatenateFiles } from '../utils/concatenationUtils';

interface ExportFormat {
    id: string;
    name: string;
    description: string;
    extension: string;
    template: (content: string, metadata: any) => string;
}

const EXPORT_FORMATS: ExportFormat[] = [
    {
        id: 'plain',
        name: 'Plain Text',
        description: 'Simple concatenated text with basic headers',
        extension: 'txt',
        template: (content) => content
    },
    {
        id: 'markdown',
        name: 'Markdown',
        description: 'Formatted with markdown headers and code blocks',
        extension: 'md',
        template: (content, metadata) => {
            const header = `# File Concatenation Report

**Generated:** ${new Date().toLocaleString()}  
**Total Files:** ${metadata.fileCount}  
**Total Size:** ${metadata.totalSize} bytes  
**Excluded Patterns:** ${metadata.excludePatterns.length}

---

`;
            return header + content.replace(/^=== (.+) ===$/gm, '## $1\n\n```');
        }
    },
    {
        id: 'json',
        name: 'JSON',
        description: 'Structured data with file metadata',
        extension: 'json',
        template: (content, metadata) => {
            return JSON.stringify({
                generatedAt: new Date().toISOString(),
                metadata,
                files: metadata.files.map((file: any) => ({
                    path: file.path,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    content: file.content
                }))
            }, null, 2);
        }
    },
    {
        id: 'html',
        name: 'HTML Report',
        description: 'Interactive HTML document with syntax highlighting',
        extension: 'html',
        template: (content, metadata) => {
            const files = metadata.files.map((file: any) => `
                <div class="file-section">
                    <h3>${file.path}</h3>
                    <div class="file-meta">
                        <span>Size: ${file.size} bytes</span>
                        <span>Type: ${file.type}</span>
                        <span>Modified: ${new Date(file.lastModified).toLocaleString()}</span>
                    </div>
                    <pre><code>${file.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
                </div>
            `).join('\n');

            return `<!DOCTYPE html>
<html>
<head>
    <title>File Concatenation Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; }
        .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
        .file-section { margin-bottom: 40px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
        .file-section h3 { margin: 0; padding: 15px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
        .file-meta { padding: 10px 15px; background: #f3f4f6; font-size: 14px; color: #6b7280; }
        .file-meta span { margin-right: 20px; }
        pre { margin: 0; padding: 20px; overflow-x: auto; background: #1f2937; color: #f9fafb; }
        code { font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace; }
    </style>
</head>
<body>
    <div class="header">
        <h1>File Concatenation Report</h1>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Total Files:</strong> ${metadata.fileCount} | <strong>Total Size:</strong> ${metadata.totalSize} bytes</p>
    </div>
    ${files}
</body>
</html>`;
        }
    },
    {
        id: 'xml',
        name: 'XML',
        description: 'Structured XML format with metadata',
        extension: 'xml',
        template: (content, metadata) => {
            const files = metadata.files.map((file: any) => `
    <file>
        <path>${file.path}</path>
        <name>${file.name}</name>
        <size>${file.size}</size>
        <type>${file.type}</type>
        <lastModified>${new Date(file.lastModified).toISOString()}</lastModified>
        <content><![CDATA[${file.content}]]></content>
    </file>`).join('\n');

            return `<?xml version="1.0" encoding="UTF-8"?>
<concatenation>
    <metadata>
        <generatedAt>${new Date().toISOString()}</generatedAt>
        <fileCount>${metadata.fileCount}</fileCount>
        <totalSize>${metadata.totalSize}</totalSize>
        <excludePatterns>${metadata.excludePatterns.length}</excludePatterns>
    </metadata>
    <files>${files}
    </files>
</concatenation>`;
        }
    }
];

interface ExportOptionsProps {
    onClose: () => void;
}

export const ExportOptions: React.FC<ExportOptionsProps> = ({ onClose }) => {
    const [selectedFormat, setSelectedFormat] = useState<string>('plain');
    const [includeMetadata, setIncludeMetadata] = useState(true);
    const [customTemplate, setCustomTemplate] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);

    const { currentFiles, excludePatterns } = useAppStore();

    const getFilteredFiles = () => {
        return currentFiles.filter(file => file.isTextFile);
    };

    const generateExport = async (format: ExportFormat, download: boolean = false) => {
        const filteredFiles = getFilteredFiles();

        if (filteredFiles.length === 0) {
            alert('No text files available for export');
            return;
        }

        const concatenated = concatenateFiles(filteredFiles, {
            includeHeaders: true,
            headerFormat: format.id === 'markdown' ? 'markdown' : 'comment',
            separator: '\n\n'
        });

        const metadata = {
            fileCount: filteredFiles.length,
            totalSize: filteredFiles.reduce((sum, file) => sum + file.size, 0),
            excludePatterns: excludePatterns.filter(p => p.enabled),
            files: includeMetadata ? filteredFiles : []
        };

        const exportContent = format.template(concatenated, metadata);

        if (download) {
            const blob = new Blob([exportContent], {
                type: format.id === 'json' ? 'application/json' :
                    format.id === 'html' ? 'text/html' :
                        format.id === 'xml' ? 'application/xml' : 'text/plain'
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `concatenated-files.${format.extension}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } else {
            await navigator.clipboard.writeText(exportContent);
            alert('Content copied to clipboard!');
        }
    };

    const selectedFormatObj = EXPORT_FORMATS.find(f => f.id === selectedFormat) || EXPORT_FORMATS[0];

    return (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">Export Options</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500"
                        >
                            ×
                        </button>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                        Export your concatenated files in various formats
                    </p>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    <div className="space-y-6">
                        {/* Format Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Export Format
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {EXPORT_FORMATS.map((format) => (
                                    <div
                                        key={format.id}
                                        className={`relative rounded-lg border p-4 cursor-pointer hover:bg-gray-50 ${selectedFormat === format.id
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200'
                                            }`}
                                        onClick={() => setSelectedFormat(format.id)}
                                    >
                                        <div className="flex items-center">
                                            <input
                                                type="radio"
                                                name="format"
                                                value={format.id}
                                                checked={selectedFormat === format.id}
                                                onChange={() => setSelectedFormat(format.id)}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                            />
                                            <div className="ml-3">
                                                <label className="block text-sm font-medium text-gray-900">
                                                    {format.name}
                                                </label>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {format.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Options */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-medium text-gray-700">
                                    Export Options
                                </label>
                                <button
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                                >
                                    <Cog6ToothIcon className="h-4 w-4 mr-1" />
                                    Advanced
                                </button>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="includeMetadata"
                                    checked={includeMetadata}
                                    onChange={(e) => setIncludeMetadata(e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="includeMetadata" className="ml-2 text-sm text-gray-700">
                                    Include file metadata
                                </label>
                            </div>

                            {showAdvanced && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Custom Template (Advanced)
                                    </label>
                                    <textarea
                                        value={customTemplate}
                                        onChange={(e) => setCustomTemplate(e.target.value)}
                                        placeholder="Enter custom template... Use {{content}} and {{metadata}} placeholders"
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                        rows={4}
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Leave empty to use default template for selected format
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Preview */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Preview ({selectedFormatObj.name})
                            </label>
                            <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-xs font-mono max-h-32 overflow-y-auto">
                                {getFilteredFiles().length > 0 ? (
                                    <div className="text-gray-600">
                                        {selectedFormatObj.id === 'json' && '{\n  "generatedAt": "2024-09-28T14:30:00.000Z",\n  "metadata": {...},\n  "files": [...]\n}'}
                                        {selectedFormatObj.id === 'markdown' && '# File Concatenation Report\n\n**Generated:** ...\n\n## src/example.js\n\n```\nfile content...\n```'}
                                        {selectedFormatObj.id === 'html' && '<!DOCTYPE html>\n<html>\n<head><title>File Concatenation Report</title></head>\n<body>...</body>\n</html>'}
                                        {selectedFormatObj.id === 'xml' && '<?xml version="1.0"?>\n<concatenation>\n  <metadata>...</metadata>\n  <files>...</files>\n</concatenation>'}
                                        {selectedFormatObj.id === 'plain' && '=== src/example.js ===\nfile content...\n\n=== src/another.js ===\nmore content...'}
                                    </div>
                                ) : (
                                    <div className="text-gray-400">No files available for preview</div>
                                )}
                            </div>
                        </div>

                        {/* File Summary */}
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                            <h4 className="text-sm font-medium text-blue-900 mb-2">Export Summary</h4>
                            <div className="text-sm text-blue-800">
                                <p>Files to export: {getFilteredFiles().length}</p>
                                <p>Total size: {getFilteredFiles().reduce((sum, file) => sum + file.size, 0)} bytes</p>
                                <p>Active exclude patterns: {excludePatterns.filter(p => p.enabled).length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => generateExport(selectedFormatObj, false)}
                        disabled={getFilteredFiles().length === 0}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-md hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ClipboardDocumentIcon className="h-4 w-4 mr-2" />
                        Copy to Clipboard
                    </button>
                    <button
                        onClick={() => generateExport(selectedFormatObj, true)}
                        disabled={getFilteredFiles().length === 0}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                        Download File
                    </button>
                </div>
            </div>
        </div>
    );
};