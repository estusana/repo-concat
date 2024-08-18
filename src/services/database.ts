import Dexie, { type Table } from 'dexie';
import type { FileCollection, AppSettings } from '../types';

export class AppDatabase extends Dexie {
    collections!: Table<FileCollection>;
    settings!: Table<AppSettings>;

    constructor() {
        super('FileConcat');

        this.version(1).stores({
            collections: '++id, name, createdAt, updatedAt',
            settings: '++id, key, value'
        });
    }
}

export const db = new AppDatabase();