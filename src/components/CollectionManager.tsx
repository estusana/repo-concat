import React, { useState, useEffect } from 'react';
import { FolderIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useAppStore } from '../stores/useAppStore';

export const CollectionManager: React.FC = () => {
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [collectionName, setCollectionName] = useState('');

    const {
        collections,
        activeCollectionId,
        currentFiles,
        saveCurrentAsCollection,
        loadCollection,
        deleteCollection,
        loadAllCollections
    } = useAppStore();

    useEffect(() => {
        loadAllCollections();
    }, [loadAllCollections]);

    const handleSaveCollection = async () => {
        if (!collectionName.trim()) return;

        await saveCurrentAsCollection(collectionName.trim());
        setCollectionName('');
        setShowSaveDialog(false);
    };

    const handleLoadCollection = async (id: number) => {
        await loadCollection(id);
    };

    const handleDeleteCollection = async (id: number) => {
        if (confirm('Are you sure you want to delete this collection?')) {
            await deleteCollection(id);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Collections</h3>
                <button
                    onClick={() => setShowSaveDialog(true)}
                    disabled={currentFiles.length === 0}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Save
                </button>
            </div>

            {/* Save dialog */}
            {showSaveDialog && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                            Collection Name
                        </label>
                        <input
                            type="text"
                            value={collectionName}
                            onChange={(e) => setCollectionName(e.target.value)}
                            placeholder="Enter collection name..."
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            onKeyPress={(e) => e.key === 'Enter' && handleSaveCollection()}
                            autoFocus
                        />
                        <div className="flex space-x-2">
                            <button
                                onClick={handleSaveCollection}
                                disabled={!collectionName.trim()}
                                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                Save
                            </button>
                            <button
                                onClick={() => {
                                    setShowSaveDialog(false);
                                    setCollectionName('');
                                }}
                                className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Collections list */}
            <div className="space-y-2">
                {collections.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                        <FolderIcon className="mx-auto h-8 w-8 text-gray-300" />
                        <p className="mt-2 text-sm">No saved collections</p>
                        <p className="text-xs">Upload files and save them as a collection</p>
                    </div>
                ) : (
                    collections.map((collection) => (
                        <div
                            key={collection.id}
                            className={`flex items-center justify-between p-3 rounded-md border ${activeCollectionId === collection.id
                                    ? 'bg-blue-50 border-blue-200'
                                    : 'bg-white border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                    <FolderIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {collection.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {collection.files.length} files • {new Date(collection.updatedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={() => handleLoadCollection(collection.id!)}
                                    className="p-1 text-blue-600 hover:text-blue-800 text-sm"
                                >
                                    Load
                                </button>
                                <button
                                    onClick={() => handleDeleteCollection(collection.id!)}
                                    className="p-1 text-red-600 hover:text-red-800"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};