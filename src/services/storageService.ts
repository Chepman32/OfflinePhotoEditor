import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { handleStorageError, useErrorHandler } from '../utils/errorHandler';

// Storage keys
const STORAGE_KEYS = {
  USER_PREFERENCES: 'user_preferences',
  RECENT_PROJECTS: 'recent_projects',
  CACHED_ASSETS: 'cached_assets',
  APP_SETTINGS: 'app_settings',
  ANALYTICS: 'analytics',
} as const;

// Storage configuration
const STORAGE_CONFIG = {
  maxRecentProjects: 20,
  maxCachedImages: 50,
  imageCacheExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
  autoCleanupInterval: 24 * 60 * 60 * 1000, // 24 hours
} as const;

export interface UserPreferences {
  theme: 'light' | 'dark';
  lastUsedTools: string[];
  qualityPreference: number;
  formatPreference: 'jpeg' | 'png';
  hapticFeedback: boolean;
  soundEffects: boolean;
  autoSave: boolean;
  highContrastMode: boolean;
  reduceMotion: boolean;
}

export interface RecentProject {
  id: string;
  name: string;
  thumbnailUri: string;
  originalUri: string;
  createdAt: number;
  lastModified: number;
  fileSize: number;
  edits: EditHistory[];
  isSaved: boolean;
  projectData: any; // Serialized editor state
}

export interface EditHistory {
  id: string;
  tool: string;
  timestamp: number;
  data: any;
  undoData?: any;
}

export interface CachedAsset {
  id: string;
  type: 'filter' | 'mask' | 'font' | 'sticker' | 'template';
  uri: string;
  localUri?: string;
  downloadedAt: number;
  lastUsed: number;
  fileSize: number;
  metadata?: any;
}

export interface AppSettings {
  firstLaunch: boolean;
  lastVersion: string;
  installationDate: number;
  totalEdits: number;
  totalExports: number;
  storageUsed: number;
  lastCleanup: number;
}

class StorageService {
  private static instance: StorageService;
  private cache: Map<string, any> = new Map();
  private cleanupTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeStorage();
    this.startAutoCleanup();
  }

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  private async initializeStorage(): Promise<void> {
    try {
      // Check if this is first launch
      const firstLaunch = await this.getAppSetting('firstLaunch', true);
      if (firstLaunch) {
        await this.setAppSetting('firstLaunch', false);
        await this.setAppSetting('installationDate', Date.now());
        await this.setAppSetting('lastVersion', '1.0.0');
      }

      // Initialize default preferences if they don't exist
      const existingPrefs = await this.getUserPreferences();
      if (!existingPrefs) {
        await this.setUserPreferences(this.getDefaultUserPreferences());
      }

      // Initialize app settings
      const existingSettings = await this.getAppSettings();
      if (!existingSettings) {
        await this.setAppSettings(this.getDefaultAppSettings());
      }

    } catch (error) {
      console.error('Failed to initialize storage:', error);
      handleStorageError({ context: { operation: 'initialize' } });
    }
  }

  private getDefaultUserPreferences(): UserPreferences {
    return {
      theme: 'light',
      lastUsedTools: [],
      qualityPreference: 90,
      formatPreference: 'jpeg',
      hapticFeedback: true,
      soundEffects: false,
      autoSave: true,
      highContrastMode: false,
      reduceMotion: false,
    };
  }

  private getDefaultAppSettings(): AppSettings {
    return {
      firstLaunch: true,
      lastVersion: '1.0.0',
      installationDate: Date.now(),
      totalEdits: 0,
      totalExports: 0,
      storageUsed: 0,
      lastCleanup: Date.now(),
    };
  }

  private startAutoCleanup(): void {
    // Run cleanup every 24 hours
    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, STORAGE_CONFIG.autoCleanupInterval);
  }

  // User Preferences
  async getUserPreferences(): Promise<UserPreferences | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return null;
    }
  }

  async setUserPreferences(preferences: UserPreferences): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
      this.cache.set(STORAGE_KEYS.USER_PREFERENCES, preferences);
    } catch (error) {
      console.error('Failed to set user preferences:', error);
      throw handleStorageError({ context: { operation: 'setUserPreferences' } });
    }
  }

  async updateUserPreferences(updates: Partial<UserPreferences>): Promise<void> {
    try {
      const current = await this.getUserPreferences() || this.getDefaultUserPreferences();
      const updated = { ...current, ...updates };
      await this.setUserPreferences(updated);
    } catch (error) {
      console.error('Failed to update user preferences:', error);
      throw error;
    }
  }

  // Recent Projects
  async getRecentProjects(): Promise<RecentProject[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_PROJECTS);
      const projects: RecentProject[] = data ? JSON.parse(data) : [];
      return projects.sort((a, b) => b.lastModified - a.lastModified);
    } catch (error) {
      console.error('Failed to get recent projects:', error);
      return [];
    }
  }

  async addRecentProject(project: RecentProject): Promise<void> {
    try {
      const projects = await this.getRecentProjects();

      // Remove existing project with same ID
      const filteredProjects = projects.filter(p => p.id !== project.id);

      // Add new project to beginning
      filteredProjects.unshift(project);

      // Keep only the most recent projects
      const limitedProjects = filteredProjects.slice(0, STORAGE_CONFIG.maxRecentProjects);

      await AsyncStorage.setItem(STORAGE_KEYS.RECENT_PROJECTS, JSON.stringify(limitedProjects));

      // Update app statistics
      await this.incrementAppStat('totalEdits');

    } catch (error) {
      console.error('Failed to add recent project:', error);
      throw handleStorageError({ context: { operation: 'addRecentProject' } });
    }
  }

  async updateRecentProject(projectId: string, updates: Partial<RecentProject>): Promise<void> {
    try {
      const projects = await this.getRecentProjects();
      const projectIndex = projects.findIndex(p => p.id === projectId);

      if (projectIndex !== -1) {
        projects[projectIndex] = { ...projects[projectIndex], ...updates };
        await AsyncStorage.setItem(STORAGE_KEYS.RECENT_PROJECTS, JSON.stringify(projects));
      }
    } catch (error) {
      console.error('Failed to update recent project:', error);
      throw error;
    }
  }

  async removeRecentProject(projectId: string): Promise<void> {
    try {
      const projects = await this.getRecentProjects();
      const filteredProjects = projects.filter(p => p.id !== projectId);
      await AsyncStorage.setItem(STORAGE_KEYS.RECENT_PROJECTS, JSON.stringify(filteredProjects));
    } catch (error) {
      console.error('Failed to remove recent project:', error);
      throw error;
    }
  }

  async clearRecentProjects(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.RECENT_PROJECTS, JSON.stringify([]));
    } catch (error) {
      console.error('Failed to clear recent projects:', error);
      throw error;
    }
  }

  // Cached Assets
  async getCachedAssets(): Promise<CachedAsset[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_ASSETS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get cached assets:', error);
      return [];
    }
  }

  async addCachedAsset(asset: CachedAsset): Promise<void> {
    try {
      const assets = await this.getCachedAssets();

      // Remove existing asset with same ID
      const filteredAssets = assets.filter(a => a.id !== asset.id);

      // Add new asset
      filteredAssets.push(asset);

      // Keep only the most recent assets
      const limitedAssets = filteredAssets
        .sort((a, b) => b.lastUsed - a.lastUsed)
        .slice(0, STORAGE_CONFIG.maxCachedImages);

      await AsyncStorage.setItem(STORAGE_KEYS.CACHED_ASSETS, JSON.stringify(limitedAssets));

    } catch (error) {
      console.error('Failed to add cached asset:', error);
      throw handleStorageError({ context: { operation: 'addCachedAsset' } });
    }
  }

  async removeCachedAsset(assetId: string): Promise<void> {
    try {
      const assets = await this.getCachedAssets();
      const filteredAssets = assets.filter(a => a.id !== assetId);

      // Also delete the local file if it exists
      const assetToRemove = assets.find(a => a.id === assetId);
      if (assetToRemove?.localUri) {
        await this.deleteLocalFile(assetToRemove.localUri);
      }

      await AsyncStorage.setItem(STORAGE_KEYS.CACHED_ASSETS, JSON.stringify(filteredAssets));
    } catch (error) {
      console.error('Failed to remove cached asset:', error);
      throw error;
    }
  }

  // App Settings
  async getAppSettings(): Promise<AppSettings | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get app settings:', error);
      return null;
    }
  }

  async setAppSettings(settings: AppSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to set app settings:', error);
      throw handleStorageError({ context: { operation: 'setAppSettings' } });
    }
  }

  async getAppSetting(key: keyof AppSettings, defaultValue?: any): Promise<any> {
    try {
      const settings = await this.getAppSettings();
      return settings ? settings[key] : defaultValue;
    } catch (error) {
      console.error('Failed to get app setting:', error);
      return defaultValue;
    }
  }

  async setAppSetting(key: keyof AppSettings, value: any): Promise<void> {
    try {
      const settings = await this.getAppSettings() || this.getDefaultAppSettings();
      settings[key] = value;
      await this.setAppSettings(settings);
    } catch (error) {
      console.error('Failed to set app setting:', error);
      throw error;
    }
  }

  async incrementAppStat(stat: 'totalEdits' | 'totalExports'): Promise<void> {
    try {
      const currentValue = await this.getAppSetting(stat, 0);
      await this.setAppSetting(stat, currentValue + 1);
    } catch (error) {
      console.error('Failed to increment app stat:', error);
    }
  }

  // File Operations
  async saveImageToLocal(uri: string, filename: string): Promise<string> {
    try {
      const localPath = `${RNFS.DocumentDirectoryPath}/${filename}`;

      if (Platform.OS === 'ios') {
        await RNFS.copyAssetsFileIOS(uri, localPath, 0, 0);
      } else {
        await RNFS.copyFile(uri, localPath);
      }

      return `file://${localPath}`;
    } catch (error) {
      console.error('Failed to save image locally:', error);
      throw handleStorageError({ context: { operation: 'saveImageToLocal' } });
    }
  }

  async deleteLocalFile(uri: string): Promise<void> {
    try {
      const filePath = uri.replace('file://', '');
      const exists = await RNFS.exists(filePath);

      if (exists) {
        await RNFS.unlink(filePath);
      }
    } catch (error) {
      console.error('Failed to delete local file:', error);
    }
  }

  async getFileSize(uri: string): Promise<number> {
    try {
      const filePath = uri.replace('file://', '');
      const stats = await RNFS.stat(filePath);
      return stats.size;
    } catch (error) {
      console.error('Failed to get file size:', error);
      return 0;
    }
  }

  async calculateStorageUsage(): Promise<number> {
    try {
      let totalSize = 0;

      // Calculate recent projects size
      const projects = await this.getRecentProjects();
      for (const project of projects) {
        if (project.thumbnailUri) {
          totalSize += await this.getFileSize(project.thumbnailUri);
        }
      }

      // Calculate cached assets size
      const assets = await this.getCachedAssets();
      for (const asset of assets) {
        if (asset.localUri) {
          totalSize += await this.getFileSize(asset.localUri);
        }
      }

      return totalSize;
    } catch (error) {
      console.error('Failed to calculate storage usage:', error);
      return 0;
    }
  }

  // Cleanup Operations
  async performCleanup(): Promise<void> {
    try {
      console.log('Performing storage cleanup...');

      // Remove expired cached assets
      const assets = await this.getCachedAssets();
      const now = Date.now();
      const validAssets = assets.filter(asset =>
        (now - asset.downloadedAt) < STORAGE_CONFIG.imageCacheExpiry
      );

      if (validAssets.length !== assets.length) {
        await AsyncStorage.setItem(STORAGE_KEYS.CACHED_ASSETS, JSON.stringify(validAssets));

        // Delete local files for removed assets
        const removedAssets = assets.filter(asset => !validAssets.includes(asset));
        for (const asset of removedAssets) {
          if (asset.localUri) {
            await this.deleteLocalFile(asset.localUri);
          }
        }
      }

      // Update last cleanup time
      await this.setAppSetting('lastCleanup', now);
      await this.setAppSetting('storageUsed', await this.calculateStorageUsage());

      console.log('Storage cleanup completed');
    } catch (error) {
      console.error('Failed to perform cleanup:', error);
    }
  }

  // Utility Methods
  async clearAllData(): Promise<void> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
      this.cache.clear();
    } catch (error) {
      console.error('Failed to clear all data:', error);
      throw handleStorageError({ context: { operation: 'clearAllData' } });
    }
  }

  async exportData(): Promise<string> {
    try {
      const data = {
        userPreferences: await this.getUserPreferences(),
        recentProjects: await this.getRecentProjects(),
        appSettings: await this.getAppSettings(),
        exportDate: Date.now(),
      };

      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  }

  async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);

      if (data.userPreferences) {
        await this.setUserPreferences(data.userPreferences);
      }

      if (data.recentProjects) {
        await AsyncStorage.setItem(STORAGE_KEYS.RECENT_PROJECTS, JSON.stringify(data.recentProjects));
      }

      if (data.appSettings) {
        await this.setAppSettings(data.appSettings);
      }

    } catch (error) {
      console.error('Failed to import data:', error);
      throw handleStorageError({ context: { operation: 'importData' } });
    }
  }

  // Cleanup on app close
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

// Export singleton instance
export const storageService = StorageService.getInstance();

// Export types and utilities
export { STORAGE_KEYS, STORAGE_CONFIG };
