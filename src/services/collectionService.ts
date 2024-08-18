import { db } from './database';
import type { FileCollection, ProcessedFile, ExcludePattern, CollectionSettings } from '../types';

export class CollectionService {
    /**
     * Save a new collection or update existing one
     */
    async saveCollection(
        name: string,
        files: ProcessedFile[],
        excludePatterns: ExcludePattern[],
        settings: CollectionSettings
    ) {
        const now = new Date();

        const collection: FileCollection = {
            name,
            files,
            excludePatterns,
            settings,
            createdAt: now,
            updatedAt: now
        };

        const id = await db.collections.add(collection);
        return Number(id);
    }

    /**
     * Update an existing collection
     */
    async updateCollection(
        id: number,
        name: string,
        files: ProcessedFile[],
        excludePatterns: ExcludePattern[],
        settings: CollectionSettings
    ): Promise<void> {
        await db.collections.update(id, {
            name,
            files,
            excludePatterns,
            settings,
            updatedAt: new Date()
        });
    }

    /**
     * Load a collection by ID
     */
    async loadCollection(id: number): Promise<FileCollection | undefined> {
        return await db.collections.get(id);
    }

    /**
     * Get all collections
     */
    async getAllCollections(): Promise<FileCollection[]> {
        return await db.collections.orderBy('updatedAt').reverse().toArray();
    }

    /**
     * Delete a collection
     */
    async deleteCollection(id: number): Promise<void> {
        await db.collections.delete(id);
    }

    /**
     * Search collections by name
     */
    async searchCollections(query: string): Promise<FileCollection[]> {
        return await db.collections
            .filter(collection =>
                collection.name.toLowerCase().includes(query.toLowerCase())
            )
            .toArray();
    }

    /**
     * Get collection statistics
     */
    async getCollectionStats() {
        const collections = await this.getAllCollections();
        const totalFiles = collections.reduce((sum, col) => sum + col.files.length, 0);
        const totalSize = collections.reduce((sum, col) =>
            sum + col.files.reduce((fileSum, file) => fileSum + file.size, 0), 0
        );

        return {
            totalCollections: collections.length,
            totalFiles,
            totalSize,
            averageFilesPerCollection: collections.length > 0 ? Math.round(totalFiles / collections.length) : 0
        };
    }
}

export const collectionService = new CollectionService();