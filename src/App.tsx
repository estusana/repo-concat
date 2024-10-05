import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { ExcludePatterns } from './components/ExcludePatterns';
import { FileList } from './components/FileList';
import { FileTree } from './components/FileTree';
import { OutputPanel } from './components/OutputPanel';
import { CollectionManager } from './components/CollectionManager';
import { useAppStore } from './stores/useAppStore';

function App() {
  const [activeTab, setActiveTab] = useState<'list' | 'tree'>('list');
  const { currentFiles, isProcessing, processingError } = useAppStore();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">FC</span>
                </div>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">File Concatenator</h1>
                <p className="text-sm text-gray-500">Combine multiple files with smart filtering</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>{currentFiles.length} files loaded</span>
              {isProcessing && (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Processing...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error display */}
        {processingError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Processing Error</h3>
                <p className="mt-1 text-sm text-red-700">{processingError}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - File upload and patterns */}
          <div className="lg:col-span-1 space-y-6">
            {/* File upload */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Files</h2>
              <FileUpload />
            </div>

            {/* Exclude patterns */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <ExcludePatterns />
            </div>

            {/* Collection manager */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <CollectionManager />
            </div>

            {/* Quick stats */}
            {currentFiles.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-sm font-medium text-blue-900 mb-2">Quick Stats</h3>
                <div className="space-y-1 text-sm text-blue-800">
                  <p>Total files: {currentFiles.length}</p>
                  <p>Total size: {(currentFiles.reduce((sum, f) => sum + f.size, 0) / 1024).toFixed(1)} KB</p>
                  <p>File types: {new Set(currentFiles.map(f => f.name.split('.').pop())).size}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right column - File list and output */}
          <div className="lg:col-span-2 space-y-6">
            {/* File list/tree view */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Tab navigation */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab('list')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'list'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    List View
                  </button>
                  <button
                    onClick={() => setActiveTab('tree')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'tree'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    Tree View
                  </button>
                </nav>
              </div>

              {/* Tab content */}
              <div className="p-6">
                {activeTab === 'list' ? <FileList /> : <FileTree />}
              </div>
            </div>

            {/* Output panel */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <OutputPanel />
            </div>
          </div>
        </div>

        {/* Getting started help */}
        {currentFiles.length === 0 && !isProcessing && (
          <div className="mt-12 text-center">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-2xl mx-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Getting Started</h3>
              <div className="space-y-4 text-sm text-gray-600">
                <div className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">1</span>
                  <p className="text-left">
                    <strong>Upload files:</strong> Drag and drop files or click to browse.
                    Text files will be automatically detected and processed.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">2</span>
                  <p className="text-left">
                    <strong>Set exclude patterns:</strong> Filter out unwanted files using extensions,
                    glob patterns, or path matching.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">3</span>
                  <p className="text-left">
                    <strong>Copy or download:</strong> Get the concatenated result with file headers
                    and copy to clipboard or download as a file.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              File Concatenator - Combine files with intelligent filtering
            </p>
            <p className="text-xs text-gray-400">
              Built with React, TypeScript, and Tailwind CSS
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
