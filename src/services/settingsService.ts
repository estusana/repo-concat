import { db } from './database';
import type { AppSettings, CollectionSettings } from '../types';

export class SettingsService {
    /**
     * Save a setting value
     */
    async saveSetting(key: string, value: string | number | boolean | object): Promise<void> {
        const existing = await db.settings.where('key').equals(key).first();

        if (existing) {
            await db.settings.update(existing.id!, { value });
        } else {
            await db.settings.add({ key, value });
        }
    }

    /**
     * Get a setting value
     */
    async getSetting<T = any>(key: string, defaultValue?: T): Promise<T> {
        const setting = await db.settings.where('key').equals(key).first();
        return setting ? setting.value as T : defaultValue as T;
    }

    /**
     * Save collection settings
     */
    async saveCollectionSettings(settings: CollectionSettings): Promise<void> {
        await this.saveSetting('collectionSettings', settings);
    }

    /**
     * Load collection settings
     */
    async loadCollectionSettings(): Promise<CollectionSettings> {
        return await this.getSetting('collectionSettings', {
            includeHeaders: true,
            headerFormat: 'comment',
            sortBy: 'name',
            sortOrder: 'asc'
        } as CollectionSettings);
    }

    /**
     * Save UI preferences
     */
    async saveUIPreferences(preferences: Record<string, any>): Promise<void> {
        await this.saveSetting('uiPreferences', preferences);
    }

    /**
     * Load UI preferences
     */
    async loadUIPreferences(): Promise<Record<string, any>> {
        return await this.getSetting('uiPreferences', {});
    }

    /**
     * Clear all settings
     */
    async clearAllSettings(): Promise<void> {
        await db.settings.clear();
    }
}

export const settingsService = new SettingsService();